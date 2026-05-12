// ============================================
// FINNHUB REQUEST TYPES
// ============================================

// Supported Crypto Exchanges
export type FinnhubCryptoExchange =
    | 'BINANCE'
    | 'COINBASE'
    | 'KRAKEN'
    | 'GEMINI'
    | 'BITFINEX'
    | 'HUOBI'
    | 'KUCOIN'
    | 'OKEX';

// Supported Forex Exchanges
export type FinnhubForexExchange =
    | 'oanda'
    | 'fxcm'
    | 'forex.com'
    | 'ic markets'
    | 'fxpro';

// GET /api/markets/finnhub/crypto/quote
export interface FinnhubCryptoQuoteRequest {
    symbol: string;   // e.g. "BINANCE:BTCUSDT"
}

// GET /api/markets/finnhub/crypto/quotes (bulk — all symbols at once)
export interface FinnhubCryptoQuotesRequest {
    exchange?: FinnhubCryptoExchange;  // default: BINANCE
}

// GET /api/markets/finnhub/crypto/symbols
export interface FinnhubCryptoSymbolsRequest {
    exchange: FinnhubCryptoExchange;  // required
}

// GET /api/markets/finnhub/forex/quote
export interface FinnhubForexQuoteRequest {
    symbol: string;   // e.g. "OANDA:EUR_USD"
}

// GET /api/markets/finnhub/forex/quotes (bulk — all pairs at once)
export interface FinnhubForexQuotesRequest {
    exchange?: FinnhubForexExchange;  // default: oanda
}

// GET /api/markets/finnhub/forex/symbols
export interface FinnhubForexSymbolsRequest {
    exchange: FinnhubForexExchange;
}