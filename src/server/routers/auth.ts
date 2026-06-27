import { router, protectedProcedure } from '../trpc';
import prisma from '@/lib/prisma';

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null;
    return prisma.user.findFirst({
      where: { email: ctx.userId },
    });
  }),
});
