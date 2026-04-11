// src/services/markets-av.service.ts

import axios from 'axios';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import type {
    CryptoQuote,
    CryptoIntradayData,
    CryptoHistoryDay,
    ForexQuote,
    ForexIntradayData,
    ForexHistoryDay,
    MutualFundQuote,
    MutualFundHistoryDay,
    AlphaVantageCurrencyExchangeResponse,
    AlphaVantageCryptoIntradayResponse,
    AlphaVantageCryptoDailyResponse,
    AlphaVantageForexIntradayResponse,
    AlphaVantageForexDailyResponse,
    AlphaVantageDailyResponse,
    AlphaVantageWeeklyResponse,
    AlphaVantageMonthlyResponse,
    MarketStatus,
    AlphaVantageMarketStatusResponse,
    TopGainersLosers,
    AlphaVantageTopGainersLosersResponse,
} from '../types';

/**
 * Markets AV Service
 * Handles all Alpha Vantage API calls for Crypto, Forex, and Mutual Funds
 * Used alongside tradier.service.ts which handles Stocks and ETFs
 */
export class MarketsAvService {

    private static readonly BASE_URL = 'https://www.alphavantage.co/query';

    // Axios instance with timeout — same pattern as news.service.ts
    private static readonly axiosInstance = axios.create({
        timeout: 15000,
    });

    // ── Crypto ──────────────────────────────────────────────────────────────────

