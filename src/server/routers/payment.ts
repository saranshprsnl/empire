import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';

export const paymentRouter = router({
  list: creatorProcedure.query(async () => {
    return prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }),
});
