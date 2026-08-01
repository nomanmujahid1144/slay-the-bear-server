import { pgTable, uuid, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../user.schema';
import { educationModuleQuizzes } from './education-module-quiz.schema';

// ============================================
// USER MODULE QUIZ ATTEMPTS TABLE
// Records every module quiz attempt per user
// Unlimited retakes allowed
// XP only awarded once — tracked via xpAwarded flag
// ============================================

export const userModuleQuizAttempts = pgTable('user_module_quiz_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to user
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    // Link to module quiz
    quizId: uuid('quiz_id')
        .notNull()
        .references(() => educationModuleQuizzes.id, { onDelete: 'cascade' }),

    // Score as percentage (0-100)
    score: integer('score').notNull(),

    // Number of correct answers
    correctCount: integer('correct_count').notNull(),

    // Total number of questions in the quiz
    totalCount: integer('total_count').notNull(),

    // Whether this attempt met the pass threshold
    passed: boolean('passed').notNull().default(false),

    // Whether XP was awarded for this quiz
    // Only true on the first passing attempt ever
    xpAwarded: boolean('xp_awarded').notNull().default(false),

    // User submitted answers stored for audit purposes
    submittedAnswers: jsonb('submitted_answers'),

    // Timestamp only — no updatedAt (attempts are immutable)
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userModuleQuizAttemptsRelations = relations(userModuleQuizAttempts, ({ one }) => ({
    user: one(users, {
        fields: [userModuleQuizAttempts.userId],
        references: [users.id],
    }),
    quiz: one(educationModuleQuizzes, {
        fields: [userModuleQuizAttempts.quizId],
        references: [educationModuleQuizzes.id],
    }),
}));

// TypeScript types
export type UserModuleQuizAttempt = typeof userModuleQuizAttempts.$inferSelect;
export type NewUserModuleQuizAttempt = typeof userModuleQuizAttempts.$inferInsert;