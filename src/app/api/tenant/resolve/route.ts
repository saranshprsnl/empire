import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Resolves a tenant slug to its corresponding tenant ID.
 * This is called by the middleware to avoid loading Prisma database drivers in the Edge context.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

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

    return NextResponse.json({ tenantId: tenant.id });
  } catch (error) {
    console.error('Error resolving tenant slug:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
