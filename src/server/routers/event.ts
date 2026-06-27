import { router, protectedProcedure, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const eventRouter = router({
  list: protectedProcedure.query(async () => {
    return prisma.event.findMany({
      orderBy: { startAt: 'asc' },
    });
  }),

  create: creatorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startAt: z.coerce.date(),
        endAt: z.coerce.date().optional(),
        timezone: z.string(),
        meetingUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.event.create({
        data: {
          tenantId: ctx.tenantId,
          title: input.title,
          description: input.description || null,
          startAt: input.startAt,
          endAt: input.endAt || null,
          timezone: input.timezone,
          meetingUrl: input.meetingUrl || null,
        },
      });
    }),

  rsvp: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        status: z.enum(['YES', 'NO', 'MAYBE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findFirst({
        where: { email: ctx.userId || '' },
      });
      if (!member) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'A valid community member account is required to RSVP.',
        });
      }

      return prisma.eventRSVP.upsert({
        where: {
          eventId_memberId: {
            eventId: input.eventId,
            memberId: member.id,
          },
        },
        update: { status: input.status },
        create: {
          eventId: input.eventId,
          memberId: member.id,
          status: input.status,
        },
      });
    }),
});
