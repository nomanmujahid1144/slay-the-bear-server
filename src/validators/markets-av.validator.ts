// src/validators/markets-av.validator.ts

import { z } from 'zod';

/**
 * Markets AV Validators
 * Validation schemas for Crypto, Forex, and Mutual Fund endpoints
 * Companion to markets.validator.ts which handles Stocks and ETFs
 */

// ── GET /api/markets/crypto/quote ─────────────────────────────────────────────

export const getCryptoQuoteSchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long')
      .toUpperCase(),
    market: z.string()
      .max(10, 'Market too long')
      .toUpperCase()
      .optional()
      .default('USD'),
  }),
});

export type GetCryptoQuoteInput = z.infer<typeof getCryptoQuoteSchema>['query'];

// ── GET /api/markets/crypto/intraday ──────────────────────────────────────────

export const getCryptoIntradaySchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long')
      .toUpperCase(),
    market: z.string()
      .max(10, 'Market too long')
      .toUpperCase()
      .optional()
      .default('USD'),
    interval: z.enum(['1min', '5min', '15min', '30min', '60min'])
      .optional()
      .default('5min'),
    outputsize: z.enum(['compact', 'full'])
      .optional()
      .default('compact'),
  }),
});

export type GetCryptoIntradayInput = z.infer<typeof getCryptoIntradaySchema>['query'];

// ── GET /api/markets/crypto/history ──────────────────────────────────────────

export const getCryptoHistorySchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long')
      .toUpperCase(),
    market: z.string()
      .max(10, 'Market too long')
      .toUpperCase()
      .optional()
      .default('USD'),
    interval: z.enum(['daily', 'weekly', 'monthly'])
      .optional()
      .default('daily'),
  }),
});

export type GetCryptoHistoryInput = z.infer<typeof getCryptoHistorySchema>['query'];

// ── GET /api/markets/forex/rate ───────────────────────────────────────────────

export const getForexRateSchema = z.object({
  query: z.object({
    from_currency: z.string()
      .min(1, 'From currency is required')
      .max(10, 'From currency too long')
      .toUpperCase(),
    to_currency: z.string()
      .max(10, 'To currency too long')
      .toUpperCase()
      .optional()
      .default('USD'),
  }),
});

export type GetForexRateInput = z.infer<typeof getForexRateSchema>['query'];

// ── GET /api/markets/forex/intraday ───────────────────────────────────────────

export const getForexIntradaySchema = z.object({
  query: z.object({
    from_currency: z.string()
      .min(1, 'From currency is required')
      .max(10, 'From currency too long')
      .toUpperCase(),
    to_currency: z.string()
      .max(10, 'To currency too long')
      .toUpperCase()
      .optional()
      .default('USD'),
    interval: z.enum(['1min', '5min', '15min', '30min', '60min'])
      .optional()
      .default('5min'),
    outputsize: z.enum(['compact', 'full'])
      .optional()
      .default('compact'),
  }),
});

export type GetForexIntradayInput = z.infer<typeof getForexIntradaySchema>['query'];

// ── GET /api/markets/forex/history ────────────────────────────────────────────

export const getForexHistorySchema = z.object({
  query: z.object({
    from_currency: z.string()
      .min(1, 'From currency is required')
      .max(10, 'From currency too long')
      .toUpperCase(),
    to_currency: z.string()
      .max(10, 'To currency too long')
      .toUpperCase()
      .optional()
      .default('USD'),
    interval: z.enum(['daily', 'weekly', 'monthly'])
      .optional()
      .default('daily'),
  }),
});

export type GetForexHistoryInput = z.infer<typeof getForexHistorySchema>['query'];

// ── GET /api/markets/mutual-fund/quote ───────────────────────────────────────

export const getMutualFundQuoteSchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long')
      .toUpperCase(),
  }),
});

export type GetMutualFundQuoteInput = z.infer<typeof getMutualFundQuoteSchema>['query'];

// ── GET /api/markets/mutual-fund/history ─────────────────────────────────────

export const getMutualFundHistorySchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long')
      .toUpperCase(),
    interval: z.enum(['daily', 'weekly', 'monthly'])
      .optional()
      .default('daily'),
  }),
});

export type GetMutualFundHistoryInput = z.infer<typeof getMutualFundHistorySchema>['query'];