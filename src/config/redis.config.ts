import { Redis } from '@upstash/redis';
import config from './index';
import { logger } from '../utils/logger';

// Initialize Upstash Redis client
const redis = new Redis({
    url: config.UPSTASH_REDIS_REST_URL,
    token: config.UPSTASH_REDIS_REST_TOKEN,
});

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    CRYPTO_QUOTES: 30,       // 30 seconds — crypto prices update frequently
    FOREX_QUOTES: 60,        // 60 seconds — forex prices update less frequently
    CRYPTO_SYMBOLS: 86400,   // 24 hours — symbol list rarely changes
    FOREX_SYMBOLS: 86400,    // 24 hours — symbol list rarely changes
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
    CRYPTO_QUOTE: (symbol: string) => `finnhub:crypto:quote:${symbol}`,
    CRYPTO_QUOTES_ALL: 'finnhub:crypto:quotes:all',
    CRYPTO_SYMBOLS: (exchange: string) => `finnhub:crypto:symbols:${exchange}`,
    FOREX_QUOTE: (symbol: string) => `finnhub:forex:quote:${symbol}`,
    FOREX_QUOTES_ALL: 'finnhub:forex:quotes:all',
    FOREX_SYMBOLS: (exchange: string) => `finnhub:forex:symbols:${exchange}`,
} as const;

// Helper: get from cache
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get<T>(key);
        if (data) {
            logger.info(`✅ Cache HIT: ${key}`);
        }
        return data;
    } catch (error) {
        logger.error(`❌ Redis GET error for key ${key}:`, error);
        return null; // Fail silently — don't crash the app if Redis is down
    }
}

// Helper: set cache with TTL
export async function setCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
        logger.info(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
        logger.error(`❌ Redis SET error for key ${key}:`, error);
        // Fail silently — continue even if caching fails
    }
}

// Helper: delete cache key
export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key);
        logger.info(`🗑️ Cache DELETE: ${key}`);
    } catch (error) {
        logger.error(`❌ Redis DELETE error for key ${key}:`, error);
    }
}

// Test Redis connection on startup
export async function testRedisConnection(): Promise<void> {
    try {
        await redis.ping();
        logger.info('✅ Redis (Upstash) connected successfully');
    } catch (error) {
        logger.error('❌ Redis connection failed:', error);
        // Don't crash the app — Redis failure is non-fatal
        // The app will still work, just without caching
    }
}

export default redis;