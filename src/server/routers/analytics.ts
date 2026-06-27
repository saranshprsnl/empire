import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';

export const analyticsRouter = router({
  getOverview: creatorProcedure.query(async () => {
    // 1. Calculate active members count
    const activeMembersCount = await prisma.member.count({
      where: { status: 'ACTIVE' },
    });

    // 2. Sum MRR (Monthly Recurring Revenue) from active subscriptions
    const activePayingMembers = await prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        tierId: { not: null },
      },
      include: { tier: true },
    });

    let mrr = 0;
    activePayingMembers.forEach((m) => {
      if (m.tier) {
        mrr += Number(m.tier.price);
      }
    });

    const arr = mrr * 12;

    // 3. Compute dynamic health score (using active member ratio scaled up to 100)
    const totalMembers = await prisma.member.count();
    const healthScore = totalMembers > 0 ? Math.round((activeMembersCount / totalMembers) * 100) : 50;

    return {
      mrr,
      arr,
      activeMembersCount,
      healthScore,
    };
  }),
});
