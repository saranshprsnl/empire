import { Worker } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';
import { AIManager } from '../services/ai-service';
import prisma from '@/lib/prisma';
import { runWithTenant } from '@/lib/tenant-context';

console.log('[AI Worker] Initializing background AI analyzer...');

const aiManager = new AIManager();

/**
 * BullMQ Worker processing async business intelligence operations.
 */
export const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    if (job.name === 'generate-insights') {
      const { tenantId } = job.data;

      await runWithTenant(tenantId, async () => {
        const insights = await aiManager.generateInsight(tenantId);

        // Save newly generated insights to database
        const dbOperations = insights.map((ins) =>
          prisma.aIInsight.create({
            data: {
              tenantId,
              type: ins.type,
              severity: ins.severity,
              title: ins.title,
              description: ins.description,
              data: ins.data || {},
            },
          })
        );
        await Promise.all(dbOperations);
      });
    }
  },
  {
    connection: getRedisConnectionOptions(),
  }
);

aiWorker.on('completed', (job) => {
  console.log(`[AI Worker] Job ${job.id} processed successfully.`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`[AI Worker] Job ${job?.id} failed to process:`, err);
});

export default aiWorker;
