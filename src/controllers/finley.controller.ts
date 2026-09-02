import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { FinleyService } from '../services/finley.service';
import { logger } from '../utils/logger';

/**
 * Extract the real client IP — critical for Server A's rate limiter and
 * disclosure-acceptance logging (see RELAY_INTEGRATION.md section 1).
 */
function getClientIp(req: AuthRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.socket.remoteAddress || req.ip || 'unknown';
}

function getUserToken(req: AuthRequest): string {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
    return req.cookies?.accessToken || '';
}

export class FinleyController {
    static async chat(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const token = getUserToken(req);
            const clientIp = getClientIp(req);
            logger.info('Finley chat request', { userId: req.user?.id });
            const data = await FinleyService.sendMessage(token, clientIp, req.body);
            res.json(data);
        } catch (error: any) {
            // Relay Server A's exact status + error body so the client sees
            // the same codes documented in RELAY_INTEGRATION.md section 3.
            if (error.response) {
                return res.status(error.response.status).json(error.response.data);
            }
            logger.error('Finley chat relay error', { error: error.message });
            next(error);
        }
    }

    static async chatStream(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const token = getUserToken(req);
            const clientIp = getClientIp(req);
            logger.info('Finley chat stream request', { userId: req.user?.id });

            const upstream = await FinleyService.streamMessage(token, clientIp, req.body);

            // Mirror Server A's SSE headers — do NOT buffer.
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();

            // Pipe raw SSE bytes straight through — status/token/done/error/ping
            // all pass unmodified. We don't need to parse them, just relay them.
            upstream.data.pipe(res);

            upstream.data.on('end', () => res.end());

            // If the client disconnects, stop the upstream request too —
            // matches Server A's own disconnect-tracking behavior.
            req.on('close', () => {
                upstream.data.destroy();
            });
        } catch (error: any) {
            if (error.response) {
                return res.status(error.response.status).json(error.response.data);
            }
            logger.error('Finley chat stream relay error', { error: error.message });
            next(error);
        }
    }

    static async getDisclosure(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await FinleyService.getDisclosure();
            res.json(data);
        } catch (error: any) {
            if (error.response) return res.status(error.response.status).json(error.response.data);
            next(error);
        }
    }

    static async getDisclosureStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const token = getUserToken(req);
            const data = await FinleyService.getDisclosureStatus(token);
            res.json(data);
        } catch (error: any) {
            if (error.response) return res.status(error.response.status).json(error.response.data);
            next(error);
        }
    }

    static async acceptDisclosure(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const token = getUserToken(req);
            const clientIp = getClientIp(req);
            const data = await FinleyService.acceptDisclosure(token, clientIp, req.body.version);
            res.json(data);
        } catch (error: any) {
            if (error.response) return res.status(error.response.status).json(error.response.data);
            next(error);
        }
    }
}