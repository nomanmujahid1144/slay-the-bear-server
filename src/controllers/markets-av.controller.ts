// src/controllers/markets-av.controller.ts

import { Request, Response, NextFunction } from 'express';
import { MarketsAvService } from '../services/markets-av.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';

/**
 * Markets AV Controller
 * Handles HTTP requests for Crypto, Forex, and Mutual Fund endpoints
 * Companion to markets.controller.ts which handles Stocks and ETFs via Tradier
 */
export class MarketsAvController {

  // ── Crypto ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/markets/crypto/quote
   * Get real-time crypto quote
   */
  static async getCryptoQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol, market } = req.query;

      logger.info(`Get crypto quote request for: ${symbol}/${market || 'USD'}`);

      const quote = await MarketsAvService.getCryptoQuote(
        symbol as string,
        (market as string) || 'USD'
      );

      return ApiResponseUtil.success(
        res,
        quote,
        'Crypto quote retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/crypto/intraday
   * Get crypto intraday data (Premium)
   */
  static async getCryptoIntraday(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol, market, interval, outputsize } = req.query;

      logger.info(`Get crypto intraday request for: ${symbol}/${market || 'USD'}, interval: ${interval || '5min'}`);

      const data = await MarketsAvService.getCryptoIntraday(
        symbol as string,
        (market as string) || 'USD',
        (interval as '1min' | '5min' | '15min' | '30min' | '60min') || '5min',
        (outputsize as 'compact' | 'full') || 'compact'
      );

      return ApiResponseUtil.success(
        res,
        data,
        'Crypto intraday data retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/crypto/history
   * Get crypto historical data
   */
  static async getCryptoHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol, market, interval } = req.query;

      logger.info(`Get crypto history request for: ${symbol}/${market || 'USD'}`);

      const history = await MarketsAvService.getCryptoHistory(
        symbol as string,
        (market as string) || 'USD',
        (interval as 'daily' | 'weekly' | 'monthly') || 'daily'
      );

      return ApiResponseUtil.success(
        res,
        history,
        'Crypto history retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // ── Forex ───────────────────────────────────────────────────────────────────

  /**
   * GET /api/markets/forex/rate
   * Get real-time forex exchange rate
   */
  static async getForexRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { from_currency, to_currency } = req.query;

      logger.info(`Get forex rate request for: ${from_currency}/${to_currency || 'USD'}`);

      const rate = await MarketsAvService.getForexRate(
        from_currency as string,
        (to_currency as string) || 'USD'
      );

      return ApiResponseUtil.success(
        res,
        rate,
        'Forex rate retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/forex/intraday
   * Get forex intraday data (Premium)
   */
  static async getForexIntraday(req: Request, res: Response, next: NextFunction) {
    try {
      const { from_currency, to_currency, interval, outputsize } = req.query;

      logger.info(`Get forex intraday request for: ${from_currency}/${to_currency || 'USD'}, interval: ${interval || '5min'}`);

      const data = await MarketsAvService.getForexIntraday(
        from_currency as string,
        (to_currency as string) || 'USD',
        (interval as '1min' | '5min' | '15min' | '30min' | '60min') || '5min',
        (outputsize as 'compact' | 'full') || 'compact'
      );

      return ApiResponseUtil.success(
        res,
        data,
        'Forex intraday data retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/forex/history
   * Get forex historical data
   */
  static async getForexHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { from_currency, to_currency, interval } = req.query;

      logger.info(`Get forex history request for: ${from_currency}/${to_currency || 'USD'}`);

      const history = await MarketsAvService.getForexHistory(
        from_currency as string,
        (to_currency as string) || 'USD',
        (interval as 'daily' | 'weekly' | 'monthly') || 'daily'
      );

      return ApiResponseUtil.success(
        res,
        history,
        'Forex history retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // ── Mutual Funds ─────────────────────────────────────────────────────────────

  /**
   * GET /api/markets/mutual-fund/quote
   * Get mutual fund quote
   */
  static async getMutualFundQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol } = req.query;

      logger.info(`Get mutual fund quote request for: ${symbol}`);

      const quote = await MarketsAvService.getMutualFundQuote(symbol as string);

      return ApiResponseUtil.success(
        res,
        quote,
        'Mutual fund quote retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/markets/mutual-fund/history
   * Get mutual fund historical data
   */
  static async getMutualFundHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { symbol, interval } = req.query;

      logger.info(`Get mutual fund history request for: ${symbol}`);

      const history = await MarketsAvService.getMutualFundHistory(
        symbol as string,
        (interval as 'daily' | 'weekly' | 'monthly') || 'daily'
      );

      return ApiResponseUtil.success(
        res,
        history,
        'Mutual fund history retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // ── Top Gainers / Losers / Most Active ───────────────────────────────────────

  /**
   * GET /api/markets/top-gainers-losers
   * Get top gainers, losers, and most actively traded US stocks
   */
  static async getTopGainersLosers(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Get top gainers/losers request');

      const data = await MarketsAvService.getTopGainersLosers();

      return ApiResponseUtil.success(
        res,
        data,
        'Top gainers/losers retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }

  // ── Market Status ─────────────────────────────────────────────────────────────

  /**
   * GET /api/markets/market-status
   * Get current open/closed status of major global markets
   */
  static async getMarketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Get market status request');

      const data = await MarketsAvService.getMarketStatus();

      return ApiResponseUtil.success(
        res,
        data,
        'Market status retrieved successfully',
        200
      );
    } catch (error) {
      next(error);
    }
  }
}