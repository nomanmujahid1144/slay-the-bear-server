import { pgTable, uuid, varchar, timestamp, decimal, pgEnum, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';

// Subscription Period enum
export const subscriptionPeriodEnum = pgEnum('subscription_period', ['monthly', 'yearly']);

// Subscription Status enum
export const subscriptionStatusEnum = pgEnum('subscription_status', ['Subscribed', 'Renewal', 'Canceled']);

// Subscription Table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  plan: varchar('plan', { length: 50 }).notNull(),
  period: subscriptionPeriodEnum('period').notNull(),
  
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscription Entry Table (Invoice History)
export const subscriptionEntries = pgTable('subscription_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  
  invoiceId: varchar('invoice_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  status: subscriptionStatusEnum('status').default('Subscribed').notNull(),
  
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
  
  viewURL: text('view_url'),
  downloadURL: text('download_url'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  entries: many(subscriptionEntries),
}));

export const subscriptionEntriesRelations = relations(subscriptionEntries, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionEntries.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// TypeScript types
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionEntry = typeof subscriptionEntries.$inferSelect;
export type NewSubscriptionEntry = typeof subscriptionEntries.$inferInsert;