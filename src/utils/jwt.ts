import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import { JWTPayload, TokenResponse } from '../types';
import { ApiError } from './ApiError';

export class JWTUtil {
    // Generate access token (short-lived)
    static generateAccessToken(payload: JWTPayload): string {
        return jwt.sign(
            payload,
            config.JWT_ACCESS_SECRET,
            { expiresIn: config.JWT_ACCESS_EXPIRY } as jwt.SignOptions
        );
    }

    // Generate refresh token (long-lived)
    static generateRefreshToken(payload: JWTPayload): string {
        return jwt.sign(
            payload,
            config.JWT_REFRESH_SECRET,
            { expiresIn: config.JWT_REFRESH_EXPIRY } as jwt.SignOptions
        );
    }

    // Generate both access and refresh tokens
    static generateTokenPair(payload: JWTPayload): TokenResponse {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }

    // Verify access token
    static verifyAccessToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.JWT_ACCESS_SECRET) as JWTPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized('Access token has expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.unauthorized('Invalid access token');
            }
            throw ApiError.unauthorized('Token verification failed');
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.JWT_REFRESH_SECRET) as JWTPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized('Refresh token has expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.unauthorized('Invalid refresh token');
            }
            throw ApiError.unauthorized('Token verification failed');
        }
    }

    // Decode token without verification (for debugging)
    static decode(token: string): JWTPayload | null {
        return jwt.decode(token) as JWTPayload | null;
    }
}