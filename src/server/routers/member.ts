import { router, protectedProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { MemberStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from '@/lib/redis';

const memberImportQueue = new Queue('member-import-queue', {
  connection: getRedisConnectionOptions(),
});

export const memberRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(MemberStatus).optional(),
        tierId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
        sortBy: z
          .enum(['engagementScore', 'joinedAt', 'lastActiveAt', 'lifetimeValue'])
          .default('joinedAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit;
      const items = await prisma.member.findMany({
        take: limit + 1,
        where: {
          status: input.status,
          tierId: input.tierId,
          tags: input.tags && input.tags.length > 0 ? { hasSome: input.tags } : undefined,
          OR: input.search
            ? [
                { name: { contains: input.search, mode: 'insensitive' } },
                { email: { contains: input.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const member = await prisma.member.findUnique({
        where: { id: input.id },
        include: { tier: true, payments: true },
      });
      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found.',
        });
      }
      return member;
    }),

  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(100),
        phone: z.string().optional(),
        tierId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.member.findFirst({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A member with this email address already exists in your workspace.',
        });
      }

      return prisma.member.create({
        data: {
          tenantId: ctx.tenantId,
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          tierId: input.tierId || null,
          tags: input.tags || [],
          customFields: input.customFields || {},
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        tierId: z.string().optional(),
        status: z.nativeEnum(MemberStatus).optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.member.update({
        where: { id: input.id },
        data: {
          name: input.name,
          phone: input.phone || undefined,
          tierId: input.tierId || undefined,
          status: input.status,
          tags: input.tags,
          customFields: input.customFields || undefined,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.member.delete({
        where: { id: input.id },
      });
    }),

  bulkUpdate: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        updates: z.object({
          tierId: z.string().optional(),
          status: z.nativeEnum(MemberStatus).optional(),
          tags: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {};
      if (input.updates.tierId !== undefined) data.tierId = input.updates.tierId;
      if (input.updates.status !== undefined) data.status = input.updates.status;
      if (input.updates.tags !== undefined) data.tags = input.updates.tags;

      return prisma.member.updateMany({
        where: { id: { in: input.ids } },
        data,
      });
    }),

  getEngagementTimeline: protectedProcedure
    .input(z.object({ id: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return prisma.memberActivity.findMany({
        where: {
          memberId: input.id,
          timestamp: {
            gte: new Date(Date.now() - input.days * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'asc' },
      });
    }),

  getChurnRisk: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const member = await prisma.member.findUnique({
        where: { id: input.id },
        select: { churnRiskScore: true },
      });
      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found.',
        });
      }
      return member.churnRiskScore || 0;
    }),

  import: protectedProcedure
    .input(
      z.object({
        fileUrl: z.string().url(),
        mapping: z.record(z.string(), z.string()),
        tierId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Enqueue import job to BullMQ
      const job = await memberImportQueue.add('import-members', {
        tenantId: ctx.tenantId,
        fileUrl: input.fileUrl,
        mapping: input.mapping,
        tierId: input.tierId,
      });
      return { jobId: job.id };
    }),

  getReferralLink: protectedProcedure
    .query(async ({ ctx }) => {
      const member = await prisma.member.findFirst({
        where: { email: ctx.userId || '' },
      });
      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active member profile not found.',
        });
      }

      let code = member.referralCode;
      if (!code) {
        // Generate a 6-character alphanumeric referral code
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await prisma.member.update({
          where: { id: member.id },
          data: { referralCode: code },
        });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
      });

      return {
        referralCode: code,
        referralUrl: `https://${tenant?.slug || 'community'}.empire.com/signup?ref=${code}`,
      };
    }),

  getReferrals: protectedProcedure
    .query(async ({ ctx }) => {
      const member = await prisma.member.findFirst({
        where: { email: ctx.userId || '' },
      });
      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active member profile not found.',
        });
      }

      return prisma.member.findMany({
        where: { referredById: member.id },
        select: {
          id: true,
          name: true,
          status: true,
          joinedAt: true,
        },
      });
    }),
});
