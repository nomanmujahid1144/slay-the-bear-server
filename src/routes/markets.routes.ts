// src/routes/markets.routes.ts

import { Router } from 'express';
import { MarketsController } from '../controllers/markets.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  getQuotesSchema,
  getHistorySchema,
  getTimeSalesSchema,
  searchSymbolsSchema,
} from '../validators/markets.validator';

const router = Router();

/**
 * @route   GET /api/markets/quotes
 * @desc    Get real-time quotes for stocks/ETFs
 * @access  Public
 * @example /api/markets/quotes?symbols=AAPL,TSLA,SPY
 */
router.get(
  '/quotes',
  validate(getQuotesSchema),
  MarketsController.getQuotes
);

/**
 * @route   GET /api/markets/history
 * @desc    Get historical price data for a symbol
 * @access  Public
 * @example /api/markets/history?symbol=AAPL&interval=daily
 */
router.get(
  '/history',
  validate(getHistorySchema),
  MarketsController.getHistory
);

/**
 * @route   GET /api/markets/timesales
 * @desc    Get intraday time & sales data for a symbol
 * @access  Public
 * @example /api/markets/timesales?symbol=AAPL&interval=5min
 */
router.get(
  '/timesales',
  validate(getTimeSalesSchema),
  MarketsController.getTimeSales
);

/**
 * @route   GET /api/markets/search
 * @desc    Search for symbols by company name or symbol
 * @access  Public
 * @example /api/markets/search?q=Apple
 */
router.get(
  '/search',
  validate(searchSymbolsSchema),
  MarketsController.searchSymbols
);

export default router;