// src/controllers/news.controller.ts

import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/news.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';

/**
 * News Controller
 * Handles HTTP requests for news endpoints
 */
export class NewsController {
  
  /**
   * GET /api/news/latest
   * Get latest general news
   */
  static async getLatestNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, sort } = req.query as {
        limit?: number;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
      };

      logger.info('Get latest news request');

      const news = await NewsService.getLatestNews(limit, sort);

      return ApiResponseUtil.success(
        res,
        news,
        'Latest news retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/news/stocks
   * Get stock-specific news
   */
  static async getStocksNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { tickers, limit, sort } = req.query as {
        tickers?: string;
        limit?: number;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
      };

      logger.info(`Get stocks news request for: ${tickers || 'default'}`);

      const news = await NewsService.getStocksNews(tickers, limit, sort);

      return ApiResponseUtil.success(
        res,
        news,
        'Stock news retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/news/crypto
   * Get cryptocurrency news
   */
  static async getCryptoNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { tickers, limit, sort } = req.query as {
        tickers?: string;
        limit?: number;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
      };

      logger.info(`Get crypto news request for: ${tickers || 'default'}`);

      const news = await NewsService.getCryptoNews(tickers, limit, sort);

      return ApiResponseUtil.success(
        res,
        news,
        'Crypto news retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/news/forex
   * Get forex news
   */
  static async getForexNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { tickers, limit, sort } = req.query as {
        tickers?: string;
        limit?: number;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
      };

      logger.info(`Get forex news request for: ${tickers || 'default'}`);

      const news = await NewsService.getForexNews(tickers, limit, sort);

      return ApiResponseUtil.success(
        res,
        news,
        'Forex news retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/news/etfs
   * Get ETF news
   */
  static async getETFsNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { topics, limit, sort } = req.query as {
        topics?: string;
        limit?: number;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
      };

      logger.info(`Get ETFs news request for topics: ${topics || 'default'}`);

      const news = await NewsService.getETFsNews(topics, limit, sort);

      return ApiResponseUtil.success(
        res,
        news,
        'ETF news retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/news/mutual-funds
   * Get mutual funds news
   */
  static async getMutualFundsNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { topics, limit, sort } = req.query as {
        topics?: string;
        limit?: number;
        sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
      };

      logger.info(`Get mutual funds news request for topics: ${topics || 'default'}`);

      const news = await NewsService.getMutualFundsNews(topics, limit, sort);

      return ApiResponseUtil.success(
        res,
        news,
        'Mutual funds news retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}