import { pgTable, uuid, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { educationLevels } from './education-level.schema';

// ============================================
// EDUCATION LEVEL QUIZ TABLE
// One final quiz per level — 10 to 15 questions
// User MUST score 80%+ to unlock the next level
// XP awarded only once — on the first passing attempt
// Unlimited retakes allowed
// ============================================

export const educationLevelQuizzes = pgTable('education_level_quizzes', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to parent level — one quiz per level (unique)
    levelId: uuid('level_id')
        .notNull()
        .unique()
        .references(() => educationLevels.id, { onDelete: 'cascade' }),

    // Display title e.g. "Beginner Level Final Quiz"
    title: varchar('title', { length: 200 }).notNull(),

    // Number of questions — 10 to 15 for level quizzes
    questionCount: integer('question_count').notNull().default(10),

    // Pass threshold as percentage — must be 80%+ to unlock next level
    passThreshold: integer('pass_threshold').notNull().default(80),

    // XP awarded on first pass only — much higher than module quiz
    xpReward: integer('xp_reward').notNull().default(200),

    // Questions stored as JSONB array:
    // [{ id, question, options: [{label, value}], correctAnswer }]
    // IMPORTANT: correctAnswer is NEVER sent to the frontend
    // It is only used server-side for grading
    questions: jsonb('questions').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations — only reference parent (educationLevels)
export const educationLevelQuizzesRelations = relations(educationLevelQuizzes, ({ one }) => ({
    level: one(educationLevels, {
        fields: [educationLevelQuizzes.levelId],
        references: [educationLevels.id],
    }),
}));

// TypeScript types
export type EducationLevelQuiz = typeof educationLevelQuizzes.$inferSelect;
export type NewEducationLevelQuiz = typeof educationLevelQuizzes.$inferInsert;