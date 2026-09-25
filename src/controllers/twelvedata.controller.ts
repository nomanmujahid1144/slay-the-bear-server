// src/controllers/twelvedata.controller.ts

import { Request, Response, NextFunction } from 'express';
import twelveDataService from '../services/twelvedata.service';
import { twelveDataWebSocketService } from '../services/twelvedata-ws.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import { TwelveDataMarket } from '../types/markets/twelvedata/twelvedata-response.types';

export class TwelveDataController {

    /**
     * GET /api/markets/twelvedata/watchlist?market=stocks
     * Default Layer-1 watchlist — any market, or all 5 if omitted
     */
    static async getWatchlist(req: Request, res: Response, next: NextFunction) {
        try {
            const market = req.query.market as TwelveDataMarket | undefined;

            logger.info(`Twelve Data get watchlist${market ? `: ${market}` : ' (all markets)'}`);

            const data = await twelveDataService.getDefaultWatchlist(market);

            return ApiResponseUtil.success(
                res,
                { data, count: data.length },
                'Watchlist fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/twelvedata/quote?symbol=AAPL
     * Single quote — any symbol, any of the 5 markets
     */
    static async getQuote(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = req.query.symbol as string;

            logger.info(`Twelve Data get quote: ${symbol}`);

            const { data, source } = await twelveDataService.getQuote(symbol);

            return ApiResponseUtil.success(
                res,
                { data, source },
                'Quote fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/twelvedata/quotes?symbols=AAPL,MSFT,BTC/USD
     * Batch quotes — mix symbols from any market in one call
     */
    static async getBatchQuotes(req: Request, res: Response, next: NextFunction) {
        try {
            const symbols = (req.query.symbols as string).split(',').map((s) => s.trim()).filter(Boolean);

            logger.info(`Twelve Data get batch quotes: ${symbols.join(', ')}`);

            const { data } = await twelveDataService.getBatchQuotes(symbols);

            return ApiResponseUtil.success(
                res,
                { data, count: data.length },
                'Batch quotes fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/twelvedata/logo?symbol=AAPL
     * Symbol logo — one icon for stocks/ETFs/mutual funds, two (base/quote) for forex/crypto pairs
     */
    static async getLogo(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = req.query.symbol as string;

            logger.info(`Twelve Data get logo: ${symbol}`);

            const data = await twelveDataService.getLogo(symbol);

            return ApiResponseUtil.success(
                res,
                { data },
                'Logo fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/twelvedata/search?q=Apple&market=stocks
     * Search across all 5 markets at once, or narrow to one with `market`
     */
    static async searchSymbols(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query.q as string;
            const market = req.query.market as TwelveDataMarket | undefined;
            const outputsize = req.query.outputsize ? Number(req.query.outputsize) : undefined;

            logger.info(`Twelve Data symbol search: "${query}"${market ? ` (${market})` : ''}`);

            const data = await twelveDataService.searchSymbols(query, market, outputsize);

            return ApiResponseUtil.success(
                res,
                { data, count: data.length },
                'Symbol search completed successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/twelvedata/history?symbol=AAPL&interval=1day&outputsize=30
     * Historical OHLCV series for charts
     */
    static async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = req.query.symbol as string;
            const interval = (req.query.interval as string) || '1day';
            const outputsize = req.query.outputsize ? Number(req.query.outputsize) : 30;

            logger.info(`Twelve Data get history: ${symbol} (${interval})`);

            const data = await twelveDataService.getHistory(symbol, interval, outputsize);

            return ApiResponseUtil.success(
                res,
                { data },
                'History fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/markets/twelvedata/status
     * Quick visibility into the live WebSocket engine — connected client count
     */
    static async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const clientCount = twelveDataWebSocketService.getClientCount();

            return ApiResponseUtil.success(
                res,
                { data: { connectedClients: clientCount } },
                'Twelve Data WebSocket status fetched successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }
}

export default TwelveDataController;