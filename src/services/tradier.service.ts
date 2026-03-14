// src/services/tradier.service.ts

import axios from 'axios';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import type {
  QuotesResponse,
  HistoryResponse,
  TimeSalesResponse,
  SearchResponse,
  Quote,
  HistoryDay,
  TimeSalesData,
  Security,
} from '../types';

/**
 * Tradier Service
 * Handles all Tradier API calls for market data
 */
export class TradierService {
  
  /**
   * Get real-time quotes for one or more symbols
   * @param symbols - Array of stock/ETF symbols (e.g., ['AAPL', 'TSLA'])
   * @returns Array of quotes
   */
  static async getQuotes(symbols: string[]): Promise<Quote[]> {
    try {
      const symbolsParam = symbols.join(',');
      
      logger.info(`Fetching quotes for: ${symbolsParam}`);

      const response = await axios.get<QuotesResponse>(
        `${config.TRADIER_API_URL}/markets/quotes`,
        {
          params: { symbols: symbolsParam, greeks: false },
          headers: {
            'Authorization': `Bearer ${config.TRADIER_ACCESS_TOKEN}`,
            'Accept': 'application/json',
          },
        }
      );

      // Handle single vs multiple quotes
      const quotesData = response.data.quotes.quote;
      const quotes = Array.isArray(quotesData) ? quotesData : [quotesData];

      logger.info(`Successfully fetched ${quotes.length} quotes`);
      
      return quotes;
    } catch (error: any) {
      logger.error('Tradier getQuotes error', { 
        error: error.message,
        symbols,
      });
      
      if (error.response?.status === 401) {
        throw ApiError.unauthorized('Invalid Tradier API token');
      }
      
      throw ApiError.internal('Failed to fetch market quotes');
    }
  }

  /**
   * Get historical price data for a symbol
   * @param symbol - Stock/ETF symbol (e.g., 'AAPL')
   * @param interval - Time interval (daily, weekly, monthly)
   * @param start - Start date (YYYY-MM-DD)
   * @param end - End date (YYYY-MM-DD)
   * @returns Array of historical data
   */
  static async getHistory(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    start?: string,
    end?: string
  ): Promise<HistoryDay[]> {
    try {
      logger.info(`Fetching history for: ${symbol}, interval: ${interval}`);

      const params: any = { symbol, interval };
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await axios.get<HistoryResponse>(
        `${config.TRADIER_API_URL}/markets/history`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${config.TRADIER_ACCESS_TOKEN}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.data.history) {
        logger.warn(`No history data for symbol: ${symbol}`);
        return [];
      }

      const historyData = response.data.history.day;
      const history = Array.isArray(historyData) ? historyData : [historyData];

      logger.info(`Successfully fetched ${history.length} history records`);
      
      return history;
    } catch (error: any) {
      logger.error('Tradier getHistory error', { 
        error: error.message,
        symbol,
        interval,
      });
      
      if (error.response?.status === 401) {
        throw ApiError.unauthorized('Invalid Tradier API token');
      }
      
      throw ApiError.internal('Failed to fetch historical data');
    }
  }

  /**
   * Get intraday time & sales data for a symbol
   * @param symbol - Stock/ETF symbol (e.g., 'AAPL')
   * @param interval - Time interval (1min, 5min, 15min)
   * @param start - Start date (YYYY-MM-DD)
   * @param end - End date (YYYY-MM-DD)
   * @returns Array of time & sales data
   */
  static async getTimeSales(
    symbol: string,
    interval: '1min' | '5min' | '15min' = '5min',
    start?: string,
    end?: string
  ): Promise<TimeSalesData[]> {
    try {
      logger.info(`Fetching time & sales for: ${symbol}, interval: ${interval}`);

      const params: any = { symbol, interval };
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await axios.get<TimeSalesResponse>(
        `${config.TRADIER_API_URL}/markets/timesales`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${config.TRADIER_ACCESS_TOKEN}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.data.series) {
        logger.warn(`No time & sales data for symbol: ${symbol}`);
        return [];
      }

      const seriesData = response.data.series.data;
      const timesales = Array.isArray(seriesData) ? seriesData : [seriesData];

      logger.info(`Successfully fetched ${timesales.length} time & sales records`);
      
      return timesales;
    } catch (error: any) {
      logger.error('Tradier getTimeSales error', { 
        error: error.message,
        symbol,
        interval,
      });
      
      if (error.response?.status === 401) {
        throw ApiError.unauthorized('Invalid Tradier API token');
      }
      
      throw ApiError.internal('Failed to fetch time & sales data');
    }
  }

  /**
   * Search for symbols by company name or symbol
   * @param query - Search query (e.g., 'Apple' or 'AAPL')
   * @param indexes - Include index symbols
   * @returns Array of securities
   */
  static async searchSymbols(
    query: string,
    indexes: boolean = false
  ): Promise<Security[]> {
    try {
      logger.info(`Searching symbols for: ${query}`);

      const response = await axios.get<SearchResponse>(
        `${config.TRADIER_API_URL}/markets/search`,
        {
          params: { q: query, indexes },
          headers: {
            'Authorization': `Bearer ${config.TRADIER_ACCESS_TOKEN}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.data.securities) {
        logger.warn(`No securities found for query: ${query}`);
        return [];
      }

      const securitiesData = response.data.securities.security;
      const securities = Array.isArray(securitiesData) ? securitiesData : [securitiesData];

      logger.info(`Successfully found ${securities.length} securities`);
      
      return securities;
    } catch (error: any) {
      logger.error('Tradier searchSymbols error', { 
        error: error.message,
        query,
      });
      
      if (error.response?.status === 401) {
        throw ApiError.unauthorized('Invalid Tradier API token');
      }
      
      throw ApiError.internal('Failed to search symbols');
    }
  }
}