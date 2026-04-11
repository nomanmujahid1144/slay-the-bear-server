// src/types/markets/markets-av-request.types.ts

/**
 * Markets AV API Request Types
 * Input types for Crypto, Forex, and Mutual Fund endpoints
 */

// ── Crypto ────────────────────────────────────────────────────────────────────

// GET /api/markets/crypto/quote?symbol=BTC&market=USD
export interface GetCryptoQuoteRequest {
  symbol: string;                                               // e.g. 'BTC', 'ETH'
  market?: string;                                              // e.g. 'USD' (default: 'USD')
}

// GET /api/markets/crypto/intraday?symbol=ETH&market=USD&interval=5min
export interface GetCryptoIntradayRequest {
  symbol: string;                                               // e.g. 'ETH', 'BTC'
  market?: string;                                              // e.g. 'USD' (default: 'USD')
  interval?: '1min' | '5min' | '15min' | '30min' | '60min';   // default: '5min'
  outputsize?: 'compact' | 'full';                             // default: 'compact'
}

// GET /api/markets/crypto/history?symbol=BTC&market=USD&interval=daily
export interface GetCryptoHistoryRequest {
  symbol: string;                                               // e.g. 'BTC', 'ETH'
  market?: string;                                              // e.g. 'USD' (default: 'USD')
  interval?: 'daily' | 'weekly' | 'monthly';                  // default: 'daily'
}

// ── Forex ─────────────────────────────────────────────────────────────────────

// GET /api/markets/forex/rate?from_currency=EUR&to_currency=USD
export interface GetForexRateRequest {
  from_currency: string;                                        // e.g. 'EUR', 'GBP'
  to_currency?: string;                                         // e.g. 'USD' (default: 'USD')
}

// GET /api/markets/forex/intraday?from_currency=EUR&to_currency=USD&interval=5min
export interface GetForexIntradayRequest {
  from_currency: string;                                        // e.g. 'EUR', 'GBP'
  to_currency?: string;                                         // e.g. 'USD' (default: 'USD')
  interval?: '1min' | '5min' | '15min' | '30min' | '60min';   // default: '5min'
  outputsize?: 'compact' | 'full';                             // default: 'compact'
}

// GET /api/markets/forex/history?from_currency=EUR&to_currency=USD&interval=daily
export interface GetForexHistoryRequest {
  from_currency: string;                                        // e.g. 'EUR', 'GBP'
  to_currency?: string;                                         // e.g. 'USD' (default: 'USD')
  interval?: 'daily' | 'weekly' | 'monthly';                  // default: 'daily'
}

// ── Mutual Funds ──────────────────────────────────────────────────────────────

// GET /api/markets/mutual-fund/quote?symbol=VFIAX
export interface GetMutualFundQuoteRequest {
  symbol: string;                                               // e.g. 'VFIAX', 'FXAIX'
}

// GET /api/markets/mutual-fund/history?symbol=VFIAX&interval=daily
export interface GetMutualFundHistoryRequest {
  symbol: string;                                               // e.g. 'VFIAX', 'FXAIX'
  interval?: 'daily' | 'weekly' | 'monthly';                  // default: 'daily'
}

// ── Top Gainers / Losers / Most Active ────────────────────────────────────────

// GET /api/markets/top-gainers-losers
// No params needed — returns all 3 lists in one call
export interface GetTopGainersLosersRequest {}

// ── Market Status ─────────────────────────────────────────────────────────────

// GET /api/markets/market-status
// No params needed — returns status of all major markets
export interface GetMarketStatusRequest {}