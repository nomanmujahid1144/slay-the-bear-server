import { Router } from 'express';
import { TradingController } from '../controllers/trading.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
    tradierCallbackSchema,
    getAccountHistorySchema,
    getGainLossSchema,
    previewOrderSchema,
    placeOrderSchema,
    getOrderSchema,
    modifyOrderSchema,
    cancelOrderSchema,
} from '../validators/trading.validator';
import config from '../config';
import TradingService from '../services/trading.service';

const router = Router();

// ============================================
// AUTH ROUTES
// ============================================

router.get('/auth/test-connect/:userId', async (req, res, next) => {
    try {
        const userId = req.params.userId;

        console.log('=== TEST CONNECT HIT ===');
        console.log('userId from params:', userId);
        console.log('TRADIER_CLIENT_ID:', config.TRADIER_CLIENT_ID);
        console.log('TRADIER_CALLBACK_URL:', config.TRADIER_CALLBACK_URL);
        console.log('TRADIER_BASIC_AUTH:', config.TRADIER_BASIC_AUTH ? '✅ set' : '❌ MISSING');

        const authUrl = TradingService.getAuthorizationUrl(userId);

        console.log('Generated auth URL:', authUrl);
        console.log('=== REDIRECTING ===');

        return res.redirect(authUrl);
    } catch (error: any) {
        console.error('TEST CONNECT ERROR:', error.message);
        next(error);
    }
});

/**
 * @route   GET /api/trading/auth/connect
 * @desc    Redirect user to Tradier OAuth login page
 * @access  Private
 */
router.get(
    '/auth/connect',
    authenticate,
    TradingController.connect
);

/**
 * @route   GET /api/trading/auth/callback
 * @desc    Handle Tradier OAuth callback — exchange code for token
 * @access  Private
 * @note    Tradier redirects here after user approves our app
 */
router.get(
    '/auth/callback',
    // authenticate,
    // validate(tradierCallbackSchema),
    TradingController.callback
);

/**
 * @route   DELETE /api/trading/auth/disconnect
 * @desc    Disconnect user's Tradier account
 * @access  Private
 */
router.delete(
    '/auth/disconnect',
    authenticate,
    TradingController.disconnect
);

/**
 * @route   GET /api/trading/auth/status
 * @desc    Get Tradier connection status for authenticated user
 * @access  Private
 */
router.get(
    '/auth/status',
    authenticate,
    TradingController.getStatus
);

// ============================================
// ACCOUNT ROUTES
// ============================================

/**
 * @route   GET /api/trading/account/profile
 * @desc    Get user's Tradier account profile
 * @access  Private
 */
router.get(
    '/account/profile',
    authenticate,
    TradingController.getProfile
);

/**
 * @route   GET /api/trading/account/balances
 * @desc    Get account balances (buying power, cash, equity)
 * @access  Private
 */
router.get(
    '/account/balances',
    authenticate,
    TradingController.getBalances
);

/**
 * @route   GET /api/trading/account/positions
 * @desc    Get current stock holdings
 * @access  Private
 */
router.get(
    '/account/positions',
    authenticate,
    TradingController.getPositions
);

/**
 * @route   GET /api/trading/account/history
 * @desc    Get account transaction history
 * @access  Private
 */
router.get(
    '/account/history',
    authenticate,
    validate(getAccountHistorySchema),
    TradingController.getHistory
);

/**
 * @route   GET /api/trading/account/gainloss
 * @desc    Get closed positions gain/loss summary
 * @access  Private
 */
router.get(
    '/account/gainloss',
    authenticate,
    validate(getGainLossSchema),
    TradingController.getGainLoss
);

// ============================================
// ORDER ROUTES
// ============================================

/**
 * @route   POST /api/trading/orders/preview
 * @desc    Preview an order before placing it (no trade executed)
 * @access  Private
 */
router.post(
    '/orders/preview',
    authenticate,
    validate(previewOrderSchema),
    TradingController.previewOrder
);

/**
 * @route   POST /api/trading/orders/place
 * @desc    Place a buy or sell order
 * @access  Private
 */
router.post(
    '/orders/place',
    authenticate,
    validate(placeOrderSchema),
    TradingController.placeOrder
);

/**
 * @route   GET /api/trading/orders
 * @desc    Get all orders for the account
 * @access  Private
 */
router.get(
    '/orders',
    authenticate,
    TradingController.getOrders
);

/**
 * @route   GET /api/trading/orders/:orderId
 * @desc    Get a single order by ID
 * @access  Private
 */
router.get(
    '/orders/:orderId',
    authenticate,
    validate(getOrderSchema),
    TradingController.getOrder
);

/**
 * @route   PUT /api/trading/orders/:orderId
 * @desc    Modify an existing order
 * @access  Private
 */
router.put(
    '/orders/:orderId',
    authenticate,
    validate(modifyOrderSchema),
    TradingController.modifyOrder
);

/**
 * @route   DELETE /api/trading/orders/:orderId
 * @desc    Cancel an existing order
 * @access  Private
 */
router.delete(
    '/orders/:orderId',
    authenticate,
    validate(cancelOrderSchema),
    TradingController.cancelOrder
);

export default router;