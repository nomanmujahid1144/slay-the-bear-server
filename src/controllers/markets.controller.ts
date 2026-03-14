// src/controllers/markets.controller.ts

import { Request, Response, NextFunction } from 'express';
import { TradierService } from '../services/tradier.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';

/**
 * Markets Controller
 * Handles HTTP requests for market data endpoints
 */
export class MarketsController {
  
  /**
   * GET /api/markets/quotes
   * Get real-time quotes for symbols
   */
  static async getQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbols } = req.query;
      
      // Split comma-separated symbols
      const symbolsArray = (symbols as string).split(',').map(s => s.trim());

      logger.info(`Get quotes request for: ${symbolsArray.join(', ')}`);

      const quotes = await TradierService.getQuotes(symbolsArray);

      return ApiResponseUtil.success(
        res,
        quotes,
        'Quotes retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/history
   * Get historical price data for a symbol
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol, interval, start, end } = req.query;

      logger.info(`Get history request for: ${symbol}`);

      const history = await TradierService.getHistory(
        symbol as string,
        interval as 'daily' | 'weekly' | 'monthly',
        start as string,
        end as string
      );

      return ApiResponseUtil.success(
        res,
        history,
        'Historical data retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/timesales
   * Get intraday time & sales data for a symbol
   */
  static async getTimeSales(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol, interval, start, end } = req.query;

      logger.info(`Get time & sales request for: ${symbol}`);

      const timesales = await TradierService.getTimeSales(
        symbol as string,
        interval as '1min' | '5min' | '15min',
        start as string,
        end as string
      );

      return ApiResponseUtil.success(
        res,
        timesales,
        'Time & sales data retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/search
   * Search for symbols by company name or symbol
   */
  static async searchSymbols(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, indexes } = req.query;

      logger.info(`Search symbols request for: ${q}`);

      const securities = await TradierService.searchSymbols(
        q as string,
        indexes === 'true'
      );

      return ApiResponseUtil.success(
        res,
        securities,
        'Securities retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}