import { pgTable, uuid, integer, timestamp, text, jsonb, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../user.schema';

// ============================================
// USER EDUCATION PROGRESS TABLE
// One row per user — single source of truth
// for all user learning progress
// XP, streak, current level, completed lessons/modules
// ============================================

export const userEducationProgress = pgTable('user_education_progress', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to user — one progress record per user
    userId: uuid('user_id')
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Current level slug e.g. "beginner", "intermediate"
    // Updated when user passes a level quiz
    currentLevelSlug: text('current_level_slug').notNull().default('beginner'),

    // Total XP earned across all activities
    // Never goes down — always increases
    totalXp: integer('total_xp').notNull().default(0),

    // Current learning streak in days
    // Resets to 0 if user misses a calendar day
    streak: integer('streak').notNull().default(0),

    // Last calendar date the user completed a lesson
    // Used to calculate and maintain the streak
    lastActiveDate: date('last_active_date'),

    // Array of completed lesson slugs
    // e.g. ["what-is-investing", "stocks-explained"]
    completedLessons: jsonb('completed_lessons').notNull().default([]),

    // Array of completed module slugs
    // e.g. ["investing-basics", "stocks-101"]
    completedModules: jsonb('completed_modules').notNull().default([]),

    // Array of unlocked level slugs
    // Starts with ["beginner"] — grows as user passes level quizzes
    unlockedLevels: jsonb('unlocked_levels').notNull().default(['beginner']),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const userEducationProgressRelations = relations(userEducationProgress, ({ one }) => ({
    user: one(users, {
        fields: [userEducationProgress.userId],
        references: [users.id],
    }),
}));

// TypeScript types
export type UserEducationProgress = typeof userEducationProgress.$inferSelect;
export type NewUserEducationProgress = typeof userEducationProgress.$inferInsert;