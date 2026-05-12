import { pgTable, uuid, varchar, timestamp, text, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';

// ============================================
// ENUMS
// ============================================
// Tradier environment: sandbox (testing) or production
export const tradierEnvironmentEnum = pgEnum('tradier_environment', ['sandbox', 'production']);

// ============================================
// TRADIER ACCOUNTS TABLE
// Stores each user's connected Tradier account
// One user can only have one connected account
// ============================================
export const tradierAccounts = pgTable('tradier_accounts', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to our user
    userId: uuid('user_id')
        .notNull()
        .unique() // One Tradier account per user
        .references(() => users.id, { onDelete: 'cascade' }),

    // Tradier account details
    accountNumber: varchar('account_number', { length: 50 }).notNull(),
    accountName: varchar('account_name', { length: 255 }),
    accountType: varchar('account_type', { length: 50 }), // 'margin', 'cash', 'pdt'
    accountClassification: varchar('account_classification', { length: 50 }), // 'individual', 'entity'

    // OAuth tokens
    // Encrypted before storing in DB
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenScope: varchar('token_scope', { length: 255 }), // e.g. 'read write trade'
    tokenExpiresAt: timestamp('token_expires_at'), // Access tokens expire every 24h

    // Environment: sandbox for testing, production for real trades
    environment: tradierEnvironmentEnum('environment').default('sandbox').notNull(),

    // Connection status
    isActive: boolean('is_active').default(true).notNull(),

    // Timestamps
    connectedAt: timestamp('connected_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================
export const tradierAccountsRelations = relations(tradierAccounts, ({ one }) => ({
    user: one(users, {
        fields: [tradierAccounts.userId],
        references: [users.id],
    }),
}));

// ============================================
// TYPESCRIPT TYPES
// ============================================
export type TradierAccount = typeof tradierAccounts.$inferSelect;
export type NewTradierAccount = typeof tradierAccounts.$inferInsert;