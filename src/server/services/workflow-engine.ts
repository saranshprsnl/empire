import prisma from '@/lib/prisma';
import { runWithTenant } from '@/lib/tenant-context';
import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';

const emailQueue = new Queue('email-queue', { connection: getRedisConnectionOptions() });

interface WorkflowAction {
  type: 'SEND_EMAIL' | 'ADD_TAG' | 'CREATE_TASK';
  config: Record<string, any>;
}

/**
 * Trigger-Action Automation Engine.
 * Evaluates triggers and runs database actions or queues tasks.
 */
export const WorkflowEngine = {
  /**
   * Triggers all active workflows matching the given trigger type and tenant space.
   */
  async trigger(tenantId: string, triggerType: string, contextData: { memberId: string; email?: string; name?: string }) {
    console.log(`[Workflow Engine] Triggered event: ${triggerType} for tenant ${tenantId}`);

    return runWithTenant(tenantId, async () => {
      // Find all active workflows for this trigger type
      const workflows = await prisma.workflow.findMany({
        where: {
          isActive: true,
        },
      });

      const matchedWorkflows = workflows.filter((w) => {
        const triggerConfig = w.trigger as any;
        return triggerConfig?.type === triggerType;
      });

      console.log(`[Workflow Engine] Found ${matchedWorkflows.length} matching workflows`);

      for (const w of matchedWorkflows) {
        const actions = (w.actions as unknown as WorkflowAction[]) || [];
        
        for (const action of actions) {
          try {
            if (action.type === 'SEND_EMAIL') {
              const toEmail = contextData.email;
              if (toEmail) {
                await emailQueue.add('send-email', {
                  to: toEmail,
                  template: 'broadcast',
                  data: {
                    name: contextData.name || 'Member',
                    subject: action.config.subject || 'Automated Update',
                    body: action.config.body || 'Thank you for participating!',
                  },
                });
                console.log(`[Workflow Engine] Enqueued automated email to ${toEmail}`);
              }
            }

            if (action.type === 'ADD_TAG') {
              const tagToAdd = action.config.tag;
              if (tagToAdd && contextData.memberId) {
                const member = await prisma.member.findUnique({
                  where: { id: contextData.memberId },
                  select: { tags: true },
                });
                if (member && !member.tags.includes(tagToAdd)) {
                  await prisma.member.update({
                    where: { id: contextData.memberId },
                    data: {
                      tags: [...member.tags, tagToAdd],
                    },
                  });
                  console.log(`[Workflow Engine] Automatically added tag #${tagToAdd} to member ${contextData.memberId}`);
                }
              }
            }

            if (action.type === 'CREATE_TASK') {
              // Automatically append administrative task
              const creator = await prisma.user.findFirst({
                where: { role: 'CREATOR' },
              });
              if (creator) {
                const rawPriority = String(action.config.priority || 'MEDIUM').toUpperCase();
                const validPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(rawPriority)
                  ? (rawPriority as any)
                  : 'MEDIUM';

                await prisma.task.create({
                  data: {
                    tenantId,
                    title: action.config.title || 'Automated Workflow Task',
                    description: action.config.description || 'Created by automation engine.',
                    priority: validPriority,
                    createdById: creator.id,
                    relatedMemberId: contextData.memberId,
                  },
                });
                console.log(`[Workflow Engine] Created automated administrative task.`);
              }
            }
          } catch (err) {
            console.error(`[Workflow Engine] Error executing action ${action.type}:`, err);
          }
        }

        // Increment run count
        await prisma.workflow.update({
          where: { id: w.id },
          data: {
            runCount: { increment: 1 },
            lastRunAt: new Date(),
          },
        });
      }
    });
  },
};
export default WorkflowEngine;
