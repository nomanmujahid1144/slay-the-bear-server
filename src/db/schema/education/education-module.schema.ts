import { pgTable, uuid, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { educationLevels } from './education-level.schema';

// ============================================
// EDUCATION MODULES TABLE
// Each level has multiple modules
// Each module has lessons + one module quiz (5 questions)
// Sequential unlock enforced server-side — cannot skip
// ============================================

export const educationModules = pgTable('education_modules', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Link to parent level
    levelId: uuid('level_id')
        .notNull()
        .references(() => educationLevels.id, { onDelete: 'cascade' }),

    // URL-friendly identifier e.g. "what-is-investing", "stocks-explained"
    // Used in API endpoints: /api/education/modules/:slug
    slug: varchar('slug', { length: 100 }).notNull().unique(),

    // Display title shown to the user
    title: varchar('title', { length: 200 }).notNull(),

    // Short description of what this module covers
    description: text('description'),

    // Display order within the level (1, 2, 3...)
    order: integer('order').notNull(),

    // XP awarded when all lessons in this module are completed
    xpReward: integer('xp_reward').notNull().default(150),

    // Estimated time to complete all lessons in minutes
    estimatedMinutes: integer('estimated_minutes').notNull().default(5),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations — only reference parent (educationLevels)
// Child relations (lessons, quiz) are defined in their own files
export const educationModulesRelations = relations(educationModules, ({ one }) => ({
    level: one(educationLevels, {
        fields: [educationModules.levelId],
        references: [educationLevels.id],
    }),
}));

// TypeScript types
export type EducationModule = typeof educationModules.$inferSelect;
export type NewEducationModule = typeof educationModules.$inferInsert;