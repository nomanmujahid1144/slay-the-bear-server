// src/routes/news.routes.ts

import { Router } from 'express';
import { NewsController } from '../controllers/news.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  getLatestNewsSchema,
  getStocksNewsSchema,
  getCryptoNewsSchema,
  getForexNewsSchema,
  getETFsNewsSchema,
  getMutualFundsNewsSchema,
} from '../validators/news.validator';

const router = Router();

/**
 * @route   GET /api/news/latest
 * @desc    Get latest general news
 * @access  Public
 * @example /api/news/latest?limit=50&sort=LATEST
 */
router.get(
  '/latest',
  validate(getLatestNewsSchema),
  NewsController.getLatestNews
);

/**
 * @route   GET /api/news/stocks
 * @desc    Get stock-specific news
 * @access  Public
 * @example /api/news/stocks?tickers=AAPL,TSLA&limit=50
 */
router.get(
  '/stocks',
  validate(getStocksNewsSchema),
  NewsController.getStocksNews
);

/**
 * @route   GET /api/news/crypto
 * @desc    Get cryptocurrency news
 * @access  Public
 * @example /api/news/crypto?tickers=CRYPTO:BTC,CRYPTO:ETH&limit=50
 */
router.get(
  '/crypto',
  validate(getCryptoNewsSchema),
  NewsController.getCryptoNews
);

/**
 * @route   GET /api/news/forex
 * @desc    Get forex news
 * @access  Public
 * @example /api/news/forex?tickers=FOREX:USD,FOREX:EUR&limit=50
 */
router.get(
  '/forex',
  validate(getForexNewsSchema),
  NewsController.getForexNews
);

/**
 * @route   GET /api/news/etfs
 * @desc    Get ETF news
 * @access  Public
 * @example /api/news/etfs?topics=finance&limit=50
 */
router.get(
  '/etfs',
  validate(getETFsNewsSchema),
  NewsController.getETFsNews
);

/**
 * @route   GET /api/news/mutual-funds
 * @desc    Get mutual funds news
 * @access  Public
 * @example /api/news/mutual-funds?topics=finance&limit=50
 */
router.get(
  '/mutual-funds',
  validate(getMutualFundsNewsSchema),
  NewsController.getMutualFundsNews
);

export default router;