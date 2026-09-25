// src/services/twelvedata.service.ts

import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import {
    getCacheTD,
    setCacheTD,
    CACHE_TTL_TD,
    CACHE_KEYS_TD,
} from '../utils/twelvedata/twelvedata-cache.config';
import {
    DEFAULT_TD_WATCHLIST,
    ALL_DEFAULT_TD_SYMBOLS,
    getDefaultMarketForSymbol,
} from '../utils/twelvedata/twelvedata-symbols.config';
import {
    TwelveDataRawQuote,
    TwelveDataRawLogo,
    TwelveDataRawSymbolSearchItem,
    TwelveDataRawSymbolSearchResponse,
    TwelveDataRawTimeSeriesResponse,
    TwelveDataRawTimeSeriesValue,
    TwelveDataRawBatchResponse,
    TwelveDataRawBatchError,
    isTwelveDataBatchError,
    TwelveDataQuote,
    TwelveDataLogo,
    TwelveDataSymbolSearchResult,
    TwelveDataHistory,
    TwelveDataMarket,
} from '../types/markets/twelvedata/twelvedata-response.types';
import { ApiError } from '../utils/ApiError';

// A logical error Twelve Data reports INSIDE a 200 response body
// (e.g. { code: 400, message: "**symbol** not found", status: "error" }),
// as distinct from a network/HTTP-level failure. Kept separate so callers
// can map it to ApiError.badRequest instead of ApiError.internal.
class TwelveDataApiError extends Error {
    code?: number;
    constructor(message: string, code?: number) {
        super(message);
        this.name = 'TwelveDataApiError';
        this.code = code;
    }
}

function mapInstrumentTypeToMarket(instrumentType: string): TwelveDataMarket | null {
    const type = (instrumentType || '').toLowerCase();
    if (type.includes('etf')) return 'etf';
    if (type.includes('mutual fund')) return 'mutual_funds';
    if (type.includes('digital currency') || type.includes('crypto')) return 'crypto';
    if (type.includes('physical currency') || type.includes('forex')) return 'forex';
    if (type.includes('stock') || type.includes('equity')) return 'stocks';
    return null;
}

class TwelveDataService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.twelvedata.com',
            timeout: 15000,
            params: {
                apikey: config.TWELVE_DATA_API_KEY,
            },
        });
    }

    private toApiError(error: any, fallbackMessage: string): ApiError {
        if (error instanceof TwelveDataApiError) {
            return ApiError.badRequest(error.message);
        }
        if (error.response?.status === 401) {
            return ApiError.unauthorized('Invalid Twelve Data API key');
        }
        if (error.response?.status === 429) {
            return ApiError.tooManyRequests('Twelve Data rate limit exceeded');
        }
        return ApiError.internal(fallbackMessage);
    }

    // ============================================
    // PRIVATE: RAW API CALLS TO TWELVE DATA
    // ============================================

    private async fetchQuote(symbol: string): Promise<TwelveDataRawQuote> {
        try {
            const response = await this.client.get<TwelveDataRawQuote | { code: number; message: string; status: string }>(
                '/quote',
                { params: { symbol } },
            );
            const data = response.data as any;

            if (data && data.status === 'error') {
                throw new TwelveDataApiError(data.message || `Twelve Data error for symbol: ${symbol}`, data.code);
            }
            if (!data || !data.symbol) {
                throw new TwelveDataApiError(`No quote data returned for symbol: ${symbol}`);
            }
            return data as TwelveDataRawQuote;
        } catch (error: any) {
            logger.error(`Twelve Data fetchQuote error for ${symbol}:`, error.response?.data ?? error.message);
            throw error;
        }
    }

    private async fetchLogo(symbol: string): Promise<TwelveDataRawLogo> {
        try {
            const response = await this.client.get<TwelveDataRawLogo | { code: number; message: string; status: string }>(
                '/logo',
                { params: { symbol } },
            );
            const data = response.data as any;

            if (data && data.status === 'error') {
                throw new TwelveDataApiError(data.message || `No logo for symbol: ${symbol}`, data.code);
            }
            return data as TwelveDataRawLogo;
        } catch (error: any) {
            logger.error(`Twelve Data fetchLogo error for ${symbol}:`, error.response?.data ?? error.message);
            throw error;
        }
    }

    private async fetchSymbolSearch(query: string, outputsize: number): Promise<TwelveDataRawSymbolSearchItem[]> {
        try {
            const response = await this.client.get<TwelveDataRawSymbolSearchResponse | { code: number; message: string; status: string }>(
                '/symbol_search',
                { params: { symbol: query, outputsize } },
            );
            const data = response.data as any;

            if (data && data.status === 'error') {
                throw new TwelveDataApiError(data.message || `Symbol search failed for: ${query}`, data.code);
            }
            return (data?.data ?? []) as TwelveDataRawSymbolSearchItem[];
        } catch (error: any) {
            logger.error(`Twelve Data fetchSymbolSearch error for "${query}":`, error.response?.data ?? error.message);
            throw error;
        }
    }

    private async fetchTimeSeries(
        symbol: string,
        interval: string,
        outputsize: number,
    ): Promise<TwelveDataRawTimeSeriesResponse> {
        try {
            const response = await this.client.get<TwelveDataRawTimeSeriesResponse | { code: number; message: string; status: string }>(
                '/time_series',
                { params: { symbol, interval, outputsize } },
            );
            const data = response.data as any;

            if (data && data.status === 'error') {
                throw new TwelveDataApiError(data.message || `No time series for symbol: ${symbol}`, data.code);
            }
            return data as TwelveDataRawTimeSeriesResponse;
        } catch (error: any) {
            logger.error(`Twelve Data fetchTimeSeries error for ${symbol}:`, error.response?.data ?? error.message);
            throw error;
        }
    }

    // POST /batch — { "<id>": "/quote?symbol=AAPL&apikey=...", ... } in,
    // { code, status, data: { "<id>": <quote or error> } } out. One network
    // round trip for N symbols instead of N parallel /quote calls.
