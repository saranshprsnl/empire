import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';
import { AIManager } from '../services/ai-service';

const aiQueue = new Queue('ai-queue', { connection: getRedisConnectionOptions() });
const aiManager = new AIManager();

export const aiRouter = router({
  getInsights: creatorProcedure.query(async ({ ctx }) => {
    let insights = await prisma.aIInsight.findMany({
      where: { dismissedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-generate starting insights if empty
    if (insights.length === 0) {
      const generated = await aiManager.generateInsight(ctx.tenantId);
      
      // Store generated insights in DB
      const creations = generated.map((ins) =>
        prisma.aIInsight.create({
          data: {
            tenantId: ctx.tenantId,
            type: ins.type,
            severity: ins.severity,
            title: ins.title,
            description: ins.description,
            data: ins.data,
          },
        })
      );
      await Promise.all(creations);

      insights = await prisma.aIInsight.findMany({
        where: { dismissedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    }

    return insights;
  }),

  generateInsights: creatorProcedure.mutation(async ({ ctx }) => {
    const job = await aiQueue.add('generate-insights', {
      tenantId: ctx.tenantId,
    });
    return { jobId: job.id };
  }),

  dismissInsight: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.aIInsight.update({
        where: { id: input.id },
        data: { dismissedAt: new Date() },
      });
    }),

  suggestPricing: creatorProcedure.query(async ({ ctx }) => {
    return aiManager.suggestPricing(ctx.tenantId);
  }),

  forecastRevenue: creatorProcedure.query(async ({ ctx }) => {
    return aiManager.forecastRevenue(ctx.tenantId, 30);
  }),
});
export default aiRouter;
