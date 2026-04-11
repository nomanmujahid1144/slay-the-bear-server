// src/types/markets/markets-response.types.ts

/**
 * Markets API Response Types
 * Output types from Tradier API
 */

// ── Quote Response ────────────────────────────────────────────────────────────

export interface Quote {
  symbol: string;
  description: string;
  exch: string;
  type: string;
  last: number;
  change: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number | null;
  bid: number;
  ask: number;
  change_percentage: number;
  average_volume: number;
  last_volume: number;
  trade_date: number;
  prevclose: number;
  week_52_high: number;
  week_52_low: number;
  bidsize: number;
  bidexch: string;
  bid_date: number;
  asksize: number;
  askexch: string;
  ask_date: number;
  root_symbols: string;
}

export interface QuotesResponse {
  quotes: {
    quote: Quote | Quote[];
  };
}

// ── Historical Data Response ──────────────────────────────────────────────────

export interface HistoryDay {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoryResponse {
  history: {
    day: HistoryDay | HistoryDay[];
  } | null;
}

// ── Time & Sales Response ─────────────────────────────────────────────────────

export interface TimeSalesData {
  time: string;
  timestamp: number;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeSalesResponse {
  series: {
    data: TimeSalesData | TimeSalesData[];
  } | null;
}

// ── Symbol Search Response ────────────────────────────────────────────────────

export interface Security {
  symbol: string;
  exchange: string;
  type: string;
  description: string;
}

export interface SearchResponse {
  securities: {
    security: Security | Security[];
  } | null;
}