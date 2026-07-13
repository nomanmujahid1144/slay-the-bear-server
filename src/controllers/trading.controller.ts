import { Request, Response, NextFunction } from 'express';
import { TradingService } from '../services/trading.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import config from '../config';

export class TradingController {

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    /**
     * GET /api/trading/auth/connect
     * Redirects user to Tradier OAuth login page
     * User logs in to their Tradier account and approves our app
     */
    static async connect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
            const userId = req.user?.id!;
            logger.info(`Tradier OAuth connect for user: ${userId}`);
            const authUrl = TradingService.getAuthorizationUrl(userId);

            // Redirect user to Tradier login page
            return res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/auth/callback
     * Tradier redirects here after user approves our app
     * Exchanges authorization code for access token
     * Saves token + account info to DB
     */
    static async callback(req: Request, res: Response, next: NextFunction) {
        try {
            const code = req.query.code as string;
            // const userId = (req as AuthRequest).user?.id;
            const userId = req.query.state as string;

            logger.info(`Tradier OAuth callback received for user: ${userId}`);

            // Exchange code for token + save to DB
            const accountData = await TradingService.connectAccount(userId!, code);

            // Redirect to frontend success page
            return res.redirect(
                `${config.FRONTEND_URL}/profile?tab=trading&connected=true`
            );
        } catch (error) {
            // Redirect to frontend with error
            return res.redirect(
                `${config.FRONTEND_URL}/profile?tab=trading&connected=false`
            );
        }
    }

    /**
     * DELETE /api/trading/auth/disconnect
     * Disconnects user's Tradier account
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

    /**
     * GET /api/trading/auth/status
     * Returns connection status for the authenticated user
     */
    static async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier status check for user: ${userId}`);

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

    // ============================================
    // ACCOUNT ENDPOINTS
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
     * Returns buying power, cash, equity etc.
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
            console.log(error, 'Error')
            next(error);
        }
    }

    /**
     * GET /api/trading/account/positions
     * Returns current stock holdings
     */
    static async getPositions(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get positions for user: ${userId}`);

            const positions = await TradingService.getPositions(userId);

            return ApiResponseUtil.success(
                res,
                { data: positions, count: positions.length },
                'Positions retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/account/history
     * Returns transaction history
     */
    static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { limit, offset, type, start, end } = req.query;

            logger.info(`Tradier get history for user: ${userId}`);

            const history = await TradingService.getHistory(userId, {
                limit: limit ? parseInt(limit as string, 10) : undefined,
                offset: offset ? parseInt(offset as string, 10) : undefined,
                type: type as string | undefined,
                start: start as string | undefined,
                end: end as string | undefined,
            });

            return ApiResponseUtil.success(
                res,
                { data: history, count: history.length },
                'History retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/account/gainloss
     * Returns closed positions P&L summary
     */
    static async getGainLoss(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { limit, offset, sortBy, sort, start, end } = req.query;

            logger.info(`Tradier get gain/loss for user: ${userId}`);

            const gainLoss = await TradingService.getGainLoss(userId, {
                limit: limit ? parseInt(limit as string, 10) : undefined,
                offset: offset ? parseInt(offset as string, 10) : undefined,
                sortBy: sortBy as string | undefined,
                sort: sort as string | undefined,
                start: start as string | undefined,
                end: end as string | undefined,
            });

            return ApiResponseUtil.success(
                res,
                { data: gainLoss, count: gainLoss.length },
                'Gain/loss retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // ORDER ENDPOINTS
    // ============================================

    /**
     * POST /api/trading/orders/preview
     * Preview an order — shows cost, commission etc.
     * Does NOT place the order
     */
    static async previewOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { symbol, side, quantity, type, duration, price, stop } = req.body;

            logger.info(`Tradier preview order for user: ${userId} — ${side} ${quantity} ${symbol}`);

            const preview = await TradingService.previewOrder(userId, {
                symbol,
                side,
                quantity,
                type,
                duration,
                price,
                stop,
            });

            return ApiResponseUtil.success(
                res,
                preview,
                'Order preview successful',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/trading/orders/place
     * Place a buy or sell order
     * This executes a real trade on Tradier sandbox/production
     */
    static async placeOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { symbol, side, quantity, type, duration, price, stop } = req.body;

            logger.info(`Tradier place order for user: ${userId} — ${side} ${quantity} ${symbol}`);

            const result = await TradingService.placeOrder(userId, {
                symbol,
                side,
                quantity,
                type,
                duration,
                price,
                stop,
            });

            return ApiResponseUtil.success(
                res,
                result,
                `Order placed successfully`,
                201
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/orders
     * Get all orders for the account
     */
    static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Tradier get orders for user: ${userId}`);

            const orders = await TradingService.getOrders(userId);

            return ApiResponseUtil.success(
                res,
                { data: orders, count: orders.length },
                'Orders retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/trading/orders/:orderId
     * Get a single order by ID
     */
    static async getOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const orderId = req.params.orderId as string;

            logger.info(`Tradier get order ${orderId} for user: ${userId}`);

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
     * PUT /api/trading/orders/:orderId
     * Modify an existing order
     */
    static async modifyOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const orderId = req.params.orderId as string;
            const { type, duration, price, stop } = req.body;

            logger.info(`Tradier modify order ${orderId} for user: ${userId}`);

            const result = await TradingService.modifyOrder(userId, orderId, {
                type,
                duration,
                price,
                stop,
            });

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
     * Cancel an existing order
     */
    static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const orderId = req.params.orderId as string;

            logger.info(`Tradier cancel order ${orderId} for user: ${userId}`);

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