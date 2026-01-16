// src/db/schema/referral.schema.ts
import { pgTable, uuid, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';

// Referral Tracking Table
export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Referrer (who shared the code)
  referrerId: uuid('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Referee (who used the code)
  refereeId: uuid('referee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Referral code used
  codeUsed: varchar('code_used', { length: 20 }).notNull(),
  
  // Track if rewards were given
  rewardGiven: boolean('reward_given').default(false).notNull(),
  
  // Status: pending (signed up but not verified), completed (verified), failed
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
  }),
}));

// TypeScript types
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;