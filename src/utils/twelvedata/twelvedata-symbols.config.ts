// src/utils/twelvedata/twelvedata-symbols.config.ts
//
// The curated "Layer 1" watchlist — subscribed once on WebSocket boot,
// always live, independent of visitor count. Every symbol here rides the
// SAME WS subscription and writes to the SAME Redis LIVE_PRICE key, whether
// it's a stock, an ETF, a crypto pair, a forex pair, or a mutual fund — see
// the note below on why mutual funds are not treated as a special case.
//
// Any symbol NOT in this list is still fully reachable via /search, /quote,
// /quotes (batch), and on-demand WebSocket subscribe (Layer 2) — this list
// only controls what's pre-warmed at boot, not what the API can serve.

export const DEFAULT_TD_WATCHLIST = {
    // Matches the "Stock Market" widget on the homepage.
    stocks: [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM',
        'V', 'WMT', 'JNJ', 'PG', 'MA', 'HD', 'BAC', 'XOM',
        'CVX', 'ABBV', 'KO', 'PEP', 'COST', 'DIS', 'NFLX', 'CSCO',
    ],
    // Matches the "Cryptocurrency" widget. USDT.D (Tether dominance) is a
    // TradingView index, not a tradable symbol, so it has no Twelve Data
    // equivalent and is left out. STETH/USD is included but unconfirmed —
    // verify it resolves on Twelve Data before relying on it.
    crypto: ['BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'USDC/USD', 'XRP/USD', 'STETH/USD', 'DOGE/USD'],
    // Matches the "Forex" widget.
    forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'GBP/JPY', 'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/JPY', 'EUR/GBP'],
    // Matches the "ETFs" widget.
    etf: ['SPY', 'QQQ', 'IWM', 'TQQQ', 'SOXL', 'DIA', 'SMH', 'SQQQ', 'GLD', 'XLF'],
    // Matches the "Mutual Funds" widget. Note these are exchange-traded
    // closed-end funds / trusts (Sprott physical-metal trusts, Grayscale
    // single-asset trusts, PIMCO closed-end funds, etc.) — NOT classic
    // open-end mutual funds like VFIAX, which don't trade intraday on any
    // provider. Because these actually trade on an exchange, Twelve Data's
    // WS almost certainly streams live ticks for them, same as the ETFs
    // above — unlike a real open-end fund, which would only ever settle
    // one NAV per day and lean on the REST-fallback path.
    mutual_funds: ['PHYS', 'PSLV', 'LTCN', 'SRUUF', 'PTY', 'DXYZ', 'BCHG', 'PCN', 'PDI', 'OXLC'],
} as const;

export type TwelveDataDefaultMarket = keyof typeof DEFAULT_TD_WATCHLIST;

// Flat list of every default symbol across all 5 markets — what actually
// gets sent in the one batch WS `subscribe` message at boot.
export const ALL_DEFAULT_TD_SYMBOLS: string[] = Object.values(DEFAULT_TD_WATCHLIST).flat();

// Reverse lookup: given a symbol, which default market bucket is it in (if any)?
// Used to tag normalised quotes with a `market` field without a second lookup.
const SYMBOL_TO_MARKET = new Map<string, TwelveDataDefaultMarket>();
for (const [market, symbols] of Object.entries(DEFAULT_TD_WATCHLIST) as [TwelveDataDefaultMarket, readonly string[]][]) {
    for (const symbol of symbols) {
        SYMBOL_TO_MARKET.set(symbol.toUpperCase(), market);
    }
}

export function getDefaultMarketForSymbol(symbol: string): TwelveDataDefaultMarket | null {
    return SYMBOL_TO_MARKET.get(symbol.toUpperCase()) ?? null;
}

