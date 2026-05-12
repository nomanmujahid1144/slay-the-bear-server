import { Router } from 'express';
import FinnhubController from '../controllers/finnhub.controller';
import { validate } from '../middlewares/validate.middleware';
import {
    getCryptoQuoteSchema,
    getCryptoQuotesSchema,
    getCryptoSymbolsSchema,
    getForexQuoteSchema,
    getForexQuotesSchema,
    getForexSymbolsSchema,
} from '../validators/finnhub.validator';

const router = Router();

// ============================================
// CRYPTO ROUTES
// ============================================

/**
 * GET /api/markets/finnhub/crypto/quotes
 * Get ALL supported crypto quotes (cached)
 * Use this for the crypto table page
 */
router.get(
    '/crypto/quotes',
    validate(getCryptoQuotesSchema),
    FinnhubController.getCryptoQuotes
);

/**
 * GET /api/markets/finnhub/crypto/quote?symbol=BINANCE:BTCUSDT
 * Get a single crypto quote
 */
router.get(
    '/crypto/quote',
    validate(getCryptoQuoteSchema),
    FinnhubController.getCryptoQuote
);

/**
 * GET /api/markets/finnhub/crypto/symbols?exchange=BINANCE
 * Get list of crypto symbols for an exchange
 */
router.get(
    '/crypto/symbols',
    validate(getCryptoSymbolsSchema),
    FinnhubController.getCryptoSymbols
);

// ============================================
// FOREX ROUTES
// ============================================

/**
 * GET /api/markets/finnhub/forex/quotes
 * Get ALL supported forex quotes (cached)
 * Use this for the forex table page
 */
router.get(
    '/forex/quotes',
    validate(getForexQuotesSchema),
    FinnhubController.getForexQuotes
);

/**
 * GET /api/markets/finnhub/forex/quote?symbol=OANDA:EUR_USD
 * Get a single forex quote
 */
router.get(
    '/forex/quote',
    validate(getForexQuoteSchema),
    FinnhubController.getForexQuote
);

/**
 * GET /api/markets/finnhub/forex/symbols?exchange=oanda
 * Get list of forex symbols for an exchange
 */
router.get(
    '/forex/symbols',
    validate(getForexSymbolsSchema),
    FinnhubController.getForexSymbols
);

export default router;