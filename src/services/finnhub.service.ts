import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import {
    getCache,
    setCache,
    CACHE_TTL,
    CACHE_KEYS,
} from '../config/redis.config';
import {
    FinnhubRawQuote,
    FinnhubRawCryptoSymbol,
    FinnhubRawForexSymbol,
    FinnhubCryptoQuote,
    FinnhubForexQuote,
    FinnhubCryptoSymbol,
    FinnhubForexSymbol,
} from '../types/markets/finnhub/finnhub-response.types';
import { ApiError } from '../utils/ApiError';

// ============================================
// CRYPTO SYMBOLS WE SUPPORT
// Symbol format: EXCHANGE:COINUSDT
// ============================================
export const SUPPORTED_CRYPTO_SYMBOLS: { symbol: string; displaySymbol: string; name: string }[] = [
    { symbol: 'BINANCE:BTCUSDT', displaySymbol: 'BTC/USDT', name: 'BTC' },
    { symbol: 'BINANCE:ETHUSDT', displaySymbol: 'ETH/USDT', name: 'ETH' },
    { symbol: 'BINANCE:XRPUSDT', displaySymbol: 'XRP/USDT', name: 'XRP' },
    { symbol: 'BINANCE:SOLUSDT', displaySymbol: 'SOL/USDT', name: 'SOL' },
    { symbol: 'BINANCE:DOGEUSDT', displaySymbol: 'DOGE/USDT', name: 'DOGE' },
    { symbol: 'BINANCE:ADAUSDT', displaySymbol: 'ADA/USDT', name: 'ADA' },
    { symbol: 'BINANCE:AVAXUSDT', displaySymbol: 'AVAX/USDT', name: 'AVAX' },
    { symbol: 'BINANCE:DOTUSDT', displaySymbol: 'DOT/USDT', name: 'DOT' },
    { symbol: 'BINANCE:LTCUSDT', displaySymbol: 'LTC/USDT', name: 'LTC' },
    { symbol: 'BINANCE:LINKUSDT', displaySymbol: 'LINK/USDT', name: 'LINK' },
];

