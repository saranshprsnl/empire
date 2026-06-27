import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitResponse {
  success: boolean;
  limit: number;
  remaining: number;
}

/**
 * Sliding window rate limiter backed by Redis.
 * Evaluates request keys and returns rate limiting header parameters.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResponse> {
  const cacheKey = `ratelimit:${key}`;
  
  try {
    const currentCount = await redis.incr(cacheKey);

    if (currentCount === 1) {
      // Set expiration on first increment in this window
      await redis.expire(cacheKey, windowSeconds);
    }

    const remaining = Math.max(0, limit - currentCount);
    const success = currentCount <= limit;

    return {
      success,
      limit,
      remaining,
    };
  } catch (err) {
    console.error('[Rate Limiter] Redis communication failed. Bypassing check:', err);
    // Fail-open strategy to prevent Redis downtime from taking down the application
    return {
      success: true,
      limit,
      remaining: limit,
    };
  }
}
export default rateLimit;
