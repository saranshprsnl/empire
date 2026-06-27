import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';

const emailQueue = new Queue('email-queue', { connection: getRedisConnectionOptions() });

export const communicationRouter = router({
  sendBroadcast: creatorProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        body: z.string().min(1),
        tierId: z.string().optional(), // target specific tier members
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find all target members
      const members = await prisma.member.findMany({
        where: {
          tierId: input.tierId,
          status: 'ACTIVE',
        },
        select: { email: true, name: true },
      });

      // Queue an email job for each member
      const emailJobs = members.map((member) =>
        emailQueue.add('send-email', {
          to: member.email,
          template: 'broadcast',
          data: {
            name: member.name,
            subject: input.subject,
            body: input.body,
          },
        })
      );

      await Promise.all(emailJobs);
      return { success: true, count: members.length };
    }),
});