// ============================================
// FOREX PAIRS WE SUPPORT
// Symbol format: OANDA:BASE_QUOTE
// ============================================
export const SUPPORTED_FOREX_SYMBOLS: { symbol: string; displaySymbol: string; base: string; quote: string }[] = [
    { symbol: 'OANDA:EUR_USD', displaySymbol: 'EUR/USD', base: 'EUR', quote: 'USD' },
    { symbol: 'OANDA:GBP_USD', displaySymbol: 'GBP/USD', base: 'GBP', quote: 'USD' },
    { symbol: 'OANDA:USD_JPY', displaySymbol: 'USD/JPY', base: 'USD', quote: 'JPY' },
    { symbol: 'OANDA:USD_CHF', displaySymbol: 'USD/CHF', base: 'USD', quote: 'CHF' },
    { symbol: 'OANDA:AUD_USD', displaySymbol: 'AUD/USD', base: 'AUD', quote: 'USD' },
    { symbol: 'OANDA:USD_CAD', displaySymbol: 'USD/CAD', base: 'USD', quote: 'CAD' },
    { symbol: 'OANDA:NZD_USD', displaySymbol: 'NZD/USD', base: 'NZD', quote: 'USD' },
    { symbol: 'OANDA:EUR_GBP', displaySymbol: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
];

class FinnhubService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://finnhub.io/api/v1',
            timeout: 15000,  // ← increase from 10000
            params: {
                token: config.FINNHUB_API_KEY,
            },
        });
    }

    // ============================================
    // PRIVATE: RAW API CALLS TO FINNHUB
    // ============================================

    private async fetchQuote(symbol: string): Promise<FinnhubRawQuote> {
        try {
            const response = await this.client.get<FinnhubRawQuote>('/quote', {
                params: { symbol },
            });

            // Finnhub returns all zeros if symbol not found
            if (!response.data || response.data.c === 0) {
                throw new Error(`No data returned for symbol: ${symbol}`);
            }

            return response.data;
        } catch (error: any) {
            logger.error(`Finnhub fetchQuote error for ${symbol}:`, error.message);
            throw error;
        }
    }

    private async fetchCryptoSymbols(exchange: string): Promise<FinnhubRawCryptoSymbol[]> {
        try {
            const response = await this.client.get<FinnhubRawCryptoSymbol[]>('/crypto/symbol', {
                params: { exchange },
            });
            return response.data || [];
        } catch (error: any) {
            logger.error(`Finnhub fetchCryptoSymbols error for ${exchange}:`, error.message);
            throw error;
        }
    }

    private async fetchForexSymbols(exchange: string): Promise<FinnhubRawForexSymbol[]> {
        try {
            const response = await this.client.get<FinnhubRawForexSymbol[]>('/forex/symbol', {
                params: { exchange },
            });
            return response.data || [];
        } catch (error: any) {
            logger.error(`Finnhub fetchForexSymbols error for ${exchange}:`, error.message);
            throw error;
        }
    }

    // ============================================
    // PRIVATE: NORMALISERS
    // Raw Finnhub → Our clean response shape
    // ============================================

    private normaliseCryptoQuote(
        raw: FinnhubRawQuote,
        symbol: string,
        displaySymbol: string,
        name: string,
    ): FinnhubCryptoQuote {
        const exchange = symbol.split(':')[0] || 'BINANCE';
        return {
            symbol,
            displaySymbol,
            name,
            currentPrice: raw.c,
            change: raw.d,
            changePercent: raw.dp,
            high: raw.h,
            low: raw.l,
            open: raw.o,
            previousClose: raw.pc,
            timestamp: raw.t,
            exchange,
        };
    }

    private normaliseForexQuote(
        raw: FinnhubRawQuote,
        symbol: string,
        displaySymbol: string,
        base: string,
        quote: string,
    ): FinnhubForexQuote {
        const exchange = symbol.split(':')[0] || 'OANDA';
        return {
            symbol,
            displaySymbol,
            baseCurrency: base,
            quoteCurrency: quote,
            currentPrice: raw.c,
            change: raw.d,
            changePercent: raw.dp,
            high: raw.h,
            low: raw.l,
            open: raw.o,
            previousClose: raw.pc,
            timestamp: raw.t,
            exchange,
        };
    }

    // ============================================
    // PUBLIC: CRYPTO METHODS
    // ============================================

    // Get single crypto quote with caching
    async getCryptoQuote(symbol: string): Promise<{ data: FinnhubCryptoQuote; cached: boolean }> {
        const cacheKey = CACHE_KEYS.CRYPTO_QUOTE(symbol);

        // 1. Check cache first
        const cached = await getCache<FinnhubCryptoQuote>(cacheKey);
        if (cached) {
            return { data: cached, cached: true };
        }

        // 2. Cache miss — fetch from Finnhub
        const symbolInfo = SUPPORTED_CRYPTO_SYMBOLS.find((s) => s.symbol === symbol);
        if (!symbolInfo) {
            throw ApiError.badRequest(`Unsupported crypto symbol: ${symbol}`);
        }

        try {
            const raw = await this.fetchQuote(symbol);
            const normalised = this.normaliseCryptoQuote(
                raw,
                symbol,
                symbolInfo.displaySymbol,
                symbolInfo.name,
            );

            // 3. Store in cache
            await setCache(cacheKey, normalised, CACHE_TTL.CRYPTO_QUOTES);

            logger.info(`✅ Finnhub crypto quote fetched: ${symbol} @ $${normalised.currentPrice}`);
            return { data: normalised, cached: false };
        } catch (error: any) {
            throw ApiError.internal(`Failed to fetch crypto quote for ${symbol}`);
        }
    }

    // Get ALL supported crypto quotes — this is the bulk endpoint
    // 100 users hit this → only 1 Finnhub call every 30s (thanks to Redis)
    async getCryptoQuotes(): Promise<{ data: FinnhubCryptoQuote[]; cached: boolean }> {
        const cacheKey = CACHE_KEYS.CRYPTO_QUOTES_ALL;

        const cached = await getCache<FinnhubCryptoQuote[]>(cacheKey);
        if (cached) {
            return { data: cached, cached: true };
        }

        // Parallel fetch — all symbols at once, failures don't block others
        const promises = SUPPORTED_CRYPTO_SYMBOLS.map((symbolInfo) =>
            this.fetchQuote(symbolInfo.symbol).then((raw) =>
                this.normaliseCryptoQuote(raw, symbolInfo.symbol, symbolInfo.displaySymbol, symbolInfo.name)
            )
        );

        const settled = await Promise.allSettled(promises);
        const results: FinnhubCryptoQuote[] = [];
        const failed: string[] = [];

        settled.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                const symbol = SUPPORTED_CRYPTO_SYMBOLS[index].symbol;
                logger.warn(`⚠️ Failed to fetch ${symbol}: ${result.reason?.message}`);
                failed.push(symbol);
            }
        });

        if (results.length === 0) {
            throw ApiError.internal('Failed to fetch any crypto quotes from Finnhub');
        }

        if (failed.length > 0) {
            logger.warn(`⚠️ Skipped ${failed.length} symbols: ${failed.join(', ')}`);
        }

        await setCache(cacheKey, results, CACHE_TTL.CRYPTO_QUOTES);
        logger.info(`✅ Finnhub bulk crypto quotes fetched: ${results.length} symbols`);
        return { data: results, cached: false };
    }

    // Get crypto symbols list for an exchange
    async getCryptoSymbols(exchange: string): Promise<{ data: FinnhubCryptoSymbol[]; cached: boolean }> {
        const cacheKey = CACHE_KEYS.CRYPTO_SYMBOLS(exchange);

        const cached = await getCache<FinnhubCryptoSymbol[]>(cacheKey);
        if (cached) {
            return { data: cached, cached: true };
        }

        try {
            const raw = await this.fetchCryptoSymbols(exchange);
            const normalised: FinnhubCryptoSymbol[] = raw.map((s) => ({
                description: s.description,
                displaySymbol: s.displaySymbol,
                symbol: s.symbol,
            }));

            await setCache(cacheKey, normalised, CACHE_TTL.CRYPTO_SYMBOLS);

            logger.info(`✅ Finnhub crypto symbols fetched for ${exchange}: ${normalised.length} symbols`);
            return { data: normalised, cached: false };
        } catch (error: any) {
            throw ApiError.internal(`Failed to fetch crypto symbols for ${exchange}`);
        }
    }

    // ============================================
    // PUBLIC: FOREX METHODS
    // ============================================

    // Get single forex quote with caching
    async getForexQuote(symbol: string): Promise<{ data: FinnhubForexQuote; cached: boolean }> {
        const cacheKey = CACHE_KEYS.FOREX_QUOTE(symbol);

        const cached = await getCache<FinnhubForexQuote>(cacheKey);
        if (cached) {
            return { data: cached, cached: true };
        }

        const symbolInfo = SUPPORTED_FOREX_SYMBOLS.find((s) => s.symbol === symbol);
        if (!symbolInfo) {
            throw ApiError.badRequest(`Unsupported forex symbol: ${symbol}`);
        }

        try {
            const raw = await this.fetchQuote(symbol);
            const normalised = this.normaliseForexQuote(
                raw,
                symbol,
                symbolInfo.displaySymbol,
                symbolInfo.base,
                symbolInfo.quote,
            );

            await setCache(cacheKey, normalised, CACHE_TTL.FOREX_QUOTES);

            logger.info(`✅ Finnhub forex quote fetched: ${symbol} @ ${normalised.currentPrice}`);
            return { data: normalised, cached: false };
        } catch (error: any) {
            throw ApiError.internal(`Failed to fetch forex quote for ${symbol}`);
        }
    }

    // Get ALL supported forex quotes — bulk endpoint with caching
    async getForexQuotes(): Promise<{ data: FinnhubForexQuote[]; cached: boolean }> {
        const cacheKey = CACHE_KEYS.FOREX_QUOTES_ALL;

        const cached = await getCache<FinnhubForexQuote[]>(cacheKey);
        if (cached) {
            return { data: cached, cached: true };
        }

        const promises = SUPPORTED_FOREX_SYMBOLS.map((symbolInfo) =>
            this.fetchQuote(symbolInfo.symbol).then((raw) =>
                this.normaliseForexQuote(raw, symbolInfo.symbol, symbolInfo.displaySymbol, symbolInfo.base, symbolInfo.quote)
            )
        );

        const settled = await Promise.allSettled(promises);
        const results: FinnhubForexQuote[] = [];
        const failed: string[] = [];

        settled.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                const symbol = SUPPORTED_FOREX_SYMBOLS[index].symbol;
                logger.warn(`⚠️ Failed to fetch ${symbol}: ${result.reason?.message}`);
                failed.push(symbol);
            }
        });

        if (results.length === 0) {
            throw ApiError.internal('Failed to fetch any forex quotes from Finnhub');
        }

        if (failed.length > 0) {
            logger.warn(`⚠️ Skipped ${failed.length} symbols: ${failed.join(', ')}`);
        }

        await setCache(cacheKey, results, CACHE_TTL.FOREX_QUOTES);
        logger.info(`✅ Finnhub bulk forex quotes fetched: ${results.length} pairs`);
        return { data: results, cached: false };
    }

    // Get forex symbols list for an exchange
    async getForexSymbols(exchange: string): Promise<{ data: FinnhubForexSymbol[]; cached: boolean }> {
        const cacheKey = CACHE_KEYS.FOREX_SYMBOLS(exchange);

        const cached = await getCache<FinnhubForexSymbol[]>(cacheKey);
        if (cached) {
            return { data: cached, cached: true };
        }

        try {
            const raw = await this.fetchForexSymbols(exchange);
            const normalised: FinnhubForexSymbol[] = raw.map((s) => ({
                description: s.description,
                displaySymbol: s.displaySymbol,
                symbol: s.symbol,
            }));

            await setCache(cacheKey, normalised, CACHE_TTL.FOREX_SYMBOLS);

            logger.info(`✅ Finnhub forex symbols fetched for ${exchange}: ${normalised.length} pairs`);
            return { data: normalised, cached: false };
        } catch (error: any) {
            throw ApiError.internal(`Failed to fetch forex symbols for ${exchange}`);
        }
    }
}

export const finnhubService = new FinnhubService();
export default finnhubService;