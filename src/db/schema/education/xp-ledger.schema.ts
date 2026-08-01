import { pgTable, uuid, integer, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../user.schema';

// ============================================
// XP LEDGER TABLE
// Immutable log of every XP transaction per user
// Append-only — never update or delete rows
// Used for auditing and recalculating total XP if needed
// ============================================

export const xpLedger = pgTable('xp_ledger', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to user
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // XP amount awarded — always positive
    amount: integer('amount').notNull(),

    // Why XP was awarded — use XP_REASONS constants below
    // e.g. "lesson_complete", "module_quiz_pass", "level_quiz_pass"
    reason: varchar('reason', { length: 100 }).notNull(),

    // Optional reference to the source e.g. lesson slug or quiz ID
    referenceId: text('reference_id'),

    // Optional human-readable description
    description: text('description'),

    // Timestamp only — no updatedAt because this ledger is immutable
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const xpLedgerRelations = relations(xpLedger, ({ one }) => ({
    user: one(users, {
        fields: [xpLedger.userId],
        references: [users.id],
    }),
}));

// TypeScript types
export type XpLedgerEntry = typeof xpLedger.$inferSelect;
export type NewXpLedgerEntry = typeof xpLedger.$inferInsert;

// XP reason constants — use these everywhere instead of raw strings
export const XP_REASONS = {
    LESSON_COMPLETE:  'lesson_complete',
    MODULE_QUIZ_PASS: 'module_quiz_pass',
    LEVEL_QUIZ_PASS:  'level_quiz_pass',
    DAILY_CHALLENGE:  'daily_challenge',
    STREAK_BONUS:     'streak_bonus',
} as const;

export type XpReason = typeof XP_REASONS[keyof typeof XP_REASONS];

// XP awarded for each action type
export const XP_REWARDS = {
    LESSON_COMPLETE:  50,
    MODULE_QUIZ_PASS: 50,
    LEVEL_QUIZ_PASS:  200,
    DAILY_CHALLENGE:  150,
} as const;

// Minimum XP needed to reach each level
export const XP_THRESHOLDS = {
    BEGINNER:     0,
    INTERMEDIATE: 1000,
    ADVANCED:     5000,
    EXPERT:       10000,
} as const;