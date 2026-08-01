// ============================================
// EDUCATION SCHEMA EXPORTS
// Order matters — export base tables first
// before tables that reference them
// ============================================

// Base tables first (no dependencies)
export * from './education-level.schema';

// Depends on level
export * from './education-module.schema';

// Depends on module
export * from './education-lesson.schema';

// Depends on module
export * from './user-module-quiz-attempt.schema';
export * from './education-module-quiz.schema';

// Depends on level
export * from './user-level-quiz-attempt.schema';
export * from './education-level-quiz.schema';

// Depends on users only
export * from './user-education-progress.schema';
export * from './xp-ledger.schema';
export * from './user-badge.schema';
export * from './user-daily-challenge.schema';