import { router, protectedProcedure, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Interval } from '@prisma/client';

export const tierRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.tier.findMany({
      orderBy: { price: 'asc' },
    });
  }),

  create: creatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        interval: z.nativeEnum(Interval).default(Interval.MONTH),
        features: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.tier.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          description: input.description || null,
          price: input.price,
          interval: input.interval,
          features: input.features,
        },
      });
    }),
});
