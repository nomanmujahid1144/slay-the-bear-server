// src/validators/markets.validator.ts

import { z } from 'zod';

/**
 * Markets API Validators
 * Validation schemas for Tradier market data endpoints
 */

// ── GET /api/markets/quotes ───────────────────────────────────────────────────

export const getQuotesSchema = z.object({
  query: z.object({
    symbols: z.string()
      .min(1, 'Symbols are required')
      .refine((val) => val.split(',').length > 0, 'At least one symbol is required')
      .refine((val) => val.split(',').length <= 50, 'Maximum 50 symbols allowed'),
  }),
});

export type GetQuotesInput = z.infer<typeof getQuotesSchema>['query'];

// ── GET /api/markets/history ──────────────────────────────────────────────────

export const getHistorySchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long'),
    interval: z.enum(['daily', 'weekly', 'monthly'])
      .optional()
      .default('daily'),
    start: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    end: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
  }),
});

export type GetHistoryInput = z.infer<typeof getHistorySchema>['query'];

// ── GET /api/markets/timesales ────────────────────────────────────────────────

export const getTimeSalesSchema = z.object({
  query: z.object({
    symbol: z.string()
      .min(1, 'Symbol is required')
      .max(10, 'Symbol too long'),
    interval: z.enum(['1min', '5min', '15min'])
      .optional()
      .default('5min'),
    start: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    end: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
  }),
});

export type GetTimeSalesInput = z.infer<typeof getTimeSalesSchema>['query'];

// ── GET /api/markets/search ───────────────────────────────────────────────────

export const searchSymbolsSchema = z.object({
  query: z.object({
    q: z.string()
      .min(1, 'Search query is required')
      .max(50, 'Search query too long'),
    indexes: z.string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

export type SearchSymbolsInput = z.infer<typeof searchSymbolsSchema>['query'];