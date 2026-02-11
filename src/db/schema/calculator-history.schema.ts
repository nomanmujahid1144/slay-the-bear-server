import { pgTable, uuid, varchar, timestamp, jsonb, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';

// Calculator History Table
export const calculatorHistory = pgTable('calculator_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  calculatorType: varchar('calculator_type', { length: 50 }).notNull(), // 'stock-analyzer', 'portfolio-optimizer'
  inputData: jsonb('input_data').notNull(), // Store input parameters
  resultData: jsonb('result_data').notNull(), // Store calculation results
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const calculatorHistoryRelations = relations(calculatorHistory, ({ one }) => ({
  user: one(users, {
    fields: [calculatorHistory.userId],
    references: [users.id],
  }),
}));

// TypeScript types
export type CalculatorHistory = typeof calculatorHistory.$inferSelect;
export type NewCalculatorHistory = typeof calculatorHistory.$inferInsert;