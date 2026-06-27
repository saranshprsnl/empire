import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import IORedis from 'ioredis';

// Open a Redis client for fast key-value lookups in middleware
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';

  // 0. Rate Limiting for API routes (100 req/min limit)
  if (url.pathname.startsWith('/api') && !url.pathname.startsWith('/api/tenant/resolve')) {
    const nextReq = req as any;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || nextReq.ip || '127.0.0.1';
    const limitKey = `ratelimit:${ip}`;
    try {
      const currentCount = await redis.incr(limitKey);
      if (currentCount === 1) {
        await redis.expire(limitKey, 60);
      }
      if (currentCount > 100) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'API rate limit of 100 requests per minute exceeded.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        );
      }
    } catch (err) {
      console.error('[Rate Limiter] Redis check failed in middleware:', err);
    }
  }

  // Skip middleware checks for API tenant resolution routes to prevent loops
  if (url.pathname.startsWith('/api/tenant/resolve')) {
    return NextResponse.next();
  }

  // 1. Extract Tenant Slug
  let slug = '';
  const parts = hostname.split('.');

  // Support subdomain matching in production, fall back to path parsing locally
  if (parts.length > 1 && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    slug = parts[0];
  } else {
    // Local development fallback path: /community/[slug]
    const match = url.pathname.match(/^\/community\/([a-zA-Z0-9-]+)/);
    if (match) {
      slug = match[1];
    }
  }

  // 2. Resolve Tenant ID (using Redis cache & API fallback)
  let tenantId: string | null = null;
  if (slug) {
    tenantId = await redis.get(`tenant_id:${slug}`);
    if (!tenantId) {
      try {
        const resolveUrl = new URL(`/api/tenant/resolve?slug=${slug}`, req.url);
        const res = await fetch(resolveUrl.toString());
        if (res.ok) {
          const data = await res.json();
          tenantId = data.tenantId;
          if (tenantId) {
            // Cache slug to tenant ID mapping in Redis for 24 hours
            await redis.setex(`tenant_id:${slug}`, 24 * 60 * 60, tenantId);
          }
        }
      } catch (err) {
        console.error('Failed to resolve tenant ID in middleware:', err);
      }
    }
  }

  // 3. Inject Tenant Headers
  const requestHeaders = new Headers(req.headers);
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId);
  }

  // 4. Enforce Clerk Authentication (Creators and administrative staff)
  if (isDashboardRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }
  }

  // 5. Enforce Magic Link Auth for Community Members
  const isMemberOnlyRoute =
    url.pathname.includes('/feed') ||
    url.pathname.includes('/events') ||
    url.pathname.includes('/resources') ||
    url.pathname.includes('/courses');

  if (url.pathname.startsWith('/community/') && isMemberOnlyRoute) {
    const sessionToken = req.cookies.get('member-session')?.value;
    let isAuthenticated = false;

    if (sessionToken) {
      const sessionData = await redis.get(`session:${sessionToken}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Ensure the session is bound to the active tenant space
        if (parsed.tenantId === tenantId) {
          isAuthenticated = true;
          requestHeaders.set('x-member-id', parsed.memberId);
        }
      }
    }

    if (!isAuthenticated) {
      const loginUrl = new URL(`/community/${slug}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
