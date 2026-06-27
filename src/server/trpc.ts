import { initTRPC, TRPCError } from '@trpc/server';
import { runWithTenant } from '@/lib/tenant-context';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';

export interface TRPCContext {
  userId: string | null;
  tenantId: string | null;
  role: UserRole | null;
  ip: string;
}

/**
 * Creates the tRPC context per request, extracting authentication tokens from Clerk
 * and parsing the multi-tenant context from request headers (x-tenant-id).
 */
export async function createTRPCContext(opts: { req: Request }): Promise<TRPCContext> {
  const req = opts.req as NextRequest;
  const nextReq = req as any;
  const tenantId = req.headers.get('x-tenant-id');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || nextReq.ip || '127.0.0.1';
  
  let userId: string | null = null;
  try {
    const auth = getAuth(req);
    userId = auth.userId;
  } catch {
    // Auth context absent or invalid (e.g. public pages)
  }

  let role: UserRole | null = null;
  if (userId && tenantId) {
    // Determine the user's role inside the tenant space using the isolated prisma client
    const dbUser = await runWithTenant(tenantId, () =>
      prisma.user.findFirst({
        where: { email: userId || '' },
      })
    );
    role = dbUser?.role || null;
  }

  return {
    userId,
    tenantId,
    role,
    ip,
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

/**
 * Procedure that requires an active tenant context and wraps the request execution
 * inside AsyncLocalStorage to enforce data partition.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tenant context header (x-tenant-id) is missing.',
    });
  }

  // Enforce rate limit check: 100 requests per minute per IP address
  const rateLimitResult = await rateLimit(ctx.ip, 100, 60);
  if (!rateLimitResult.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'API rate limit of 100 requests per minute exceeded. Please try again later.',
    });
  }

  return runWithTenant(ctx.tenantId, async () => {
    return next({
      ctx: {
        ...ctx,
        tenantId: ctx.tenantId as string,
      },
    });
  });
});

/**
 * Procedure that requires a valid authenticated user session (creator/staff role).
 */
export const creatorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication session is required.',
    });
  }

  const allowedRoles: UserRole[] = ['CREATOR', 'ADMIN', 'EDITOR', 'COMMUNITY_MANAGER', 'VA'];
  if (!ctx.role || !allowedRoles.includes(ctx.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied: insufficient administrative permissions.',
    });
  }

  return next();
});
export default t;
