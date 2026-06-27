import { ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

let redisInstance: IORedis | null = null;

/**
 * Parses REDIS_URL from environmental variables into clean connection options for BullMQ.
 * Avoids direct instantiation of third-party clients to bypass type mismatches.
 */
export function getRedisConnectionOptions(): ConnectionOptions {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

/**
 * Retrieves a shared singleton Redis client instance.
 */
export function getRedisClient(): IORedis {
  if (!redisInstance) {
    redisInstance = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return redisInstance;
}
export default getRedisClient;
