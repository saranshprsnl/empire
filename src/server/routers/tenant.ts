import { router, publicProcedure, protectedProcedure, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Plan, TenantStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const tenantRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      include: { settings: true },
    });
  }),

  update: creatorProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        logoUrl: z.string().url().optional().or(z.literal('')),
        primaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          name: input.name,
          description: input.description,
          logoUrl: input.logoUrl || null,
          primaryColor: input.primaryColor,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
        name: z.string().min(1),
        email: z.string().email(),
        creatorName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.tenant.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'The requested business slug is already taken.',
        });
      }

      // Create new tenant and setup default structures in a single transaction
      return prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            slug: input.slug,
            name: input.name,
            plan: Plan.STARTER,
            status: TenantStatus.ACTIVE,
          },
        });

        await tx.tenantSettings.create({
          data: {
            tenantId: tenant.id,
            brandColor: '#6366F1',
          },
        });

        await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: input.email,
            name: input.creatorName,
            role: 'CREATOR',
            status: 'ACTIVE',
          },
        });

        await tx.tier.create({
          data: {
            tenantId: tenant.id,
            name: 'Free Access',
            description: 'Free basic community access.',
            price: 0,
            isDefault: true,
            isPublic: true,
          },
        });

        return tenant;
      });
    }),
});
