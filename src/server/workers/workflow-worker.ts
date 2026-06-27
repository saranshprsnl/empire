import { Worker } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';
import { WorkflowEngine } from '../services/workflow-engine';

console.log('[Workflow Worker] Initializing background automation executor...');

/**
 * BullMQ Worker processing enqueued trigger-action workflow runs.
 */
export const workflowWorker = new Worker(
  'workflow-queue',
  async (job) => {
    if (job.name === 'workflow:execute') {
      const { tenantId, triggerType, contextData } = job.data;
      await WorkflowEngine.trigger(tenantId, triggerType, contextData);
    }
  },
  {
    connection: getRedisConnectionOptions(),
  }
);

workflowWorker.on('completed', (job) => {
  console.log(`[Workflow Worker] Job ${job.id} completed successfully.`);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`[Workflow Worker] Job ${job?.id} failed to execute:`, err);
});

export default workflowWorker;
