import { pgTable, uuid, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { educationModules } from './education-module.schema';

// ============================================
// EDUCATION MODULE QUIZ TABLE
// One quiz per module — always 5 questions
// Knowledge check — smaller XP reward
// Does NOT unlock next level (only level quiz does that)
// Unlimited retakes allowed
// XP awarded only once per user per quiz
// ============================================

export const educationModuleQuizzes = pgTable('education_module_quizzes', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to parent module — one quiz per module (unique)
    moduleId: uuid('module_id')
        .notNull()
        .unique()
        .references(() => educationModules.id, { onDelete: 'cascade' }),

    // Display title e.g. "Module 1 Quiz: What is Investing?"
    title: varchar('title', { length: 200 }).notNull(),

    // Number of questions — always 5 for module quizzes
    questionCount: integer('question_count').notNull().default(5),

    // Pass threshold as percentage e.g. 80 = 80%
    passThreshold: integer('pass_threshold').notNull().default(80),

    // XP awarded on passing — only once ever per user per quiz
    xpReward: integer('xp_reward').notNull().default(50),

    // Questions stored as JSONB array:
    // [{ id, question, options: [{label, value}], correctAnswer }]
    // IMPORTANT: correctAnswer is NEVER sent to the frontend
    // It is only used server-side for grading
    questions: jsonb('questions').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations — only reference parent (educationModules)
export const educationModuleQuizzesRelations = relations(educationModuleQuizzes, ({ one }) => ({
    module: one(educationModules, {
        fields: [educationModuleQuizzes.moduleId],
        references: [educationModules.id],
    }),
}));

// TypeScript types
export type EducationModuleQuiz = typeof educationModuleQuizzes.$inferSelect;
export type NewEducationModuleQuiz = typeof educationModuleQuizzes.$inferInsert;

// Quiz question shape — used in seed data and service layer
// NEVER send correctAnswer to the frontend — server-side grading only
export interface QuizQuestion {
    id: string;
    question: string;
    options: { label: string; value: string }[];
    correctAnswer: string;
}