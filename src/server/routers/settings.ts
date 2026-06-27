import { router, creatorProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const settingsRouter = router({
  get: creatorProcedure.query(async ({ ctx }) => {
    return prisma.tenantSettings.findUnique({
      where: { tenantId: ctx.tenantId },
    });
  }),

  update: creatorProcedure
    .input(
      z.object({
        customDomain: z.string().optional(),
        logoUrl: z.string().optional(),
        brandColor: z.string().optional(),
        welcomeMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.tenantSettings.upsert({
        where: { tenantId: ctx.tenantId },
        update: {
          customDomain: input.customDomain || null,
          logoUrl: input.logoUrl || null,
          brandColor: input.brandColor || null,
          welcomeMessage: input.welcomeMessage || null,
        },
        create: {
          tenantId: ctx.tenantId,
          customDomain: input.customDomain || null,
          logoUrl: input.logoUrl || null,
          brandColor: input.brandColor || null,
          welcomeMessage: input.welcomeMessage || null,
        },
      });
    }),
});
