// src/services/news.service.ts

import axios from 'axios';
import config from '../config';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import type { AlphaVantageNewsResponse, NewsResponse } from '../types';

/**
 * News Service
 * Handles all Alpha Vantage News API calls
 */
export class NewsService {
  
  private static readonly BASE_URL = 'https://www.alphavantage.co/query';
  
  // Axios instance with timeout
  private static readonly axiosInstance = axios.create({
    timeout: 15000, // 15 seconds timeout
  });

  /**
   * Get latest general news
   * @param limit - Number of news items (default: 50)
   * @param sort - Sort order (LATEST, EARLIEST, RELEVANCE)
   * @returns News feed
   */
  static async getLatestNews(
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<NewsResponse> {
    try {
      logger.info(`Fetching latest news, limit: ${limit}, sort: ${sort}`);
        console.log(config.ALPHA_VANTAGE_API_KEY, 'config.ALPHA_VANTAGE_API_KEY')

      const response = await this.axiosInstance.get<AlphaVantageNewsResponse>(
        this.BASE_URL,
        {
          params: {
            function: 'NEWS_SENTIMENT',
            sort,
            limit,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
        }
      );

      console.log(response, 'response')

      logger.info(`Successfully fetched ${response.data.feed?.length || 0} news items`);
      
      return {
        feed: response.data.feed || [],
        items: response.data.items || '0',
      };
    } catch (error: any) {
      logger.error('Alpha Vantage getLatestNews error', { 
        error: error.message,
        isTimeout: error.code === 'ECONNABORTED',
      });
      
      if (error.code === 'ECONNABORTED') {
        throw ApiError.internal('Request timeout - Alpha Vantage API is slow');
      }
      
      throw ApiError.internal('Failed to fetch latest news');
    }
  }

  /**
   * Get stock-specific news
   * @param tickers - Comma-separated stock tickers (e.g., "AAPL,TSLA")
   * @param limit - Number of news items
   * @param sort - Sort order
   * @returns News feed
   */
  static async getStocksNews(
    tickers: string = 'AAPL',
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<NewsResponse> {
    try {
      logger.info(`Fetching stocks news for: ${tickers}`);

      const response = await this.axiosInstance.get<AlphaVantageNewsResponse>(
        this.BASE_URL,
        {
          params: {
            function: 'NEWS_SENTIMENT',
            tickers,
            sort,
            limit,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
        }
      );

      logger.info(`Successfully fetched ${response.data.feed?.length || 0} stock news items`);
      
      return {
        feed: response.data.feed || [],
        items: response.data.items || '0',
      };
    } catch (error: any) {
      logger.error('Alpha Vantage getStocksNews error', { 
        error: error.message,
        tickers,
      });
      
      throw ApiError.internal('Failed to fetch stocks news');
    }
  }

  /**
   * Get cryptocurrency news
   * @param tickers - Comma-separated crypto tickers (e.g., "CRYPTO:BTC,CRYPTO:ETH")
   * @param limit - Number of news items
   * @param sort - Sort order
   * @returns News feed
   */
  static async getCryptoNews(
    tickers: string = 'CRYPTO:BTC,CRYPTO:ETH,CRYPTO:XRP',
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<NewsResponse> {
    try {
      logger.info(`Fetching crypto news for: ${tickers}`);

      const response = await this.axiosInstance.get<AlphaVantageNewsResponse>(
        this.BASE_URL,
        {
          params: {
            function: 'NEWS_SENTIMENT',
            tickers,
            sort,
            limit,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
        }
      );

      logger.info(`Successfully fetched ${response.data.feed?.length || 0} crypto news items`);
      
      return {
        feed: response.data.feed || [],
        items: response.data.items || '0',
      };
    } catch (error: any) {
      logger.error('Alpha Vantage getCryptoNews error', { 
        error: error.message,
        tickers,
      });
      
      throw ApiError.internal('Failed to fetch crypto news');
    }
  }

  /**
   * Get forex news
   * @param tickers - Comma-separated forex tickers (e.g., "FOREX:USD,FOREX:EUR")
   * @param limit - Number of news items
   * @param sort - Sort order
   * @returns News feed
   */
  static async getForexNews(
    tickers: string = 'FOREX:USD,FOREX:EUR,FOREX:JPY',
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<NewsResponse> {
    try {
      logger.info(`Fetching forex news for: ${tickers}`);

      const response = await this.axiosInstance.get<AlphaVantageNewsResponse>(
        this.BASE_URL,
        {
          params: {
            function: 'NEWS_SENTIMENT',
            tickers,
            sort,
            limit,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
        }
      );

      logger.info(`Successfully fetched ${response.data.feed?.length || 0} forex news items`);
      
      return {
        feed: response.data.feed || [],
        items: response.data.items || '0',
      };
    } catch (error: any) {
      logger.error('Alpha Vantage getForexNews error', { 
        error: error.message,
        tickers,
      });
      
      throw ApiError.internal('Failed to fetch forex news');
    }
  }

  /**
   * Get ETF news
   * @param topics - Comma-separated topics (e.g., "finance,technology")
   * @param limit - Number of news items
   * @param sort - Sort order
   * @returns News feed
   */
  static async getETFsNews(
    topics: string = 'finance',
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<NewsResponse> {
    try {
      logger.info(`Fetching ETFs news for topics: ${topics}`);

      const response = await this.axiosInstance.get<AlphaVantageNewsResponse>(
        this.BASE_URL,
        {
          params: {
            function: 'NEWS_SENTIMENT',
            topics,
            sort,
            limit,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
        }
      );

      logger.info(`Successfully fetched ${response.data.feed?.length || 0} ETF news items`);
      
      return {
        feed: response.data.feed || [],
        items: response.data.items || '0',
      };
    } catch (error: any) {
      logger.error('Alpha Vantage getETFsNews error', { 
        error: error.message,
        topics,
      });
      
      throw ApiError.internal('Failed to fetch ETFs news');
    }
  }

  /**
   * Get mutual funds news
   * @param topics - Comma-separated topics (e.g., "finance")
   * @param limit - Number of news items
   * @param sort - Sort order
   * @returns News feed
   */
  static async getMutualFundsNews(
    topics: string = 'finance',
    limit: number = 50,
    sort: 'LATEST' | 'EARLIEST' | 'RELEVANCE' = 'LATEST'
  ): Promise<NewsResponse> {
    try {
      logger.info(`Fetching mutual funds news for topics: ${topics}`);

      const response = await this.axiosInstance.get<AlphaVantageNewsResponse>(
        this.BASE_URL,
        {
          params: {
            function: 'NEWS_SENTIMENT',
            topics,
            sort,
            limit,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
        }
      );

      logger.info(`Successfully fetched ${response.data.feed?.length || 0} mutual funds news items`);
      
      return {
        feed: response.data.feed || [],
        items: response.data.items || '0',
      };
    } catch (error: any) {
      logger.error('Alpha Vantage getMutualFundsNews error', { 
        error: error.message,
        topics,
      });
      
      throw ApiError.internal('Failed to fetch mutual funds news');
    }
  }
}