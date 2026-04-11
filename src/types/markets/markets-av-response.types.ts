// src/types/markets/markets-av-response.types.ts

/**
 * Markets AV API Response Types
 * Output types from Alpha Vantage API for Crypto, Forex, and Mutual Funds
 */

// ── Crypto Response Types ─────────────────────────────────────────────────────

export interface CryptoQuote {
  symbol: string;               // e.g. 'BTC'
  name: string;                 // e.g. 'Bitcoin'
  market: string;               // e.g. 'USD'
  price: number;                // current price in market currency
  open: number;
  high: number;
  low: number;
  volume: number;
  last_refreshed: string;
  change: number;               // calculated: price - open
  change_percentage: number;    // calculated: (change / open) * 100
}

export interface CryptoIntradayData {
  timestamp: string;            // e.g. '2026-04-11 10:30:00'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoHistoryDay {
  date: string;                 // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Raw Alpha Vantage crypto/forex exchange rate response (shared)
export interface AlphaVantageCurrencyExchangeResponse {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string;
    '2. From_Currency Name': string;
    '3. To_Currency Code': string;
    '4. To_Currency Name': string;
    '5. Exchange Rate': string;
    '6. Last Refreshed': string;
    '7. Time Zone': string;
    '8. Bid Price': string;
    '9. Ask Price': string;
  };
}

// Raw Alpha Vantage crypto intraday response
// Key is dynamic: "Time Series Crypto (5min)", "Time Series Crypto (15min)", etc.
export interface AlphaVantageCryptoIntradayResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Digital Currency Code': string;
    '3. Digital Currency Name': string;
    '4. Market Code': string;
    '5. Market Name': string;
    '6. Last Refreshed': string;
    '7. Interval': string;
    '8. Output Size': string;
    '9. Time Zone': string;
  };
  [key: string]: any;           // dynamic key: "Time Series Crypto (5min)"
}

// Raw Alpha Vantage crypto daily/weekly/monthly response
// FIX: Keys differ per interval:
// daily   → "Time Series (Digital Currency Daily)"
// weekly  → "Time Series (Digital Currency Weekly)"
// monthly → "Time Series (Digital Currency Monthly)"
export interface AlphaVantageCryptoDailyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Digital Currency Code': string;
    '3. Digital Currency Name': string;
    '4. Market Code': string;
    '5. Market Name': string;
    '6. Last Refreshed': string;
    '7. Time Zone': string;
  };
  [key: string]: any;           // dynamic key per interval
}

// ── Forex Response Types ──────────────────────────────────────────────────────

export interface ForexQuote {
  from_currency: string;        // e.g. 'EUR'
  from_name: string;            // e.g. 'Euro'
  to_currency: string;          // e.g. 'USD'
  to_name: string;              // e.g. 'United States Dollar'
  rate: number;                 // exchange rate
  bid: number;
  ask: number;
  last_refreshed: string;
}

export interface ForexIntradayData {
  timestamp: string;            // e.g. '2026-04-11 10:30:00'
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ForexHistoryDay {
  date: string;                 // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

// Raw Alpha Vantage forex intraday response
// Key is dynamic: "Time Series FX (5min)", "Time Series FX (15min)", etc.
export interface AlphaVantageForexIntradayResponse {
  'Meta Data': {
    '1. Information': string;
    '2. From Symbol': string;
    '3. To Symbol': string;
    '4. Last Refreshed': string;
    '5. Interval': string;
    '6. Output Size': string;
    '7. Time Zone': string;
  };
  [key: string]: any;           // dynamic key: "Time Series FX (5min)"
}

// Raw Alpha Vantage forex daily/weekly/monthly response
// FIX: Keys differ per interval:
// daily   → "Time Series FX (Daily)"
// weekly  → "Time Series FX (Weekly)"
// monthly → "Time Series FX (Monthly)"
export interface AlphaVantageForexDailyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. From Symbol': string;
    '3. To Symbol': string;
    '4. Output Size': string;
    '5. Last Refreshed': string;
    '6. Time Zone': string;
  };
  [key: string]: any;           // dynamic key per interval
}

// ── Mutual Fund Response Types ────────────────────────────────────────────────

export interface MutualFundQuote {
  symbol: string;               // e.g. 'VFIAX'
  name: string;                 // e.g. 'Vanguard 500 Index Fund'
  price: number;                // latest close/NAV
  open: number;
  high: number;
  low: number;
  volume: number;
  last_refreshed: string;
  change: number;               // calculated: price - open
  change_percentage: number;    // calculated: (change / open) * 100
}

export interface MutualFundHistoryDay {
  date: string;                 // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Raw Alpha Vantage daily response (TIME_SERIES_DAILY)
// Key: "Time Series (Daily)"
export interface AlphaVantageDailyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

// Raw Alpha Vantage weekly response (TIME_SERIES_WEEKLY)
// FIX: Key is "Weekly Time Series" (different from daily!)
export interface AlphaVantageWeeklyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Time Zone': string;
  };
  'Weekly Time Series': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

// Raw Alpha Vantage monthly response (TIME_SERIES_MONTHLY)
// FIX: Key is "Monthly Time Series" (different from daily and weekly!)
export interface AlphaVantageMonthlyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Time Zone': string;
  };
  'Monthly Time Series': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

// ── Top Gainers / Losers / Most Active ────────────────────────────────────────

export interface TopMover {
  ticker: string;               // e.g. 'AAPL'
  price: string;                // e.g. '150.00'
  change_amount: string;        // e.g. '+5.00'
  change_percentage: string;    // e.g. '+3.45%'
  volume: string;               // e.g. '12345678'
}

export interface TopGainersLosers {
  top_gainers: TopMover[];
  top_losers: TopMover[];
  most_actively_traded: TopMover[];
  last_updated: string;
}

// Raw Alpha Vantage top gainers/losers response
export interface AlphaVantageTopGainersLosersResponse {
  metadata: string;
  last_updated: string;
  top_gainers: {
    ticker: string;
    price: string;
    change_amount: string;
    change_percentage: string;
    volume: string;
  }[];
  top_losers: {
    ticker: string;
    price: string;
    change_amount: string;
    change_percentage: string;
    volume: string;
  }[];
  most_actively_traded: {
    ticker: string;
    price: string;
    change_amount: string;
    change_percentage: string;
    volume: string;
  }[];
}

// ── Market Status ─────────────────────────────────────────────────────────────

export interface MarketStatusItem {
  market_type: string;          // e.g. 'Equity'
  region: string;               // e.g. 'United States'
  primary_exchanges: string;    // e.g. 'NYSE, NASDAQ'
  local_open: string;           // e.g. '09:30'
  local_close: string;          // e.g. '16:00'
  current_status: string;       // 'open' | 'closed'
  notes: string;
}

export interface MarketStatus {
  markets: MarketStatusItem[];
}

// Raw Alpha Vantage market status response
export interface AlphaVantageMarketStatusResponse {
  endpoint: string;
  markets: {
    market_type: string;
    region: string;
    primary_exchanges: string;
    local_open: string;
    local_close: string;
    current_status: string;
    notes: string;
  }[];
}