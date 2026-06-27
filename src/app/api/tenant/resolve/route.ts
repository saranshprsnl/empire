import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

/**
 * Resolves a tenant slug to its corresponding tenant ID.
 * If a sessionToken query is provided, verifies session status in Redis
 * and returns the authenticated member ID.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const sessionToken = searchParams.get('sessionToken');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required.' }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    let memberId: string | null = null;

    if (sessionToken) {
      const redis = getRedisClient();
      const sessionData = await redis.get(`session:${sessionToken}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Bind session token validation to the active tenant space
        if (parsed.tenantId === tenant.id) {
          memberId = parsed.memberId;
        }
      }
    }

    return NextResponse.json({
      tenantId: tenant.id,
      memberId,
    });
  } catch (error) {
    console.error('Error resolving tenant slug:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
