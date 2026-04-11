// src/types/markets/markets-request.types.ts

/**
 * Markets API Request Types
 * Input types for API endpoints
 */

// GET /api/markets/quotes?symbols=AAPL,TSLA
export interface GetQuotesRequest {
  symbols: string[];
}

// GET /api/markets/history?symbol=AAPL&interval=daily
export interface GetHistoryRequest {
  symbol: string;
  interval?: 'daily' | 'weekly' | 'monthly';
  start?: string;
  end?: string;
}

// GET /api/markets/timesales?symbol=AAPL&interval=1min
export interface GetTimeSalesRequest {
  symbol: string;
  interval: '1min' | '5min' | '15min';
  start?: string;
  end?: string;
}

// GET /api/markets/search?q=Apple
export interface SearchSymbolsRequest {
  q: string;
  indexes?: boolean;
}