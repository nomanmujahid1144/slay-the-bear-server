// src/types/markets/twelvedata/twelvedata-request.types.ts

import type { TwelveDataMarket } from './twelvedata-response.types';

// GET /api/markets/twelvedata/quote
export interface TwelveDataQuoteRequest {
    symbol: string; // e.g. "AAPL", "EUR/USD", "BTC/USD", "VFIAX"
}

// GET /api/markets/twelvedata/quotes
export interface TwelveDataBatchQuotesRequest {
    symbols: string; // comma-separated, e.g. "AAPL,MSFT,BTC/USD"
}

// GET /api/markets/twelvedata/logo
export interface TwelveDataLogoRequest {
    symbol: string;
}

// GET /api/markets/twelvedata/search
export interface TwelveDataSearchRequest {
    q: string;
    market?: TwelveDataMarket;
    outputsize?: number;
}

// GET /api/markets/twelvedata/history
export interface TwelveDataHistoryRequest {
    symbol: string;
    interval?: '1min' | '5min' | '15min' | '30min' | '45min' | '1h' | '2h' | '4h' | '8h' | '1day' | '1week' | '1month';
    outputsize?: number;
}

// GET /api/markets/twelvedata/watchlist
export interface TwelveDataWatchlistRequest {
    market?: TwelveDataMarket;
}
