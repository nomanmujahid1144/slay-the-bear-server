import { pgTable, uuid, varchar, timestamp, boolean, text, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';

// Platform enum: ios or android
export const iapPlatformEnum = pgEnum('iap_platform', ['ios', 'android']);

// Environment enum: sandbox (testing) or production
export const iapEnvironmentEnum = pgEnum('iap_environment', ['sandbox', 'production']);

// IAP Transaction Status enum
export const iapStatusEnum = pgEnum('iap_status', ['active', 'expired', 'cancelled', 'grace_period']);

// IAP Transactions Table
// Stores every purchase/renewal — equivalent to subscription_entries for Stripe
export const iapTransactions = pgTable('iap_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Link to user
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Transaction identifiers
  // transaction_id: unique per purchase/renewal
  // original_transaction_id: same across all renewals — links entire subscription lifecycle
  transactionId: varchar('transaction_id', { length: 255 }).notNull().unique(),
  originalTransactionId: varchar('original_transaction_id', { length: 255 }).notNull(),

  // General purpose product ID — not hardcoded to any plan
  // mobile sends whatever Apple/Google returns e.g. "com.slaythebear.monthly" or "com.slaythebear.yearly"
  productId: varchar('product_id', { length: 255 }).notNull(),

  // Platform: ios or android
  platform: iapPlatformEnum('platform').notNull(),

  // Environment: sandbox (testing) or production
  environment: iapEnvironmentEnum('environment').notNull(),

  // Subscription dates
  purchaseDate: timestamp('purchase_date').notNull(),
  expiryDate: timestamp('expiry_date').notNull(),

  // Status of this transaction
  status: iapStatusEnum('status').default('active').notNull(),

  // Whether subscription will auto-renew
  autoRenewing: boolean('auto_renewing').default(true).notNull(),

  // Raw receipt stored for dispute resolution
  receipt: text('receipt'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const iapTransactionsRelations = relations(iapTransactions, ({ one }) => ({
  user: one(users, {
    fields: [iapTransactions.userId],
    references: [users.id],
  }),
}));

// TypeScript types
export type IAPTransaction = typeof iapTransactions.$inferSelect;
export type NewIAPTransaction = typeof iapTransactions.$inferInsert;