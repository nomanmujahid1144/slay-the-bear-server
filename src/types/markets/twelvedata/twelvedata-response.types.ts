// src/types/markets/twelvedata/twelvedata-response.types.ts

// ============================================
// TWELVE DATA RAW API RESPONSE TYPES
// (what Twelve Data actually returns)
// ============================================

// Raw /quote response — https://api.twelvedata.com/quote?symbol=AAPL
export interface TwelveDataRawQuote {
    symbol: string;
    name: string;
    exchange: string;
    mic_code: string;
    currency: string;
    datetime: string;
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
    previous_close: string;
    change: string;
    percent_change: string;
    average_volume?: string;
    is_market_open: boolean;
    fifty_two_week?: {
        low: string;
        high: string;
        low_change: string;
        high_change: string;
        low_change_percent: string;
        high_change_percent: string;
        range: string;
    };
}

// Raw /logo response — stocks/funds use `url`; forex/crypto pairs use logo_base/logo_quote
export interface TwelveDataRawLogo {
    meta: { symbol: string; exchange?: string };
    url?: string;
    logo_base?: string;
    logo_quote?: string;
}

// Raw /symbol_search response item
export interface TwelveDataRawSymbolSearchItem {
    symbol: string;
    instrument_name: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
    instrument_type: string; // "Common Stock", "ETF", "Mutual Fund", "Digital Currency", "Physical Currency", etc.
    country: string;
    currency: string;
}

export interface TwelveDataRawSymbolSearchResponse {
    data: TwelveDataRawSymbolSearchItem[];
    status: string;
}

// Raw /time_series response
export interface TwelveDataRawTimeSeriesValue {
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
}

export interface TwelveDataRawTimeSeriesResponse {
    meta: {
        symbol: string;
        interval: string;
        currency: string;
        exchange_timezone: string;
        exchange: string;
        mic_code: string;
        type: string;
    };
    values: TwelveDataRawTimeSeriesValue[];
    status: string;
}

// Raw POST /batch response. Confirmed against Twelve Data's own generated
// SDK model (Advanced200Response): the whole response is wrapped once in
// { code, status, data }, and `data` is keyed by the request id we chose —
// each per-id value is EITHER the raw endpoint payload directly, OR a
// Twelve-Data-style error object ({ code, message, status: "error" }) if
// that one request in the batch failed. There is no further per-item wrapper.
export interface TwelveDataRawBatchError {
    code: number;
    message: string;
    status: 'error';
}

export interface TwelveDataRawBatchResponse {
    code?: number;
    status?: string;
    data: {
        [requestId: string]: TwelveDataRawQuote | TwelveDataRawBatchError;
    };
}

// Type guard — an error item always has this shape; a real quote never does.
export function isTwelveDataBatchError(
    item: TwelveDataRawQuote | TwelveDataRawBatchError,
): item is TwelveDataRawBatchError {
    return (item as TwelveDataRawBatchError).status === 'error';
}

// Raw incoming WebSocket price event (confirmed against the official Go/Python clients)
export interface TwelveDataPriceEvent {
    event: 'price';
    symbol: string;
    currency_base?: string;
    currency_quote?: string;
    exchange?: string;
    mic_code?: string;
    type?: string;
    timestamp: number;
    price: number;
    day_volume?: number;
    bid?: number;
    ask?: number;
}

export interface TwelveDataSubscribeStatusItem {
    symbol: string;
    exchange?: string;
    mic_code?: string;
    country?: string;
    type?: string;
}

export interface TwelveDataSubscribeStatusEvent {
    event: 'subscribe-status' | 'unsubscribe-status';
    status: 'ok' | 'error';
    success: TwelveDataSubscribeStatusItem[];
    fails: TwelveDataSubscribeStatusItem[];
}

export interface TwelveDataHeartbeatEvent {
    event: 'heartbeat';
    status?: string;
}

export type TwelveDataWsIncomingMessage =
    | TwelveDataPriceEvent
    | TwelveDataSubscribeStatusEvent
    | TwelveDataHeartbeatEvent
    | { event: string; [key: string]: unknown };

// ============================================
// NORMALISED RESPONSE TYPES
// (what our API returns to the frontend)
// ============================================

export type TwelveDataMarket = 'stocks' | 'etf' | 'crypto' | 'forex' | 'mutual_funds';

export interface TwelveDataQuote {
    symbol: string;
    name: string;
    exchange: string;
    market: TwelveDataMarket | null;
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    volume: number;
    timestamp: number;
    isMarketOpen: boolean;
    logoUrl: string | null;
    logoUrlQuote?: string | null;
    source: 'websocket' | 'rest';
}

export interface TwelveDataLogo {
    symbol: string;
    logoUrl: string | null;
    logoUrlQuote?: string | null;
}

export interface TwelveDataSymbolSearchResult {
    symbol: string;
    name: string;
    exchange: string;
    micCode: string;
    type: string;
    market: TwelveDataMarket | null;
    country: string;
    currency: string;
}

export interface TwelveDataHistoryPoint {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TwelveDataHistory {
    symbol: string;
    interval: string;
    currency: string;
    exchange: string;
    values: TwelveDataHistoryPoint[];
}

// ============================================
// API RESPONSE WRAPPERS
// (consistent with the existing Finnhub/Tradier response shape)
// ============================================

export interface TwelveDataQuoteResponse {
    success: true;
    data: TwelveDataQuote;
    source: 'websocket' | 'rest';
}

export interface TwelveDataQuotesResponse {
    success: true;
    data: TwelveDataQuote[];
    count: number;
}

export interface TwelveDataLogoResponse {
    success: true;
    data: TwelveDataLogo;
}

export interface TwelveDataSearchResponse {
    success: true;
    data: TwelveDataSymbolSearchResult[];
    count: number;
}

export interface TwelveDataHistoryResponse {
    success: true;
    data: TwelveDataHistory;
}
