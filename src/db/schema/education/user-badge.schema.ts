import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../user.schema';

// ============================================
// USER BADGES TABLE
// Records badges earned by each user
// Badges unlock based on XP milestones,
// level completions, and streak targets
// ============================================

export const userBadges = pgTable('user_badges', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to user
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Badge identifier e.g. "first_lesson", "quiz_master", "7_day_streak"
    badgeSlug: varchar('badge_slug', { length: 100 }).notNull(),

    // Badge display name e.g. "First Step", "Quiz Master"
    badgeName: varchar('badge_name', { length: 200 }).notNull(),

    // Description of how the badge was earned
    description: text('description'),

    // When the badge was earned
    earnedAt: timestamp('earned_at').defaultNow().notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userBadgesRelations = relations(userBadges, ({ one }) => ({
    user: one(users, {
        fields: [userBadges.userId],
        references: [users.id],
    }),
}));

// TypeScript types
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;

// Badge definitions — checked in service after every XP award
// condition logic lives in the service layer not here
export const BADGE_DEFINITIONS = [
    { slug: 'first_lesson',          name: 'First Step',            description: 'Completed your first lesson' },
    { slug: 'quiz_master',           name: 'Quiz Master',           description: 'Passed 5 quizzes' },
    { slug: '7_day_streak',          name: '7-Day Streak',          description: 'Maintained a 7-day learning streak' },
    { slug: '30_day_streak',         name: '30-Day Streak',         description: 'Maintained a 30-day learning streak' },
    { slug: 'beginner_complete',     name: 'Beginner Graduate',     description: 'Completed the Beginner level' },
    { slug: 'intermediate_complete', name: 'Intermediate Graduate', description: 'Completed the Intermediate level' },
    { slug: 'xp_1000',              name: 'Rising Star',           description: 'Earned 1,000 XP' },
    { slug: 'xp_5000',              name: 'Knowledge Hunter',      description: 'Earned 5,000 XP' },
] as const;