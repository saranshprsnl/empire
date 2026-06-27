import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';

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

  // 2. Resolve Tenant ID & Validate Sessions over HTTP API call
  let tenantId: string | null = null;
  let memberId: string | null = null;

  const sessionToken = req.cookies.get('member-session')?.value || '';

  if (slug) {
    try {
      const resolveUrl = new URL(`/api/tenant/resolve?slug=${slug}&sessionToken=${sessionToken}`, req.url);
      const res = await fetch(resolveUrl.toString());
      if (res.ok) {
        const data = await res.json();
        tenantId = data.tenantId;
        memberId = data.memberId;
      }
    } catch (err) {
      console.error('Failed to resolve tenant ID & validate session in middleware:', err);
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
    if (!memberId) {
      const loginUrl = new URL(`/community/${slug}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
    requestHeaders.set('x-member-id', memberId);
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
