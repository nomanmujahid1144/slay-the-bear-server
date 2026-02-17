import { pgTable, uuid, varchar, boolean, timestamp, text, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core';

// Create Plan enum in database
export const planEnum = pgEnum('plan', ['free', 'basic', 'premium']);

// Complete User Table Schema
export const users = pgTable('users', {
  // Primary fields
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  // location: varchar('location', { length: 255 }),
  location: jsonb('location'),
  picture: text('picture'), // URL to profile picture

  // Verification fields
  isVerified: boolean('is_verified').default(false).notNull(),
  verifyToken: text('verify_token'),
  verifyTokenExpiry: timestamp('verify_token_expiry'),

  // Password reset fields
  forgotPasswordToken: text('forgot_password_token'),
  forgotPasswordTokenExpiry: timestamp('forgot_password_token_expiry'),

  // Subscription fields
  plan: planEnum('plan').default('free').notNull(),
  customerId: varchar('customer_id', { length: 255 }), // Stripe customer ID

  // IAP (In-App Purchase) fields — Mobile subscriptions
  iapOriginalTransactionId: varchar('iap_original_transaction_id', { length: 255 }),
  iapPlatform: varchar('iap_platform', { length: 10 }), // 'ios' or 'android'

  // Referral System fields
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  referredBy: uuid('referred_by'),
  referralCount: integer('referral_count').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Type without password (for API responses)
export type UserWithoutPassword = Omit<User, 'password'>;