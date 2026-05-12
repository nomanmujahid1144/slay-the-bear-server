import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    // Server
    NODE_ENV: string;
    PORT: number;

    // Database
    DATABASE_URL: string;

    // Supabase
    SUPABASE_URL: string,
    SUPABASE_SERVICE_KEY: string,

    // JWT
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;

    // Email (Resend)
    RESEND_API_KEY: string;
    RESEND_SENDER_EMAIL: string;
    RESEND_SENDER_NAME: string;

    // Stripe
    STRIPE_SECRET_KEY: string,
    STRIPE_WEBHOOK_SECRET: string,
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: string,
    STRIPE_PREMIUM_YEARLY_PRICE_ID: string,
    STRIPE_BASIC_MONTHLY_PRICE_ID: string,
    STRIPE_BASIC_YEARLY_PRICE_ID: string,

    // Alpha Vantage
    ALPHA_VANTAGE_API_KEY: string,

    // IAP (In-App Purchase)
    APPLE_SHARED_SECRET: string;
    APPLE_SANDBOX_URL: string;
    APPLE_PRODUCTION_URL: string;
    GOOGLE_SERVICE_ACCOUNT_KEY: string;

    // Tradier — Market Data
    TRADIER_ACCESS_TOKEN: string;
    TRADIER_ACCOUNT_NUMBER: string;
    TRADIER_API_URL: string;

    // Tradier — WebSocket Streaming
    TRADIER_STREAMING_TOKEN: string;
    TRADIER_STREAMING_ACCOUNT: string;

    // Tradier — Trading (OAuth)
    TRADIER_CLIENT_ID: string;
    TRADIER_CLIENT_SECRET: string;
    TRADIER_CALLBACK_URL: string;
    TRADIER_BASIC_AUTH: string;
    TRADIER_SANDBOX_URL: string;

    // Finnhub
    FINNHUB_API_KEY: string;

    // Redis (Upstash)
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;

    // Frontend
    FRONTEND_URL: string;

    // Security
    BCRYPT_SALT_ROUNDS: number;
}

const config: Config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),

    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',

    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '1h',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    RESEND_SENDER_EMAIL: process.env.RESEND_SENDER_EMAIL || '',
    RESEND_SENDER_NAME: process.env.RESEND_SENDER_NAME || 'Slay The Bear',

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    STRIPE_BASIC_MONTHLY_PRICE_ID: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
    STRIPE_BASIC_YEARLY_PRICE_ID: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || '',

    // Alpha Vantage
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '',

    // IAP (In-App Purchase)
    APPLE_SHARED_SECRET: process.env.APPLE_SHARED_SECRET || '',
    APPLE_SANDBOX_URL: process.env.APPLE_SANDBOX_URL || 'https://sandbox.itunes.apple.com/verifyReceipt',
    APPLE_PRODUCTION_URL: process.env.APPLE_PRODUCTION_URL || 'https://buy.itunes.apple.com/verifyReceipt',
    GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',

    // Tradier — Market Data
    TRADIER_ACCESS_TOKEN: process.env.TRADIER_ACCESS_TOKEN || '',
    TRADIER_ACCOUNT_NUMBER: process.env.TRADIER_ACCOUNT_NUMBER || '',
    TRADIER_API_URL: process.env.TRADIER_API_URL || 'https://api.tradier.com/v1',

    // Tradier — WebSocket Streaming
    TRADIER_STREAMING_TOKEN: process.env.TRADIER_STREAMING_TOKEN || process.env.TRADIER_ACCESS_TOKEN || '',
    TRADIER_STREAMING_ACCOUNT: process.env.TRADIER_STREAMING_ACCOUNT || process.env.TRADIER_ACCOUNT_NUMBER || '',

    // Tradier — Trading (OAuth)
    TRADIER_CLIENT_ID: process.env.TRADIER_CLIENT_ID || '',
    TRADIER_CLIENT_SECRET: process.env.TRADIER_CLIENT_SECRET || '',
    TRADIER_CALLBACK_URL: process.env.TRADIER_CALLBACK_URL || 'http://localhost:5000/api/trading/auth/callback',
    TRADIER_BASIC_AUTH: process.env.TRADIER_BASIC_AUTH || '',
    TRADIER_SANDBOX_URL: process.env.TRADIER_SANDBOX_URL || 'https://sandbox.tradier.com/v1',

    // Finnhub
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || '',

    // Redis (Upstash)
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Security
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
};

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'TRADIER_CLIENT_ID',
    'TRADIER_CLIENT_SECRET',
    'TRADIER_BASIC_AUTH',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

export default config;