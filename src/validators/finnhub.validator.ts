import { z } from 'zod';

// Supported crypto exchanges
const cryptoExchanges = ['BINANCE', 'COINBASE', 'KRAKEN', 'GEMINI', 'BITFINEX', 'HUOBI', 'KUCOIN', 'OKEX'] as const;

// Supported forex exchanges
const forexExchanges = ['oanda', 'fxcm', 'forex.com', 'ic markets', 'fxpro'] as const;

// GET /api/markets/finnhub/crypto/quote?symbol=BINANCE:BTCUSDT
export const getCryptoQuoteSchema = z.object({
    query: z.object({
        symbol: z
            .string()
            .min(1, 'symbol cannot be empty')
            .regex(
                /^[A-Z0-9]+:[A-Z0-9]+$/,
                'symbol must be in format EXCHANGE:SYMBOL (e.g. BINANCE:BTCUSDT)'
            ),
    }),
});

// GET /api/markets/finnhub/crypto/quotes — no params needed
export const getCryptoQuotesSchema = z.object({
    query: z.object({}).optional(),
});

// GET /api/markets/finnhub/crypto/symbols?exchange=BINANCE
export const getCryptoSymbolsSchema = z.object({
    query: z.object({
        exchange: z
            .enum(cryptoExchanges, {
                message: `exchange must be one of: ${cryptoExchanges.join(', ')}`,
            })
            .default('BINANCE'),
    }),
});

// GET /api/markets/finnhub/forex/quote?symbol=OANDA:EUR_USD
export const getForexQuoteSchema = z.object({
    query: z.object({
        symbol: z
            .string()
            .min(1, 'symbol cannot be empty'),
    }),
});

// GET /api/markets/finnhub/forex/quotes — no params needed
export const getForexQuotesSchema = z.object({
    query: z.object({}).optional(),
});

// GET /api/markets/finnhub/forex/symbols?exchange=oanda
export const getForexSymbolsSchema = z.object({
    query: z.object({
        exchange: z
            .enum(forexExchanges, {
                message: `exchange must be one of: ${forexExchanges.join(', ')}`,
            })
            .default('oanda'),
    }),
});