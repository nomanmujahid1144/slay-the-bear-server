// src/validators/news.validator.ts

import { z } from 'zod';

/**
 * News API Validators
 * Validation schemas for Alpha Vantage news endpoints
 */

const sortOptions = z.enum(['LATEST', 'EARLIEST', 'RELEVANCE']).optional().default('LATEST');

// ── GET /api/news/latest ──────────────────────────────────────────────────────

export const getLatestNewsSchema = z.object({
  query: z.object({
    limit: z.string()
      .optional()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 1000, 'Limit must be between 1 and 1000'),
    sort: sortOptions,
  }),
});

export type GetLatestNewsInput = z.infer<typeof getLatestNewsSchema>['query'];

// ── GET /api/news/stocks ──────────────────────────────────────────────────────

export const getStocksNewsSchema = z.object({
  query: z.object({
    tickers: z.string()
      .optional()
      .default('AAPL'),
    limit: z.string()
      .optional()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 1000, 'Limit must be between 1 and 1000'),
    sort: sortOptions,
  }),
});

export type GetStocksNewsInput = z.infer<typeof getStocksNewsSchema>['query'];

// ── GET /api/news/crypto ──────────────────────────────────────────────────────

export const getCryptoNewsSchema = z.object({
  query: z.object({
    tickers: z.string()
      .optional()
      .default('CRYPTO:BTC,CRYPTO:ETH,CRYPTO:XRP'),
    limit: z.string()
      .optional()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 1000, 'Limit must be between 1 and 1000'),
    sort: sortOptions,
  }),
});

export type GetCryptoNewsInput = z.infer<typeof getCryptoNewsSchema>['query'];

// ── GET /api/news/forex ───────────────────────────────────────────────────────

export const getForexNewsSchema = z.object({
  query: z.object({
    tickers: z.string()
      .optional()
      .default('FOREX:USD,FOREX:EUR,FOREX:JPY'),
    limit: z.string()
      .optional()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 1000, 'Limit must be between 1 and 1000'),
    sort: sortOptions,
  }),
});

export type GetForexNewsInput = z.infer<typeof getForexNewsSchema>['query'];

// ── GET /api/news/etfs ────────────────────────────────────────────────────────

export const getETFsNewsSchema = z.object({
  query: z.object({
    topics: z.string()
      .optional()
      .default('finance'),
    limit: z.string()
      .optional()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 1000, 'Limit must be between 1 and 1000'),
    sort: sortOptions,
  }),
});

export type GetETFsNewsInput = z.infer<typeof getETFsNewsSchema>['query'];

// ── GET /api/news/mutual-funds ────────────────────────────────────────────────

export const getMutualFundsNewsSchema = z.object({
  query: z.object({
    topics: z.string()
      .optional()
      .default('finance'),
    limit: z.string()
      .optional()
      .default('50')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 1000, 'Limit must be between 1 and 1000'),
    sort: sortOptions,
  }),
});

export type GetMutualFundsNewsInput = z.infer<typeof getMutualFundsNewsSchema>['query'];