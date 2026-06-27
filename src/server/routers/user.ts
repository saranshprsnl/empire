import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const userRouter = router({
  list: creatorProcedure.query(async () => {
    return prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
  }),

  create: creatorProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.create({
        data: {
          tenantId: ctx.tenantId,
          email: input.email,
          name: input.name,
          role: input.role,
          status: 'ACTIVE',
        },
      });
    }),
});
