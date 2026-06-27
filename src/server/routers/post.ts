import { router, protectedProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PostType } from '@prisma/client';

export const postRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const limit = input.limit;
      const items = await prisma.post.findMany({
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: { id: true, name: true, avatarUrl: true },
          },
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

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        content: z.string().min(1),
        type: z.nativeEnum(PostType).default(PostType.TEXT),
        mediaUrls: z.array(z.string()).default([]),
        isAnnouncement: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let userId: string | null = null;
      let memberId: string | null = null;

      if (ctx.userId) {
        // Resolve poster profile: check User table first
        const user = await prisma.user.findFirst({
          where: { email: ctx.userId },
        });
        if (user) {
          userId = user.id;
        } else {
          // If not found in User, check if they are in the Member table
          const member = await prisma.member.findFirst({
            where: { email: ctx.userId },
          });
          if (member) {
            memberId = member.id;
          }
        }
      }

      return prisma.post.create({
        data: {
          tenantId: ctx.tenantId,
          userId,
          memberId,
          title: input.title || null,
          content: input.content,
          type: input.type,
          mediaUrls: input.mediaUrls,
          isAnnouncement: input.isAnnouncement,
        },
      });
    }),

  like: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.post.update({
        where: { id: input.id },
        data: {
          likes: { increment: 1 },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.post.delete({
        where: { id: input.id },
      });
    }),
});
