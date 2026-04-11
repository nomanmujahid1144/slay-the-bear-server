// src/routes/markets-av.routes.ts

import { Router } from 'express';
import { MarketsAvController } from '../controllers/markets-av.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  getCryptoQuoteSchema,
  getCryptoIntradaySchema,
  getCryptoHistorySchema,
  getForexRateSchema,
  getForexIntradaySchema,
  getForexHistorySchema,
  getMutualFundQuoteSchema,
  getMutualFundHistorySchema,
} from '../validators/markets-av.validator';

const router = Router();

// ── Crypto ────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/markets/crypto/quote
 * @desc    Get real-time crypto quote
 * @access  Public
 * @example /api/markets/crypto/quote?symbol=BTC&market=USD
 */
router.get(
  '/crypto/quote',
  validate(getCryptoQuoteSchema),
  MarketsAvController.getCryptoQuote
);

/**
 * @route   GET /api/markets/crypto/intraday
 * @desc    Get crypto intraday data (Premium)
 * @access  Public
 * @example /api/markets/crypto/intraday?symbol=ETH&market=USD&interval=5min
 */
router.get(
  '/crypto/intraday',
  validate(getCryptoIntradaySchema),
  MarketsAvController.getCryptoIntraday
);

/**
 * @route   GET /api/markets/crypto/history
 * @desc    Get crypto historical data
 * @access  Public
 * @example /api/markets/crypto/history?symbol=BTC&market=USD&interval=daily
 */
router.get(
  '/crypto/history',
  validate(getCryptoHistorySchema),
  MarketsAvController.getCryptoHistory
);

// ── Forex ─────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/markets/forex/rate
 * @desc    Get real-time forex exchange rate
 * @access  Public
 * @example /api/markets/forex/rate?from_currency=EUR&to_currency=USD
 */
router.get(
  '/forex/rate',
  validate(getForexRateSchema),
  MarketsAvController.getForexRate
);

/**
 * @route   GET /api/markets/forex/intraday
 * @desc    Get forex intraday data (Premium)
 * @access  Public
 * @example /api/markets/forex/intraday?from_currency=EUR&to_currency=USD&interval=5min
 */
router.get(
  '/forex/intraday',
  validate(getForexIntradaySchema),
  MarketsAvController.getForexIntraday
);

/**
 * @route   GET /api/markets/forex/history
 * @desc    Get forex historical data
 * @access  Public
 * @example /api/markets/forex/history?from_currency=EUR&to_currency=USD&interval=daily
 */
router.get(
  '/forex/history',
  validate(getForexHistorySchema),
  MarketsAvController.getForexHistory
);

// ── Mutual Funds ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/markets/mutual-fund/quote
 * @desc    Get mutual fund quote
 * @access  Public
 * @example /api/markets/mutual-fund/quote?symbol=VFIAX
 */
router.get(
  '/mutual-fund/quote',
  validate(getMutualFundQuoteSchema),
  MarketsAvController.getMutualFundQuote
);

/**
 * @route   GET /api/markets/mutual-fund/history
 * @desc    Get mutual fund historical data
 * @access  Public
 * @example /api/markets/mutual-fund/history?symbol=VFIAX&interval=daily
 */
router.get(
  '/mutual-fund/history',
  validate(getMutualFundHistorySchema),
  MarketsAvController.getMutualFundHistory
);

// ── Top Gainers / Losers / Most Active ────────────────────────────────────────

/**
 * @route   GET /api/markets/top-gainers-losers
 * @desc    Get top 20 gainers, losers, and most active US stocks
 * @access  Public
 * @example /api/markets/top-gainers-losers
 */
router.get(
  '/top-gainers-losers',
  MarketsAvController.getTopGainersLosers
);

// ── Market Status ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/markets/market-status
 * @desc    Get current open/closed status of major global markets
 * @access  Public
 * @example /api/markets/market-status
 */
router.get(
  '/market-status',
  MarketsAvController.getMarketStatus
);

export default router;