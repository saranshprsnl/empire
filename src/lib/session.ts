import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

interface MagicLinkData {
  email: string;
  tenantId: string;
}

interface MemberSessionData {
  memberId: string;
  tenantId: string;
}

/**
 * Generates a one-time passwordless magic link token and caches it in Redis for 15 minutes.
 */
export async function createMagicLinkToken(email: string, tenantId: string): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await redis.setex(`magic:${token}`, 15 * 60, JSON.stringify({ email, tenantId }));
  return token;
}

/**
 * Verifies a magic link token, consumes it immediately (one-time use), and returns the payload.
 */
export async function verifyMagicLinkToken(token: string): Promise<MagicLinkData | null> {
  const data = await redis.get(`magic:${token}`);
  if (!data) return null;
  await redis.del(`magic:${token}`); // Consume immediately
  return JSON.parse(data);
}

/**
 * Creates a lightweight session for a logged-in member, persisting the mapping in Redis for 7 days.
 */
export async function createMemberSession(memberId: string, tenantId: string): Promise<string> {
  const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await redis.setex(`session:${sessionToken}`, 7 * 24 * 60 * 60, JSON.stringify({ memberId, tenantId }));
  return sessionToken;
}

/**
 * Checks if a member session token is active and valid.
 */
export async function getMemberSession(sessionToken: string): Promise<MemberSessionData | null> {
  const data = await redis.get(`session:${sessionToken}`);
  if (!data) return null;
  return JSON.parse(data);
}

/**
 * Revokes a member session.
 */
export async function destroyMemberSession(sessionToken: string): Promise<void> {
  await redis.del(`session:${sessionToken}`);
}
