// src/validators/twelvedata.validator.ts

import { z } from 'zod';

const twelveDataMarkets = ['stocks', 'etf', 'crypto', 'forex', 'mutual_funds'] as const;

// GET /api/markets/twelvedata/watchlist?market=stocks
export const getWatchlistSchema = z.object({
    query: z.object({
        market: z
            .enum(twelveDataMarkets, {
                message: `market must be one of: ${twelveDataMarkets.join(', ')}`,
            })
            .optional(),
    }),
});

// GET /api/markets/twelvedata/quote?symbol=AAPL
export const getQuoteSchema = z.object({
    query: z.object({
        symbol: z
            .string()
            .min(1, 'symbol cannot be empty'),
    }),
});

// GET /api/markets/twelvedata/quotes?symbols=AAPL,MSFT,BTC/USD
export const getBatchQuotesSchema = z.object({
    query: z.object({
        symbols: z
            .string()
            .min(1, 'symbols cannot be empty')
            .refine(
                (val) => val.split(',').filter(Boolean).length <= 50,
                'symbols cannot contain more than 50 items in a single request'
            ),
    }),
});

// GET /api/markets/twelvedata/logo?symbol=AAPL
export const getLogoSchema = z.object({
    query: z.object({
        symbol: z
            .string()
            .min(1, 'symbol cannot be empty'),
    }),
});

// GET /api/markets/twelvedata/search?q=Apple&market=stocks
export const searchSymbolsSchema = z.object({
    query: z.object({
        q: z
            .string()
            .min(1, 'q cannot be empty'),
        market: z
            .enum(twelveDataMarkets, {
                message: `market must be one of: ${twelveDataMarkets.join(', ')}`,
            })
            .optional(),
        outputsize: z
            .coerce
            .number()
            .int()
            .min(1)
            .max(120)
            .optional(),
    }),
});

// GET /api/markets/twelvedata/status — no params needed
export const getStatusSchema = z.object({
    query: z.object({}).optional(),
});

// GET /api/markets/twelvedata/history?symbol=AAPL&interval=1day&outputsize=30
export const getHistorySchema = z.object({
    query: z.object({
        symbol: z
            .string()
            .min(1, 'symbol cannot be empty'),
        interval: z
            .enum(['1min', '5min', '15min', '30min', '45min', '1h', '2h', '4h', '8h', '1day', '1week', '1month'], {
                message: 'invalid interval',
            })
            .optional(),
        outputsize: z
            .coerce
            .number()
            .int()
            .min(1)
            .max(5000)
            .optional(),
    }),
});
