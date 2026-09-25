// src/utils/twelvedata/twelvedata-cache.config.ts
//
// Redis cache for Twelve Data market-data (real-time quotes, logos, search).
// This is a DEDICATED Upstash Redis instance (slaythebear-market-data),
// separate from both the auth Redis (AUTH_REDIS_URL, src/utils/redis.ts) and
// the Finnhub REST-based cache (UPSTASH_REDIS_REST_URL, src/config/redis.config.ts).
//
// Connected via MARKET_DATA_REDIS_URL, a TCP (rediss://) connection string —
// that's why this uses `ioredis` (same client as src/utils/redis.ts) rather
// than the `@upstash/redis` REST client redis.config.ts uses. Two different
// Upstash access modes, two different clients; same fail-open philosophy.

import Redis from 'ioredis';
import config from '../../config';
import { logger } from '../logger';

const redis = new Redis(config.MARKET_DATA_REDIS_URL);

redis.on('error', (err) => {
    // Fail-open policy, same as the auth Redis: log it, never crash the app
    // over a Redis outage. Live quotes just fall back to REST until it recovers.
    logger.error('Market data Redis connection error', { error: err.message });
});

// Cache TTL constants (in seconds)
export const CACHE_TTL_TD = {
    // The WS service overwrites this on every tick, so in normal operation it
    // never gets close to expiring. This is purely a SAFETY NET: if the WS
    // connection silently drops, the stale price disappears from the cache
    // instead of being served forever as "live", and the next request falls
    // back to a fresh REST call. Applies to every symbol in every market,
    // including mutual funds — see twelvedata-symbols.config.ts.
    LIVE_PRICE: 60,

    // REST /quote fallback cache — protects against a burst of requests for
    // the same symbol before its first WS tick has arrived (or between ticks
    // for a quiet symbol like a mutual fund).
    QUOTE_SNAPSHOT: 20,

    // Logos essentially never change — cache for a month.
    LOGO: 60 * 60 * 24 * 30,

    // Symbol search results for the same query rarely change hour to hour.
    SEARCH: 60 * 60,
} as const;

// Cache key prefixes — all namespaced under `td:` so nothing collides with
// anything else that might ever share this Redis instance.
export const CACHE_KEYS_TD = {
    LIVE_PRICE: (symbol: string) => `td:live:price:${symbol.toUpperCase()}`,
    QUOTE: (symbol: string) => `td:quote:${symbol.toUpperCase()}`,
    LOGO: (symbol: string) => `td:logo:${symbol.toUpperCase()}`,
    SEARCH: (query: string) => `td:search:${query.toLowerCase()}`,
} as const;

// Helper: get from cache
export async function getCacheTD<T>(key: string): Promise<T | null> {
    try {
        const raw = await redis.get(key);
        if (!raw) return null;

        return JSON.parse(raw) as T;
    } catch (error: any) {
        logger.error(`❌ Market data Redis GET error for key ${key}:`, error.message);
        return null; // Fail silently — don't crash the app if Redis is down
    }
}

// Helper: set cache with TTL
export async function setCacheTD<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (error: any) {
        logger.error(`❌ Market data Redis SET error for key ${key}:`, error.message);
        // Fail silently — continue even if caching fails
    }
}

// Helper: delete cache key
export async function deleteCacheTD(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error: any) {
        logger.error(`❌ Market data Redis DELETE error for key ${key}:`, error.message);
    }
}

// Test Redis connection on startup
export async function testMarketDataRedisConnection(): Promise<void> {
    try {
        await redis.ping();
        logger.info('✅ Market data Redis (Upstash) connected successfully');
    } catch (error: any) {
        logger.error('❌ Market data Redis connection failed:', error.message);
        // Don't crash the app — Redis failure is non-fatal
    }
}

export default redis;