import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

const TTL = 60 * 60 * 48; // 48 hours

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await getRedis().get<T>(key);
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  try {
    await getRedis().set(key, value, { ex: TTL });
  } catch {
    // non-fatal — app works without cache
  }
}

export function cacheKey(city: string, category: string, season: string): string {
  return `${city.toLowerCase()}:${category}:${season}`.replace(/\s+/g, "-");
}

function getSeason(date = new Date()): string {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export function attractionCacheKey(city: string, category: string): string {
  return cacheKey(city, category, getSeason());
}
