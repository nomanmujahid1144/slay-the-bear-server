import { z } from 'zod';

// ============================================
// SHARED ENUMS
// ============================================

const orderTypeEnum = z.enum(['market', 'limit', 'stop', 'stop_limit'], {
    message: 'Order type must be one of: market, limit, stop, stop_limit',
});

const orderSideEnum = z.enum(['buy', 'sell', 'buy_to_cover', 'sell_short'], {
    message: 'Order side must be one of: buy, sell, buy_to_cover, sell_short',
});

const orderDurationEnum = z.enum(['day', 'gtc', 'pre', 'post'], {
    message: 'Order duration must be one of: day, gtc, pre, post',
});

// ============================================
// AUTH VALIDATORS
// ============================================

// GET /api/trading/auth/callback
// Tradier sends back code as query param
export const tradierCallbackSchema = z.object({
    query: z.object({
        code: z.string().min(1, 'Authorization code is required'),
        state: z.string().optional(),
    }),
});

// ============================================
// ACCOUNT VALIDATORS
// ============================================

// GET /api/trading/account/history
export const getAccountHistorySchema = z.object({
    query: z.object({
        limit: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 25)),
        offset: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 0)),
        type: z
            .enum([
                'trade', 'option', 'ach', 'wire', 'dividend',
                'fee', 'tax', 'journal', 'check', 'transfer',
                'adjustment', 'interest',
            ])
            .optional(),
        start: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
            .optional(),
        end: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
            .optional(),
    }),
});

// GET /api/trading/account/gainloss
export const getGainLossSchema = z.object({
    query: z.object({
        limit: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 25)),
        offset: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : 0)),
        sortBy: z.enum(['openDate', 'closeDate']).optional(),
        sort: z.enum(['asc', 'desc']).optional(),
        start: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
            .optional(),
        end: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
            .optional(),
    }),
});

// ============================================
// ORDER VALIDATORS
// ============================================

// Base order fields shared between preview and place
const baseOrderSchema = z.object({
    symbol: z
        .string()
        .min(1, 'Symbol is required')
        .max(10, 'Symbol is too long')
        .toUpperCase(),
    side: orderSideEnum,
    quantity: z
        .number({ message: 'Quantity must be a number' })
        .positive('Quantity must be greater than 0')
        .int('Quantity must be a whole number'),
    type: orderTypeEnum,
    duration: orderDurationEnum,
    price: z
        .number()
        .positive('Price must be greater than 0')
        .optional(),
    stop: z
        .number()
        .positive('Stop price must be greater than 0')
        .optional(),
});

// POST /api/trading/orders/preview
export const previewOrderSchema = z.object({
    body: baseOrderSchema.superRefine((data, ctx) => {
        // Limit and stop_limit orders require a price
        if ((data.type === 'limit' || data.type === 'stop_limit') && !data.price) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Price is required for limit and stop_limit orders',
                path: ['price'],
            });
        }
        // Stop and stop_limit orders require a stop price
        if ((data.type === 'stop' || data.type === 'stop_limit') && !data.stop) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Stop price is required for stop and stop_limit orders',
                path: ['stop'],
            });
        }
    }),
});

// POST /api/trading/orders/place
export const placeOrderSchema = z.object({
    body: baseOrderSchema.superRefine((data, ctx) => {
        if ((data.type === 'limit' || data.type === 'stop_limit') && !data.price) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Price is required for limit and stop_limit orders',
                path: ['price'],
            });
        }
        if ((data.type === 'stop' || data.type === 'stop_limit') && !data.stop) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Stop price is required for stop and stop_limit orders',
                path: ['stop'],
            });
        }
    }),
});

// GET /api/trading/orders/:orderId
export const getOrderSchema = z.object({
    params: z.object({
        orderId: z.string().min(1, 'Order ID is required'),
    }),
});

// PUT /api/trading/orders/:orderId
export const modifyOrderSchema = z.object({
    params: z.object({
        orderId: z.string().min(1, 'Order ID is required'),
    }),
    body: z.object({
        type: orderTypeEnum.optional(),
        duration: orderDurationEnum.optional(),
        price: z.number().positive('Price must be greater than 0').optional(),
        stop: z.number().positive('Stop price must be greater than 0').optional(),
    }).refine(
        (data) => Object.keys(data).length > 0,
        { message: 'At least one field is required to modify an order' }
    ),
});

// DELETE /api/trading/orders/:orderId
export const cancelOrderSchema = z.object({
    params: z.object({
        orderId: z.string().min(1, 'Order ID is required'),
    }),
});