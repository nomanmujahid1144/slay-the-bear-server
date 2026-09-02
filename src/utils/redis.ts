import Redis from 'ioredis';
import config from '../config';
import { logger } from './logger';

const redis = new Redis(config.AUTH_REDIS_URL);

redis.on('error', (err) => {
    // Fail-open policy (agreed with Server A): log the error but never crash
    // the app over a Redis outage. Auth still works; revocation is degraded
    // until Redis recovers.
    logger.error('Auth Redis connection error', { error: err.message });
});

const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24h — matches Server A's SESSION_TTL_SECONDS

export const RevocationService = {
    /**
     * Revoke a single token by jti — used on normal logout.
     * TTL = remaining lifetime of the token being revoked.
     */
    async revokeToken(jti: string, exp: number): Promise<void> {
        const remainingSeconds = exp - Math.floor(Date.now() / 1000);
        if (remainingSeconds <= 0) return; // already expired, nothing to do

        try {
            await redis.set(`stb:revoked:jti:${jti}`, '1', 'EX', remainingSeconds);
        } catch (error: any) {
            logger.error('Failed to write jti revocation key', { error: error.message, jti });
        }
    },

    /**
     * Revoke ALL tokens for a user — used on "logout everywhere".
     * TTL = one full session lifetime (24h), NOT the current token's remaining
     * life — this must outlive every token issued before the cutoff.
     */
    async revokeAllForUser(sub: string): Promise<void> {
        const nowSeconds = Math.floor(Date.now() / 1000);
        try {
            await redis.set(`stb:revoked:user:${sub}`, String(nowSeconds), 'EX', SESSION_TTL_SECONDS);
        } catch (error: any) {
            logger.error('Failed to write user revocation cutoff key', { error: error.message, sub });
        }
    },
};

export default redis;