    /**
     * Get real-time crypto quote
     * Uses: CURRENCY_EXCHANGE_RATE
     * @param symbol - Crypto symbol (e.g., 'BTC', 'ETH')
     * @param market - Market currency (e.g., 'USD')
     * @returns CryptoQuote
     */
    static async getCryptoQuote(
        symbol: string,
        market: string = 'USD'
    ): Promise<CryptoQuote> {
        try {
            logger.info(`Fetching crypto quote for: ${symbol}/${market}`);

            const response = await this.axiosInstance.get<AlphaVantageCurrencyExchangeResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'CURRENCY_EXCHANGE_RATE',
                        from_currency: symbol,
                        to_currency: market,
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const data = response.data['Realtime Currency Exchange Rate'];

            if (!data) {
                throw ApiError.notFound(`No data found for crypto symbol: ${symbol}`);
            }

            const price = parseFloat(data['5. Exchange Rate']);
            const bid = parseFloat(data['8. Bid Price']);
            const ask = parseFloat(data['9. Ask Price']);
            const open = bid || price;

            const change = price - open;
            const change_percentage = open !== 0 ? (change / open) * 100 : 0;

            logger.info(`Successfully fetched crypto quote for: ${symbol}`);

            return {
                symbol: data['1. From_Currency Code'],
                name: data['2. From_Currency Name'],
                market: data['3. To_Currency Code'],
                price,
                open,
                high: ask,
                low: bid,
                volume: 0,
                last_refreshed: data['6. Last Refreshed'],
                change,
                change_percentage,
            };
        } catch (error: any) {
            logger.error('MarketsAV getCryptoQuote error', {
                error: error.message,
                symbol,
                market,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch crypto quote');
        }
    }

    /**
     * Get crypto intraday data (Premium)
     * Uses: CRYPTO_INTRADAY
     * @param symbol - Crypto symbol (e.g., 'ETH', 'BTC')
     * @param market - Market currency (e.g., 'USD')
     * @param interval - 1min | 5min | 15min | 30min | 60min
     * @param outputsize - compact (100 points) | full (all)
     * @returns Array of CryptoIntradayData
     */
    static async getCryptoIntraday(
        symbol: string,
        market: string = 'USD',
        interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min',
        outputsize: 'compact' | 'full' = 'compact'
    ): Promise<CryptoIntradayData[]> {
        try {
            logger.info(`Fetching crypto intraday for: ${symbol}/${market}, interval: ${interval}`);

            const response = await this.axiosInstance.get<AlphaVantageCryptoIntradayResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'CRYPTO_INTRADAY',
                        symbol,
                        market,
                        interval,
                        outputsize,
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            // Key is dynamic based on interval e.g. "Time Series Crypto (5min)"
            const timeSeriesKey = `Time Series Crypto (${interval})`;
            const timeSeries = response.data[timeSeriesKey] as Record<string, {
                '1. open': string;
                '2. high': string;
                '3. low': string;
                '4. close': string;
                '5. volume': string;
            }> | undefined;

            if (!timeSeries) {
                logger.warn(`No crypto intraday data for: ${symbol}`);
                return [];
            }

            const data: CryptoIntradayData[] = Object.entries(timeSeries)
                .slice(0, 100)
                .map(([timestamp, values]) => ({
                    timestamp,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                    volume: parseFloat(values['5. volume']),
                }));

            logger.info(`Successfully fetched ${data.length} crypto intraday records for: ${symbol}`);

            return data;
        } catch (error: any) {
            logger.error('MarketsAV getCryptoIntraday error', {
                error: error.message,
                symbol,
                market,
                interval,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch crypto intraday data');
        }
    }

    /**
     * Get crypto historical data
     * Uses: DIGITAL_CURRENCY_DAILY / WEEKLY / MONTHLY
     * FIX: Each interval has a different time series key in the response
     * @param symbol - Crypto symbol (e.g., 'BTC', 'ETH')
     * @param market - Market currency (e.g., 'USD')
     * @param interval - daily | weekly | monthly
     * @returns Array of CryptoHistoryDay
     */
    static async getCryptoHistory(
        symbol: string,
        market: string = 'USD',
        interval: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<CryptoHistoryDay[]> {
        try {
            logger.info(`Fetching crypto history for: ${symbol}/${market}, interval: ${interval}`);

            const functionMap = {
                daily: 'DIGITAL_CURRENCY_DAILY',
                weekly: 'DIGITAL_CURRENCY_WEEKLY',
                monthly: 'DIGITAL_CURRENCY_MONTHLY',
            };

            // FIX: Each interval returns a different time series key
            const timeSeriesKeyMap = {
                daily: 'Time Series (Digital Currency Daily)',
                weekly: 'Time Series (Digital Currency Weekly)',
                monthly: 'Time Series (Digital Currency Monthly)',
            };

            const response = await this.axiosInstance.get<AlphaVantageCryptoDailyResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: functionMap[interval],
                        symbol,
                        market,
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const timeSeriesKey = timeSeriesKeyMap[interval];
            const timeSeries = response.data[timeSeriesKey] as Record<string, {
                '1. open': string;
                '2. high': string;
                '3. low': string;
                '4. close': string;
                '5. volume': string;
            }> | undefined;

            if (!timeSeries) {
                logger.warn(`No crypto history data for: ${symbol}`);
                return [];
            }

            const history: CryptoHistoryDay[] = Object.entries(timeSeries)
                .slice(0, 100)
                .map(([date, values]) => ({
                    date,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                    volume: parseFloat(values['5. volume']),
                }));

            logger.info(`Successfully fetched ${history.length} crypto history records for: ${symbol}`);

            return history;
        } catch (error: any) {
            logger.error('MarketsAV getCryptoHistory error', {
                error: error.message,
                symbol,
                market,
                interval,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch crypto history');
        }
    }

    // ── Forex ───────────────────────────────────────────────────────────────────

    /**
     * Get real-time forex exchange rate
     * Uses: CURRENCY_EXCHANGE_RATE
     * @param fromCurrency - From currency (e.g., 'EUR')
     * @param toCurrency - To currency (e.g., 'USD')
     * @returns ForexQuote
     */
    static async getForexRate(
        fromCurrency: string,
        toCurrency: string = 'USD'
    ): Promise<ForexQuote> {
        try {
            logger.info(`Fetching forex rate for: ${fromCurrency}/${toCurrency}`);

            const response = await this.axiosInstance.get<AlphaVantageCurrencyExchangeResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'CURRENCY_EXCHANGE_RATE',
                        from_currency: fromCurrency,
                        to_currency: toCurrency,
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const data = response.data['Realtime Currency Exchange Rate'];

            if (!data) {
                throw ApiError.notFound(`No data found for forex pair: ${fromCurrency}/${toCurrency}`);
            }

            logger.info(`Successfully fetched forex rate for: ${fromCurrency}/${toCurrency}`);

            return {
                from_currency: data['1. From_Currency Code'],
                from_name: data['2. From_Currency Name'],
                to_currency: data['3. To_Currency Code'],
                to_name: data['4. To_Currency Name'],
                rate: parseFloat(data['5. Exchange Rate']),
                bid: parseFloat(data['8. Bid Price']),
                ask: parseFloat(data['9. Ask Price']),
                last_refreshed: data['6. Last Refreshed'],
            };
        } catch (error: any) {
            logger.error('MarketsAV getForexRate error', {
                error: error.message,
                fromCurrency,
                toCurrency,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch forex rate');
        }
    }

    /**
     * Get forex intraday data (Premium)
     * Uses: FX_INTRADAY
     * @param fromCurrency - From currency (e.g., 'EUR')
     * @param toCurrency - To currency (e.g., 'USD')
     * @param interval - 1min | 5min | 15min | 30min | 60min
     * @param outputsize - compact (100 points) | full (all)
     * @returns Array of ForexIntradayData
     */
    static async getForexIntraday(
        fromCurrency: string,
        toCurrency: string = 'USD',
        interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min',
        outputsize: 'compact' | 'full' = 'compact'
    ): Promise<ForexIntradayData[]> {
        try {
            logger.info(`Fetching forex intraday for: ${fromCurrency}/${toCurrency}, interval: ${interval}`);

            const response = await this.axiosInstance.get<AlphaVantageForexIntradayResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'FX_INTRADAY',
                        from_symbol: fromCurrency,
                        to_symbol: toCurrency,
                        interval,
                        outputsize,
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            // Key is dynamic based on interval e.g. "Time Series FX (5min)"
            const timeSeriesKey = `Time Series FX (${interval})`;
            const timeSeries = response.data[timeSeriesKey] as Record<string, {
                '1. open': string;
                '2. high': string;
                '3. low': string;
                '4. close': string;
            }> | undefined;

            if (!timeSeries) {
                logger.warn(`No forex intraday data for: ${fromCurrency}/${toCurrency}`);
                return [];
            }

            const data: ForexIntradayData[] = Object.entries(timeSeries)
                .slice(0, 100)
                .map(([timestamp, values]) => ({
                    timestamp,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                }));

            logger.info(`Successfully fetched ${data.length} forex intraday records for: ${fromCurrency}/${toCurrency}`);

            return data;
        } catch (error: any) {
            logger.error('MarketsAV getForexIntraday error', {
                error: error.message,
                fromCurrency,
                toCurrency,
                interval,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch forex intraday data');
        }
    }

    /**
     * Get forex historical data
     * Uses: FX_DAILY / FX_WEEKLY / FX_MONTHLY
     * FIX: Each interval has a different time series key in the response
     * @param fromCurrency - From currency (e.g., 'EUR')
     * @param toCurrency - To currency (e.g., 'USD')
     * @param interval - daily | weekly | monthly
     * @returns Array of ForexHistoryDay
     */
    static async getForexHistory(
        fromCurrency: string,
        toCurrency: string = 'USD',
        interval: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<ForexHistoryDay[]> {
        try {
            logger.info(`Fetching forex history for: ${fromCurrency}/${toCurrency}, interval: ${interval}`);

            const functionMap = {
                daily: 'FX_DAILY',
                weekly: 'FX_WEEKLY',
                monthly: 'FX_MONTHLY',
            };

            // FIX: Each interval returns a different time series key
            const timeSeriesKeyMap = {
                daily: 'Time Series FX (Daily)',
                weekly: 'Time Series FX (Weekly)',
                monthly: 'Time Series FX (Monthly)',
            };

            const response = await this.axiosInstance.get<AlphaVantageForexDailyResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: functionMap[interval],
                        from_symbol: fromCurrency,
                        to_symbol: toCurrency,
                        outputsize: 'compact',
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const timeSeriesKey = timeSeriesKeyMap[interval];
            const timeSeries = response.data[timeSeriesKey] as Record<string, {
                '1. open': string;
                '2. high': string;
                '3. low': string;
                '4. close': string;
            }> | undefined;

            if (!timeSeries) {
                logger.warn(`No forex history data for: ${fromCurrency}/${toCurrency}`);
                return [];
            }

            const history: ForexHistoryDay[] = Object.entries(timeSeries)
                .slice(0, 100)
                .map(([date, values]) => ({
                    date,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                }));

            logger.info(`Successfully fetched ${history.length} forex history records for: ${fromCurrency}/${toCurrency}`);

            return history;
        } catch (error: any) {
            logger.error('MarketsAV getForexHistory error', {
                error: error.message,
                fromCurrency,
                toCurrency,
                interval,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch forex history');
        }
    }

    // ── Mutual Funds ─────────────────────────────────────────────────────────────

    /**
     * Get mutual fund quote
     * Uses: TIME_SERIES_DAILY (AV treats mutual funds same as equities)
     * @param symbol - Fund symbol (e.g., 'VFIAX')
     * @returns MutualFundQuote
     */
    static async getMutualFundQuote(symbol: string): Promise<MutualFundQuote> {
        try {
            logger.info(`Fetching mutual fund quote for: ${symbol}`);

            const response = await this.axiosInstance.get<AlphaVantageDailyResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'TIME_SERIES_DAILY',
                        symbol,
                        outputsize: 'compact',
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const meta = response.data['Meta Data'];
            const timeSeries = response.data['Time Series (Daily)'];

            if (!timeSeries || !meta) {
                throw ApiError.notFound(`No data found for mutual fund symbol: ${symbol}`);
            }

            // Get most recent trading day
            const latestDate = Object.keys(timeSeries)[0];
            const latest = timeSeries[latestDate];

            const open = parseFloat(latest['1. open']);
            const high = parseFloat(latest['2. high']);
            const low = parseFloat(latest['3. low']);
            const close = parseFloat(latest['4. close']);
            const volume = parseFloat(latest['5. volume']);

            const change = close - open;
            const change_percentage = open !== 0 ? (change / open) * 100 : 0;

            logger.info(`Successfully fetched mutual fund quote for: ${symbol}`);

            return {
                symbol,
                name: meta['2. Symbol'],
                price: close,
                open,
                high,
                low,
                volume,
                last_refreshed: meta['3. Last Refreshed'],
                change,
                change_percentage,
            };
        } catch (error: any) {
            logger.error('MarketsAV getMutualFundQuote error', {
                error: error.message,
                symbol,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch mutual fund quote');
        }
    }

    /**
     * Get mutual fund historical data
     * Uses: TIME_SERIES_DAILY / WEEKLY / MONTHLY
     * FIX: Each interval returns a different time series key
     *   daily   → "Time Series (Daily)"
     *   weekly  → "Weekly Time Series"
     *   monthly → "Monthly Time Series"
     * @param symbol - Fund symbol (e.g., 'VFIAX')
     * @param interval - daily | weekly | monthly
     * @returns Array of MutualFundHistoryDay
     */
    static async getMutualFundHistory(
        symbol: string,
        interval: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<MutualFundHistoryDay[]> {
        try {
            logger.info(`Fetching mutual fund history for: ${symbol}, interval: ${interval}`);

            const functionMap = {
                daily: 'TIME_SERIES_DAILY',
                weekly: 'TIME_SERIES_WEEKLY',
                monthly: 'TIME_SERIES_MONTHLY',
            };

            // FIX: Each interval returns a completely different time series key
            const timeSeriesKeyMap = {
                daily: 'Time Series (Daily)',
                weekly: 'Weekly Time Series',
                monthly: 'Monthly Time Series',
            };

            type ResponseType = AlphaVantageDailyResponse | AlphaVantageWeeklyResponse | AlphaVantageMonthlyResponse;

            const response = await this.axiosInstance.get<ResponseType>(
                this.BASE_URL,
                {
                    params: {
                        function: functionMap[interval],
                        symbol,
                        outputsize: 'compact',
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const timeSeriesKey = timeSeriesKeyMap[interval];
            const timeSeries = (response.data as any)[timeSeriesKey] as Record<string, {
                '1. open': string;
                '2. high': string;
                '3. low': string;
                '4. close': string;
                '5. volume': string;
            }> | undefined;

            if (!timeSeries) {
                logger.warn(`No mutual fund history data for: ${symbol}`);
                return [];
            }

            const history: MutualFundHistoryDay[] = Object.entries(timeSeries)
                .slice(0, 100)
                .map(([date, values]) => ({
                    date,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                    volume: parseFloat(values['5. volume']),
                }));

            logger.info(`Successfully fetched ${history.length} mutual fund history records for: ${symbol}`);

            return history;
        } catch (error: any) {
            logger.error('MarketsAV getMutualFundHistory error', {
                error: error.message,
                symbol,
                interval,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch mutual fund history');
        }
    }

    // ── Top Gainers / Losers / Most Active ───────────────────────────────────────

    /**
     * Get top gainers, top losers, and most actively traded US stocks
     * Uses: TOP_GAINERS_LOSERS
     * Returns top 20 in each category — updated end of each trading day
     * With premium key + entitlement=realtime → live data during trading hours
     * @returns TopGainersLosers
     */
    static async getTopGainersLosers(): Promise<TopGainersLosers> {
        try {
            logger.info('Fetching top gainers, losers, and most active');

            const response = await this.axiosInstance.get<AlphaVantageTopGainersLosersResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'TOP_GAINERS_LOSERS',
                        // entitlement: 'realtime',
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const data = response.data as any;

            if (data?.Information) {
                logger.warn('Alpha Vantage plan restriction:', data.Information);
                throw ApiError.internal('Top gainers/losers not available on current plan');
            }

            if (data?.Note) {
                logger.warn('Alpha Vantage rate limit:', data.Note);
                throw ApiError.internal('Rate limit reached. Please try again in a minute');
            }

            if (!data || !data.top_gainers) {
                throw ApiError.notFound('No top gainers/losers data available');
            }

            logger.info(
                `Successfully fetched top gainers/losers. ` +
                `Gainers: ${data.top_gainers.length}, ` +
                `Losers: ${data.top_losers.length}, ` +
                `Active: ${data.most_actively_traded.length}`
            );

            return {
                top_gainers: data.top_gainers,
                top_losers: data.top_losers,
                most_actively_traded: data.most_actively_traded,
                last_updated: data.last_updated,
            };
        } catch (error: any) {
            logger.error('MarketsAV getTopGainersLosers error', {
                error: error.message,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch top gainers/losers');
        }
    }

    // ── Market Status ────────────────────────────────────────────────────────────

    /**
     * Get current open/closed status of major global trading venues
     * Uses: MARKET_STATUS
     * Covers: US equities, forex, crypto, major international exchanges
     * @returns MarketStatus
     */
    static async getMarketStatus(): Promise<MarketStatus> {
        try {
            logger.info('Fetching global market status');

            const response = await this.axiosInstance.get<AlphaVantageMarketStatusResponse>(
                this.BASE_URL,
                {
                    params: {
                        function: 'MARKET_STATUS',
                        apikey: config.ALPHA_VANTAGE_API_KEY,
                    },
                }
            );

            const data = response.data;

            if (!data || !data.markets) {
                throw ApiError.notFound('No market status data available');
            }

            logger.info(`Successfully fetched market status for ${data.markets.length} markets`);

            return {
                markets: data.markets,
            };
        } catch (error: any) {
            logger.error('MarketsAV getMarketStatus error', {
                error: error.message,
            });

            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Invalid Alpha Vantage API key');
            }

            throw ApiError.internal('Failed to fetch market status');
        }
    }
}