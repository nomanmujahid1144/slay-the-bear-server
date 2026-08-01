import { Response, NextFunction } from 'express';
import { TradingService } from '../services/trading.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';

// ============================================
// TRADING CONTROLLER
// Handles all HTTP requests for Tradier trading
// All routes require authentication (JWT)
// ============================================

export class TradingController {

    // ============================================
    // AUTH — OAuth Connect Flow
    // ============================================

    /**
     * GET /api/trading/auth/connect
     * Redirect user to Tradier OAuth login page
     */
    static async connect(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier connect request for user: ${userId}`);

            const authUrl = TradingService.getAuthorizationUrl(userId);

            return res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/auth/test-connect/:userId
     * Test connect — for development/testing only
     */
    static async testConnect(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.params.userId;

            const authUrl = TradingService.getAuthorizationUrl(userId);

            return res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/auth/callback
     * Handle OAuth callback from Tradier after user logs in
     */
    static async callback(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { code, state: userId } = req.query as { code: string; state: string };

            logger.info(`Tradier OAuth callback received for user: ${userId}`);

            if (!code || !userId) {
                return res.redirect(`${process.env.FRONTEND_URL}/profile?tab=trading&error=missing_params`);
            }

            await TradingService.connectAccount(userId, code);

            return res.redirect(`${process.env.FRONTEND_URL}/profile?tab=trading&connected=true`);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/auth/status
     * Get Tradier connection status for the authenticated user
     */
    static async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier status request for user: ${userId}`);

            const status = await TradingService.getConnectionStatus(userId);

            return ApiResponseUtil.success(
                res,
                status,
                'Connection status retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/trading/auth/disconnect
     * Disconnect Tradier account for the authenticated user
     */
    static async disconnect(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier disconnect request for user: ${userId}`);

            await TradingService.disconnectAccount(userId);

            return ApiResponseUtil.success(
                res,
                undefined,
                'Tradier account disconnected successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // ACCOUNT DATA
    // ============================================

    /**
     * GET /api/trading/account/profile
     * Returns user's Tradier account profile
     */
    static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get profile for user: ${userId}`);

            const profile = await TradingService.getProfile(userId);

            return ApiResponseUtil.success(
                res,
                profile,
                'Profile retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/account/balances
     * Returns account balances (cash, buying power, equity)
     */
    static async getBalances(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get balances for user: ${userId}`);

            const balances = await TradingService.getBalances(userId);

            return ApiResponseUtil.success(
                res,
                balances,
                'Balances retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/account/positions
     * Returns current open positions
     */
    static async getPositions(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get positions for user: ${userId}`);

            const positions = await TradingService.getPositions(userId);

            return ApiResponseUtil.success(
                res,
                positions,
                'Positions retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/account/history
     * Returns account transaction history
     */
    static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get history for user: ${userId}`);

            const history = await TradingService.getHistory(userId, {});

            return ApiResponseUtil.success(
                res,
                history,
                'History retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/account/gainloss
     * Returns gain/loss for closed positions
     */
    static async getGainLoss(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get gain/loss for user: ${userId}`);

            const gainloss = await TradingService.getGainLoss(userId, {});

            return ApiResponseUtil.success(
                res,
                gainloss,
                'Gain/loss retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // ORDERS
    // ============================================

    /**
     * GET /api/trading/orders
     * Returns all orders for the account
     */
    static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get orders for user: ${userId}`);

            const orders = await TradingService.getOrders(userId);

            return ApiResponseUtil.success(
                res,
                orders,
                'Orders retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/orders/:orderId
     * Returns a specific order by ID
     */
    static async getOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId   = req.user?.id!;
            const { orderId } = req.params;

            logger.info(`Tradier get order: ${orderId} for user: ${userId}`);

            const order = await TradingService.getOrder(userId, orderId);

            return ApiResponseUtil.success(
                res,
                order,
                'Order retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/trading/orders/preview
     * Preview an order — validates without placing
     * Body: { symbol, side, quantity, type, duration, price?, stop? }
     */
    static async previewOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            // Destructure all fields from body
            const {
                symbol,
                side,
                quantity,
                type,
                duration,
                price,
                stop,
            } = req.body;

            logger.info(`Tradier preview order for user: ${userId}, symbol: ${symbol}`);

            const result = await TradingService.previewOrder(
                userId,
                symbol,
                side,
                quantity,
                type,
                duration,
                price,
                stop
            );

            return ApiResponseUtil.success(
                res,
                result,
                'Order preview successful',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/trading/orders/place
     * Place a real order on Tradier brokerage
     * Body: { symbol, side, quantity, type, duration, price?, stop? }
     */
    static async placeOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            // Destructure all fields from body
            const {
                symbol,
                side,
                quantity,
                type,
                duration,
                price,
                stop,
            } = req.body;

            logger.info(`Tradier place order for user: ${userId}, symbol: ${symbol}, side: ${side}`);

            const result = await TradingService.placeOrder(
                userId,
                symbol,
                side,
                quantity,
                type,
                duration,
                price,
                stop
            );

            return ApiResponseUtil.success(
                res,
                result,
                'Order placed successfully',
                201
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/trading/orders/:orderId
     * Modify an existing pending order
     * Body: { type, duration, price?, stop? }
     */
    static async modifyOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId              = req.user?.id!;
            const { orderId }         = req.params;

            // Destructure all fields from body
            const {
                type,
                duration,
                price,
                stop,
            } = req.body;

            logger.info(`Tradier modify order: ${orderId} for user: ${userId}`);

            const result = await TradingService.modifyOrder(
                userId,
                orderId,
                type,
                duration,
                price,
                stop
            );

            return ApiResponseUtil.success(
                res,
                result,
                'Order modified successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/trading/orders/:orderId
     * Cancel an existing pending order
     */
    static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId      = req.user?.id!;
            const { orderId } = req.params;

            logger.info(`Tradier cancel order: ${orderId} for user: ${userId}`);

            const result = await TradingService.cancelOrder(userId, orderId);

            return ApiResponseUtil.success(
                res,
                result,
                'Order cancelled successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }
}

export default TradingController;