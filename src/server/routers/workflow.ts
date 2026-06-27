import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const workflowRouter = router({
  list: creatorProcedure.query(async () => {
    return prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }),

  create: creatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        trigger: z.record(z.string(), z.any()), // trigger description json
        actions: z.array(z.record(z.string(), z.any())), // list of actions to execute
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.workflow.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          description: input.description || null,
          trigger: input.trigger,
          actions: input.actions,
          isActive: true,
        },
      });
    }),

  toggle: creatorProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.workflow.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
});
