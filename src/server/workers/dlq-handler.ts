import { QueueEvents } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';
import prisma from '@/lib/prisma';

console.log('[DLQ Handler] Initializing Dead-Letter Queue auditor...');

const queueNames = ['email-queue', 'ai-queue', 'workflow-queue', 'member-import-queue'];

/**
 * Attaches failure handlers across all background workers, logging
 * collapsed job failures to database audit ledgers.
 */
export function startDLQAuditor() {
  queueNames.forEach((queueName) => {
    try {
      const queueEvents = new QueueEvents(queueName, {
        connection: getRedisConnectionOptions(),
      });

      queueEvents.on('failed', async ({ jobId, failedReason }) => {
        console.error(`❌ [DLQ] Job ${jobId} failed in queue "${queueName}". Reason: ${failedReason}`);

        try {
          // Log queue failure events inside system activity logs
          await prisma.activityLog.create({
            data: {
              tenantId: 'system_level_log',
              action: 'QUEUE_JOB_FAILED',
              entityType: 'QUEUE_JOB',
              entityId: jobId,
              changes: {
                queueName,
                failedReason,
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (dbErr) {
          console.error('[DLQ] Failed to write queue event failure logs to Postgres:', dbErr);
        }
      });
    } catch (err) {
      console.error(`[DLQ] Failed to initialize queue events hooks for "${queueName}":`, err);
    }
  });
}
