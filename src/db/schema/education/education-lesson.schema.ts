import { pgTable, uuid, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { educationModules } from './education-module.schema';

// ============================================
// EDUCATION LESSONS TABLE
// Each module has multiple lessons
// Supports bilingual content (EN/ES)
// Sequential unlock enforced server-side — cannot skip lessons
// ============================================

export const educationLessons = pgTable('education_lessons', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to parent module
    moduleId: uuid('module_id')
        .notNull()
        .references(() => educationModules.id, { onDelete: 'cascade' }),

    // URL-friendly identifier e.g. "what-is-a-stock", "bonds-explained"
    // Used in API endpoints: /api/education/lessons/:slug
    slug: varchar('slug', { length: 100 }).notNull().unique(),

    // Display title in English
    title: varchar('title', { length: 200 }).notNull(),

    // Display title in Spanish (optional for now)
    titleEs: varchar('title_es', { length: 200 }),

    // Full lesson content in English (markdown or plain text)
    content: text('content').notNull(),

    // Full lesson content in Spanish (optional for now)
    contentEs: text('content_es'),

    // Display order within the module (1, 2, 3...)
    order: integer('order').notNull(),

    // XP awarded when this lesson is marked complete
    xpReward: integer('xp_reward').notNull().default(50),

    // Estimated reading time in minutes
    estimatedMinutes: integer('estimated_minutes').notNull().default(5),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations — only reference parent (educationModules)
export const educationLessonsRelations = relations(educationLessons, ({ one }) => ({
    module: one(educationModules, {
        fields: [educationLessons.moduleId],
        references: [educationModules.id],
    }),
}));

// TypeScript types
export type EducationLesson = typeof educationLessons.$inferSelect;
export type NewEducationLesson = typeof educationLessons.$inferInsert;