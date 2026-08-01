import {
    pgTable, uuid, varchar, integer, boolean,
    timestamp, text
} from 'drizzle-orm/pg-core';

// ============================================
// EDUCATION LEVELS TABLE
// 5 levels: Beginner, Intermediate, Advanced, Expert, Master
// ============================================

export const educationLevels = pgTable('education_levels', {
    id: uuid('id').defaultRandom().primaryKey(),

    // e.g. "beginner", "intermediate" — used in API URLs
    slug: varchar('slug', { length: 50 }).notNull().unique(),

    // Display name: "Beginner", "Intermediate" etc.
    title: varchar('title', { length: 100 }).notNull(),

    // Short description of the level
    description: text('description'),

    // Order of display (1 = Beginner, 5 = Master)
    order: integer('order').notNull(),

    // XP required to reach this level
    xpRequired: integer('xp_required').notNull().default(0),

    // Whether this level has content yet (Master = false for now)
    isActive: boolean('is_active').notNull().default(true),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types
export type EducationLevel = typeof educationLevels.$inferSelect;
export type NewEducationLevel = typeof educationLevels.$inferInsert;