private async fetchBatch(requests: Record<string, string>): Promise<TwelveDataRawBatchResponse> {
        try {
            const response = await this.client.post<TwelveDataRawBatchResponse>('/batch', requests, {
                params: {}, // override this.client's default `?apikey=...` — must be empty for /batch
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `apikey ${config.TWELVE_DATA_API_KEY}`,
                },
            });
            return response.data;
        } catch (error: any) {
            logger.error('Twelve Data fetchBatch error:', error.response?.data ?? error.message);
            throw error;
        }
    }

    // ============================================
    // PRIVATE: NORMALISERS
    // Raw Twelve Data → our clean response shape
    // ============================================

    private normaliseQuote(
        raw: TwelveDataRawQuote,
        opts: { source: 'websocket' | 'rest'; market: TwelveDataMarket | null; logoUrl: string | null; logoUrlQuote?: string | null },
    ): TwelveDataQuote {
        return {
            symbol: raw.symbol,
            name: raw.name,
            exchange: raw.exchange,
            market: opts.market,
            currentPrice: parseFloat(raw.close),
            change: parseFloat(raw.change),
            changePercent: parseFloat(raw.percent_change),
            high: parseFloat(raw.high),
            low: parseFloat(raw.low),
            open: parseFloat(raw.open),
            previousClose: parseFloat(raw.previous_close),
            volume: raw.volume ? parseFloat(raw.volume) : 0,
            timestamp: raw.timestamp,
            isMarketOpen: !!raw.is_market_open,
            logoUrl: opts.logoUrl,
            logoUrlQuote: opts.logoUrlQuote ?? null,
            source: opts.source,
        };
    }

    private normaliseLogo(symbol: string, raw: TwelveDataRawLogo): TwelveDataLogo {
        if (raw.logo_base || raw.logo_quote) {
            // Forex/crypto pair — two icons, one per currency.
            return { symbol, logoUrl: raw.logo_base ?? null, logoUrlQuote: raw.logo_quote ?? null };
        }
        // Stock/ETF/mutual fund — one icon.
        return { symbol, logoUrl: raw.url ?? null };
    }

    private normaliseSearchItem(raw: TwelveDataRawSymbolSearchItem): TwelveDataSymbolSearchResult {
        return {
            symbol: raw.symbol,
            name: raw.instrument_name,
            exchange: raw.exchange,
            micCode: raw.mic_code,
            type: raw.instrument_type,
            market: mapInstrumentTypeToMarket(raw.instrument_type),
            country: raw.country,
            currency: raw.currency,
        };
    }

    private normaliseHistory(raw: TwelveDataRawTimeSeriesResponse): TwelveDataHistory {
        return {
            symbol: raw.meta.symbol,
            interval: raw.meta.interval,
            currency: raw.meta.currency,
            exchange: raw.meta.exchange,
            values: (raw.values ?? []).map((v: TwelveDataRawTimeSeriesValue) => ({
                datetime: v.datetime,
                open: parseFloat(v.open),
                high: parseFloat(v.high),
                low: parseFloat(v.low),
                close: parseFloat(v.close),
                volume: v.volume ? parseFloat(v.volume) : 0,
            })),
        };
    }

    // ============================================
    // PUBLIC: QUOTES
    // ============================================

    // Cache-through single quote. Checks the LIVE_PRICE key (written
    // continuously by twelvedata-ws.service.ts, for ANY market including
    // mutual funds) first; only falls back to a REST /quote call on a
    // genuine cache miss — first load before WS data has arrived, or a
    // quiet symbol between ticks.
    async getQuote(symbol: string): Promise<{ data: TwelveDataQuote; source: 'websocket' | 'rest' }> {
        const normSymbol = symbol.trim().toUpperCase();

        const live = await getCacheTD<TwelveDataQuote>(CACHE_KEYS_TD.LIVE_PRICE(normSymbol));
        if (live) {
            return { data: live, source: 'websocket' };
        }

        const snapshot = await getCacheTD<TwelveDataQuote>(CACHE_KEYS_TD.QUOTE(normSymbol));
        if (snapshot) {
            return { data: snapshot, source: 'rest' };
        }

        try {
            const [raw, logo] = await Promise.all([
                this.fetchQuote(normSymbol),
                this.getLogo(normSymbol),
            ]);

            const quote = this.normaliseQuote(raw, {
                source: 'rest',
                market: getDefaultMarketForSymbol(normSymbol),
                logoUrl: logo.logoUrl,
                logoUrlQuote: logo.logoUrlQuote ?? null,
            });

            await setCacheTD(CACHE_KEYS_TD.QUOTE(normSymbol), quote, CACHE_TTL_TD.QUOTE_SNAPSHOT);

            logger.info(`✅ Twelve Data quote fetched: ${normSymbol} @ ${quote.currentPrice}`);
            return { data: quote, source: 'rest' };
        } catch (error: any) {
            throw this.toApiError(error, `Failed to fetch quote for ${symbol}`);
        }
    }

    // Bulk quotes via Twelve Data's real batch mechanism. Checks the live
    // and snapshot caches first for every symbol; only the genuinely-missing
    // ones go into ONE /batch POST call, instead of N parallel /quote calls
    // (this is what Finnhub's getCryptoQuotes() approximates with
    // Promise.allSettled — Twelve Data gives us a first-class endpoint for it).
    async getBatchQuotes(symbols: string[]): Promise<{ data: TwelveDataQuote[] }> {
        const normSymbols = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()))).filter(Boolean);

        if (normSymbols.length === 0) {
            return { data: [] };
        }

        const results = new Map<string, TwelveDataQuote>();

        // 1. Live WS-cached prices — the fast, steady-state path.
        const liveEntries = await Promise.all(
            normSymbols.map(async (symbol) => [symbol, await getCacheTD<TwelveDataQuote>(CACHE_KEYS_TD.LIVE_PRICE(symbol))] as const),
        );
        for (const [symbol, quote] of liveEntries) {
            if (quote) results.set(symbol, quote);
        }

        // 2. REST snapshot cache next, for symbols not (yet) on the WS.
        const stillMissingAfterLive = normSymbols.filter((s) => !results.has(s));
        if (stillMissingAfterLive.length > 0) {
            const snapEntries = await Promise.all(
                stillMissingAfterLive.map(async (symbol) => [symbol, await getCacheTD<TwelveDataQuote>(CACHE_KEYS_TD.QUOTE(symbol))] as const),
            );
            for (const [symbol, quote] of snapEntries) {
                if (quote) results.set(symbol, quote);
            }
        }

        // 3. Whatever's genuinely left needs a fresh call — ONE /batch request.
        let lastBatchError: any = null;
        const needsFetch = normSymbols.filter((s) => !results.has(s));
        if (needsFetch.length > 0) {
            const requestMap: Record<string, string> = {};
            const idToSymbol = new Map<string, string>();
            needsFetch.forEach((symbol, i) => {
                const id = `q${i}`;
                // requestMap[id] = `/quote?symbol=${encodeURIComponent(symbol)}&apikey=${config.TWELVE_DATA_API_KEY}`;
                requestMap[id] = `/quote?symbol=${symbol}`;
                idToSymbol.set(id, symbol);
            });

            try {
                const batchResponse = await this.fetchBatch(requestMap);

                const logoLookups = await Promise.all(
                    needsFetch.map(async (symbol) => [symbol, await this.getLogo(symbol)] as const),
                );
                const logosBySymbol = new Map(logoLookups);

                const batchData: Record<string, TwelveDataRawQuote | TwelveDataRawBatchError> = batchResponse.data ?? {};
                for (const [requestId, item] of Object.entries(batchData)) {
                    const symbol = idToSymbol.get(requestId);
                    if (!symbol) continue;

                    if (isTwelveDataBatchError(item)) {
                        logger.warn(`⚠️ Twelve Data batch: skipped ${symbol} — ${item.message}`);
                        continue;
                    }

                    const logo = logosBySymbol.get(symbol);
                    const quote = this.normaliseQuote(item, {
                        source: 'rest',
                        market: getDefaultMarketForSymbol(symbol),
                        logoUrl: logo?.logoUrl ?? null,
                        logoUrlQuote: logo?.logoUrlQuote ?? null,
                    });

                    results.set(symbol, quote);
                    await setCacheTD(CACHE_KEYS_TD.QUOTE(symbol), quote, CACHE_TTL_TD.QUOTE_SNAPSHOT);
                }
            } catch (error: any) {
                lastBatchError = error;
                logger.error('Twelve Data getBatchQuotes /batch call failed:', error.response?.data ?? error.message);
                // Don't throw yet — live/snapshot results (if any) are still valid to return.
            }
        }

        if (results.size === 0) {
            const upstreamDetail = lastBatchError
                ? JSON.stringify(lastBatchError.response?.data ?? lastBatchError.message ?? 'unknown error')
                : 'no upstream call was made (all symbols resolved from cache with empty results)';
            throw ApiError.internal(`Failed to fetch any quotes from Twelve Data — upstream: ${upstreamDetail}`);
        }

        logger.info(`✅ Twelve Data batch quotes: ${results.size}/${normSymbols.length} symbol(s) resolved`);

        // Preserve the caller's requested order; drop any that never resolved.
        return {
            data: normSymbols.map((s) => results.get(s)).filter((q): q is TwelveDataQuote => !!q),
        };
    }

    // The Layer-1 "default watchlist" endpoint — batch-fetches quotes + merges
    // cached logos for every symbol in DEFAULT_TD_WATCHLIST (any market,
    // including mutual_funds) — ideal for a page's first paint before the
    // WebSocket connection finishes handshaking.
    async getDefaultWatchlist(market?: TwelveDataMarket): Promise<TwelveDataQuote[]> {
        const symbols: string[] = market
            ? [...(DEFAULT_TD_WATCHLIST as Record<string, readonly string[]>)[market]]
            : ALL_DEFAULT_TD_SYMBOLS;

        if (market && !symbols) {
            throw ApiError.badRequest(`Unknown market: ${market}`);
        }

        const { data } = await this.getBatchQuotes(symbols);
        return data;
    }

    // ============================================
    // PUBLIC: LOGOS
    // ============================================

    // Cache-through logo lookup (30-day TTL). Logo failures never break a
    // quote request — a symbol with no logo just gets a null-logo result,
    // which is itself cached so we don't keep re-querying a symbol that
    // simply doesn't have one.
    async getLogo(symbol: string): Promise<TwelveDataLogo> {
        const normSymbol = symbol.trim().toUpperCase();
        const cacheKey = CACHE_KEYS_TD.LOGO(normSymbol);

        const cached = await getCacheTD<TwelveDataLogo>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const raw = await this.fetchLogo(normSymbol);
            const logo = this.normaliseLogo(normSymbol, raw);
            await setCacheTD(cacheKey, logo, CACHE_TTL_TD.LOGO);
            return logo;
        } catch (error: any) {
            logger.warn(`Twelve Data logo unavailable for ${normSymbol}: ${error.message}`);
            const fallback: TwelveDataLogo = { symbol: normSymbol, logoUrl: null };
            await setCacheTD(cacheKey, fallback, CACHE_TTL_TD.LOGO);
            return fallback;
        }
    }

    // ============================================
    // PUBLIC: SEARCH
    // ============================================

    // Cache-through symbol search (1h TTL) — searches across ALL 5 markets
    // at once; `market` narrows the result set if the caller wants a
    // specific tab (Stocks/ETFs/Mutual Funds/Crypto/Forex).
    async searchSymbols(query: string, market?: TwelveDataMarket, outputsize = 30): Promise<TwelveDataSymbolSearchResult[]> {
        const cacheKey = CACHE_KEYS_TD.SEARCH(`${query}:${market ?? 'all'}:${outputsize}`);

        const cached = await getCacheTD<TwelveDataSymbolSearchResult[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const raw = await this.fetchSymbolSearch(query, outputsize);
            let results = raw.map((item) => this.normaliseSearchItem(item));
            if (market) {
                results = results.filter((r) => r.market === market);
            }

            await setCacheTD(cacheKey, results, CACHE_TTL_TD.SEARCH);
            logger.info(`✅ Twelve Data symbol search "${query}": ${results.length} result(s)`);
            return results;
        } catch (error: any) {
            throw this.toApiError(error, `Failed to search symbols for "${query}"`);
        }
    }

    // ============================================
    // PUBLIC: HISTORY (uncached — for charts)
    // ============================================

    async getHistory(symbol: string, interval: string = '1day', outputsize = 30): Promise<TwelveDataHistory> {
        try {
            const raw = await this.fetchTimeSeries(symbol.trim().toUpperCase(), interval, outputsize);
            const history = this.normaliseHistory(raw);
            logger.info(`✅ Twelve Data history fetched: ${symbol} (${interval}, ${history.values.length} points)`);
            return history;
        } catch (error: any) {
            throw this.toApiError(error, `Failed to fetch history for ${symbol}`);
        }
    }
}

export const twelveDataService = new TwelveDataService();
export default twelveDataService;
