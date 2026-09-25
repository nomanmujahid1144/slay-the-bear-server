// src/routes/twelvedata.routes.ts

import { Router } from 'express';
import TwelveDataController from '../controllers/twelvedata.controller';
import { validate } from '../middlewares/validate.middleware';
import {
    getWatchlistSchema,
    getQuoteSchema,
    getBatchQuotesSchema,
    getLogoSchema,
    searchSymbolsSchema,
    getHistorySchema,
    getStatusSchema,
} from '../validators/twelvedata.validator';

const router = Router();

/**
 * GET /api/markets/twelvedata/watchlist?market=stocks
 * Default Layer-1 watchlist — omit `market` for all 5 markets at once
 */
router.get(
    '/watchlist',
    validate(getWatchlistSchema),
    TwelveDataController.getWatchlist
);

/**
 * GET /api/markets/twelvedata/quote?symbol=AAPL
 * Single quote — any symbol across stocks, ETFs, mutual funds, crypto, forex
 */
router.get(
    '/quote',
    validate(getQuoteSchema),
    TwelveDataController.getQuote
);

/**
 * GET /api/markets/twelvedata/quotes?symbols=AAPL,MSFT,BTC/USD
 * Batch quotes — up to 50 symbols, any mix of markets, in one call
 */
router.get(
    '/quotes',
    validate(getBatchQuotesSchema),
    TwelveDataController.getBatchQuotes
);

/**
 * GET /api/markets/twelvedata/logo?symbol=AAPL
 * Symbol logo(s) for display alongside a quote
 */
router.get(
    '/logo',
    validate(getLogoSchema),
    TwelveDataController.getLogo
);

/**
 * GET /api/markets/twelvedata/search?q=Apple&market=stocks
 * Search any symbol across all 5 markets, or narrow to one with `market`
 */
router.get(
    '/search',
    validate(searchSymbolsSchema),
    TwelveDataController.searchSymbols
);

/**
 * GET /api/markets/twelvedata/history?symbol=AAPL&interval=1day&outputsize=30
 * Historical OHLCV series for charts
 */
router.get(
    '/history',
    validate(getHistorySchema),
    TwelveDataController.getHistory
);

/**
 * GET /api/markets/twelvedata/status
 * Live WebSocket engine visibility (connected client count)
 */
router.get(
    '/status',
    validate(getStatusSchema),
    TwelveDataController.getStatus
);

export default router;