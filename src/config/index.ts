import dotenv from 'dotenv';
import path from 'path';

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

    // Add Stripe config
    STRIPE_SECRET_KEY: string,
    STRIPE_WEBHOOK_SECRET: string,
    // Add Stripe Premium Keys
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: string,
    STRIPE_PREMIUM_YEARLY_PRICE_ID: string,
    // Add Stripe Basic Keys
    STRIPE_BASIC_MONTHLY_PRICE_ID: string,
    STRIPE_BASIC_YEARLY_PRICE_ID: string,

    // Alpha Vantage
    ALPHA_VANTAGE_API_KEY: string,

    // IAP (In-App Purchase)
    APPLE_SHARED_SECRET: string;
    APPLE_SANDBOX_URL: string;
    APPLE_PRODUCTION_URL: string;
    GOOGLE_SERVICE_ACCOUNT_KEY: string;

    // Tradier
    TRADIER_ACCESS_TOKEN: string;
    TRADIER_ACCOUNT_NUMBER: string;
    TRADIER_API_URL: string;

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


    // Add Stripe config
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    // Add Stripe Premium Keys
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    // Add Stripe Basic Keys
    STRIPE_BASIC_MONTHLY_PRICE_ID: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
    STRIPE_BASIC_YEARLY_PRICE_ID: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || '',


    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || '',

    // IAP (In-App Purchase)
    APPLE_SHARED_SECRET: process.env.APPLE_SHARED_SECRET || '',
    APPLE_SANDBOX_URL: process.env.APPLE_SANDBOX_URL || 'https://sandbox.itunes.apple.com/verifyReceipt',
    APPLE_PRODUCTION_URL: process.env.APPLE_PRODUCTION_URL || 'https://buy.itunes.apple.com/verifyReceipt',
    GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',

    // Tradier
    TRADIER_ACCESS_TOKEN: process.env.TRADIER_ACCESS_TOKEN || '',
    TRADIER_ACCOUNT_NUMBER: process.env.TRADIER_ACCOUNT_NUMBER || '',
    TRADIER_API_URL: process.env.TRADIER_API_URL || 'https://sandbox.tradier.com/v1',

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
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

export default config;