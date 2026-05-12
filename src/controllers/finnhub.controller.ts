import { Request, Response, NextFunction } from 'express';
import finnhubService from '../services/finnhub.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';

export class FinnhubController {

    // ============================================
    // CRYPTO ENDPOINTS
    // ============================================

    /**
     * GET /api/markets/finnhub/crypto/quote?symbol=BINANCE:BTCUSDT
     * Get a single crypto quote
     */
    static async getCryptoQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = req.query.symbol as string;

            logger.info(`Finnhub get crypto quote: ${symbol}`);

            const { data, cached } = await finnhubService.getCryptoQuote(symbol);

            return ApiResponseUtil.success(
                res,
                { data, cached },
                'Crypto quote fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/finnhub/crypto/quotes
     * Get ALL supported crypto quotes (cached — safe for 100+ users)
     */
    static async getCryptoQuotes(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info('Finnhub get all crypto quotes');

            const { data, cached } = await finnhubService.getCryptoQuotes();

            return ApiResponseUtil.success(
                res,
                { data, count: data.length, cached },
                'Crypto quotes fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/finnhub/crypto/symbols?exchange=BINANCE
     * Get list of supported crypto symbols for an exchange
     */
    static async getCryptoSymbols(req: Request, res: Response, next: NextFunction) {
        try {
            const exchange = (req.query.exchange as string) || 'BINANCE';

            logger.info(`Finnhub get crypto symbols for exchange: ${exchange}`);

            const { data, cached } = await finnhubService.getCryptoSymbols(exchange);

            return ApiResponseUtil.success(
                res,
                { data, count: data.length, cached },
                'Crypto symbols fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // FOREX ENDPOINTS
    // ============================================

    /**
     * GET /api/markets/finnhub/forex/quote?symbol=OANDA:EUR_USD
     * Get a single forex quote
     */
    static async getForexQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = req.query.symbol as string;

            logger.info(`Finnhub get forex quote: ${symbol}`);

            const { data, cached } = await finnhubService.getForexQuote(symbol);

            return ApiResponseUtil.success(
                res,
                { data, cached },
                'Forex quote fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/finnhub/forex/quotes
     * Get ALL supported forex quotes (cached — safe for 100+ users)
     */
    static async getForexQuotes(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info('Finnhub get all forex quotes');

            const { data, cached } = await finnhubService.getForexQuotes();

            return ApiResponseUtil.success(
                res,
                { data, count: data.length, cached },
                'Forex quotes fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/finnhub/forex/symbols?exchange=oanda
     * Get list of supported forex symbols for an exchange
     */
    static async getForexSymbols(req: Request, res: Response, next: NextFunction) {
        try {
            const exchange = (req.query.exchange as string) || 'oanda';

            logger.info(`Finnhub get forex symbols for exchange: ${exchange}`);

            const { data, cached } = await finnhubService.getForexSymbols(exchange);

            return ApiResponseUtil.success(
                res,
                { data, count: data.length, cached },
                'Forex symbols fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }
}

export default FinnhubController;