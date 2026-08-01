import { pgTable, uuid, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../user.schema';
import { educationLevelQuizzes } from './education-level-quiz.schema';

// ============================================
// USER LEVEL QUIZ ATTEMPTS TABLE
// Records every level final quiz attempt per user
// Unlimited retakes allowed
// First passing attempt → XP awarded + next level unlocked
// ============================================

export const userLevelQuizAttempts = pgTable('user_level_quiz_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to user
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Link to level quiz
    quizId: uuid('quiz_id')
        .notNull()
        .references(() => educationLevelQuizzes.id, { onDelete: 'cascade' }),

    // Score as percentage (0-100)
    score: integer('score').notNull(),

    // Number of correct answers
    correctCount: integer('correct_count').notNull(),

    // Total number of questions in the quiz
    totalCount: integer('total_count').notNull(),

    // Whether this attempt scored 80%+ (pass threshold)
    passed: boolean('passed').notNull().default(false),

    // Whether XP was awarded for this quiz
    // Only true on the first passing attempt ever
    xpAwarded: boolean('xp_awarded').notNull().default(false),

    // Whether this attempt triggered a level unlock
    // Only true on the first passing attempt ever
    levelUnlocked: boolean('level_unlocked').notNull().default(false),

    // User submitted answers stored for audit purposes
    submittedAnswers: jsonb('submitted_answers'),

    // Timestamp only — no updatedAt (attempts are immutable)
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userLevelQuizAttemptsRelations = relations(userLevelQuizAttempts, ({ one }) => ({
    user: one(users, {
        fields: [userLevelQuizAttempts.userId],
        references: [users.id],
    }),
    quiz: one(educationLevelQuizzes, {
        fields: [userLevelQuizAttempts.quizId],
        references: [educationLevelQuizzes.id],
    }),
}));

// TypeScript types
export type UserLevelQuizAttempt = typeof userLevelQuizAttempts.$inferSelect;
export type NewUserLevelQuizAttempt = typeof userLevelQuizAttempts.$inferInsert;