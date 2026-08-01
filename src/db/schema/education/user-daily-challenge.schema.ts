import { pgTable, uuid, integer, boolean, timestamp, date, text, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../user.schema';

// ============================================
// USER DAILY CHALLENGES TABLE
// Tracks daily challenge completions per user
// Resets every calendar day — tracked by challengeDate
// Rewards XP on completion
// ============================================

export const userDailyChallenges = pgTable('user_daily_challenges', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to user
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Calendar date of this challenge e.g. "2026-07-13"
    // Combined with userId — one challenge per user per day
    challengeDate: date('challenge_date').notNull(),

    // Challenge title e.g. "The Bear Market Survival Quiz"
    title: varchar('title', { length: 200 }).notNull(),

    // Challenge description shown to the user
    description: text('description'),

    // XP reward for completing the challenge
    xpReward: integer('xp_reward').notNull().default(150),

    // Whether the user has completed today's challenge
    completed: boolean('completed').notNull().default(false),

    // When the challenge was completed — null if not done yet
    completedAt: timestamp('completed_at'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const userDailyChallengesRelations = relations(userDailyChallenges, ({ one }) => ({
    user: one(users, {
        fields: [userDailyChallenges.userId],
        references: [users.id],
    }),
}));

// TypeScript types
export type UserDailyChallenge = typeof userDailyChallenges.$inferSelect;
export type NewUserDailyChallenge = typeof userDailyChallenges.$inferInsert;