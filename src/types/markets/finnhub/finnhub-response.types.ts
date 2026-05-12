// ============================================
// FINNHUB RAW API RESPONSE TYPES
// (what Finnhub actually returns)
// ============================================

// Raw quote response from GET /quote?symbol=BINANCE:BTCUSDT
export interface FinnhubRawQuote {
    c: number;   // current price
    d: number;   // change
    dp: number;  // percent change
    h: number;   // high of day
    l: number;   // low of day
    o: number;   // open price
    pc: number;  // previous close
    t: number;   // timestamp (UNIX)
}

// Raw crypto symbol from GET /crypto/symbol?exchange=BINANCE
export interface FinnhubRawCryptoSymbol {
    description: string;    // e.g. "Binance BTCUSDT"
    displaySymbol: string;  // e.g. "BTC/USDT"
    symbol: string;         // e.g. "BINANCE:BTCUSDT"
}

// Raw forex symbol from GET /forex/symbol?exchange=oanda
export interface FinnhubRawForexSymbol {
    description: string;    // e.g. "IC MARKETS Euro vs US Dollar EURUSD"
    displaySymbol: string;  // e.g. "EUR/USD"
    symbol: string;         // e.g. "IC MARKETS:1"
}

// ============================================
// NORMALISED RESPONSE TYPES
// (what our API returns to the frontend)
// ============================================

// Single crypto quote — returned by /finnhub/crypto/quote
export interface FinnhubCryptoQuote {
    symbol: string;         // e.g. "BINANCE:BTCUSDT"
    displaySymbol: string;  // e.g. "BTC/USDT"
    name: string;           // e.g. "BTC"
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    timestamp: number;
    exchange: string;       // e.g. "BINANCE"
}

// Single forex quote — returned by /finnhub/forex/quote
export interface FinnhubForexQuote {
    symbol: string;         // e.g. "OANDA:EUR_USD"
    displaySymbol: string;  // e.g. "EUR/USD"
    baseCurrency: string;   // e.g. "EUR"
    quoteCurrency: string;  // e.g. "USD"
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    timestamp: number;
    exchange: string;       // e.g. "OANDA"
}

// Crypto symbol info
export interface FinnhubCryptoSymbol {
    description: string;
    displaySymbol: string;
    symbol: string;
}

// Forex symbol info
export interface FinnhubForexSymbol {
    description: string;
    displaySymbol: string;
    symbol: string;
}

// ============================================
// API RESPONSE WRAPPERS
// (consistent with your existing API shape)
// ============================================

export interface FinnhubCryptoQuoteResponse {
    success: true;
    data: FinnhubCryptoQuote;
    cached: boolean;
}

export interface FinnhubCryptoQuotesResponse {
    success: true;
    data: FinnhubCryptoQuote[];
    count: number;
    cached: boolean;
}

export interface FinnhubForexQuoteResponse {
    success: true;
    data: FinnhubForexQuote;
    cached: boolean;
}

export interface FinnhubForexQuotesResponse {
    success: true;
    data: FinnhubForexQuote[];
    count: number;
    cached: boolean;
}

export interface FinnhubCryptoSymbolsResponse {
    success: true;
    data: FinnhubCryptoSymbol[];
    count: number;
    cached: boolean;
}

export interface FinnhubForexSymbolsResponse {
    success: true;
    data: FinnhubForexSymbol[];
    count: number;
    cached: boolean;
}