// src/types/news/news-response.types.ts

/**
 * News API Response Types
 * Output types from Alpha Vantage News API
 */

// Individual ticker sentiment
export interface TickerSentiment {
  ticker: string;
  relevance_score: string;
  ticker_sentiment_score: string;
  ticker_sentiment_label: string;
}

// Topic relevance
export interface Topic {
  topic: string;
  relevance_score: string;
}

// Individual news feed item
export interface NewsFeedItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image?: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: Topic[];
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment?: TickerSentiment[];
}

// Alpha Vantage News Response
export interface AlphaVantageNewsResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: NewsFeedItem[];
}

// Our API Response (simplified)
export interface NewsResponse {
  feed: NewsFeedItem[];
  items: string;
}