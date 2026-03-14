// src/types/news/news-request.types.ts

/**
 * News API Request Types
 * Input types for API endpoints
 */

// GET /api/news/latest
export interface GetLatestNewsRequest {
  limit?: number;
  sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
}

// GET /api/news/stocks
export interface GetStocksNewsRequest {
  tickers?: string; // e.g., "AAPL,TSLA,NVDA"
  limit?: number;
  sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
}

// GET /api/news/crypto
export interface GetCryptoNewsRequest {
  tickers?: string; // e.g., "CRYPTO:BTC,CRYPTO:ETH"
  limit?: number;
  sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
}

// GET /api/news/forex
export interface GetForexNewsRequest {
  tickers?: string; // e.g., "FOREX:USD,FOREX:EUR"
  limit?: number;
  sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
}

// GET /api/news/etfs
export interface GetETFsNewsRequest {
  topics?: string; // e.g., "finance,technology"
  limit?: number;
  sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
}

// GET /api/news/mutual-funds
export interface GetMutualFundsNewsRequest {
  topics?: string; // e.g., "finance"
  limit?: number;
  sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
}