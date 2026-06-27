import { router, protectedProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { TaskStatus, Priority } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(TaskStatus).optional(),
      })
    )
    .query(async ({ input }) => {
      return prisma.task.findMany({
        where: {
          status: input.status,
        },
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
        dueDate: z.date().optional(),
        assignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirst({
        where: { email: ctx.userId || '' },
      });
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authorized administrative user account not found.',
        });
      }

      return prisma.task.create({
        data: {
          tenantId: ctx.tenantId,
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          dueDate: input.dueDate || null,
          assignedToId: input.assignedToId || null,
          createdById: user.id,
        },
        include: {
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(Priority).optional(),
        dueDate: z.date().optional(),
        assignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.task.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description || undefined,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
          assignedToId: input.assignedToId || undefined,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.task.delete({
        where: { id: input.id },
      });
    }),
});
