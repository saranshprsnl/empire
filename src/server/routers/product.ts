import { router, protectedProcedure, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ProductType } from '@prisma/client';

export const productRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }),

  create: creatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.nativeEnum(ProductType),
        price: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.product.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          description: input.description || null,
          type: input.type,
          price: input.price,
        },
      });
    }),
});
