import { Router } from 'express';
import { EducationController } from '../controllers/education.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// ============================================
// EDUCATION ROUTES
// All routes require authentication (JWT)
// Base path: /api/education
// ============================================

// ── LEVELS ───────────────────────────────────────────────────────────────

/**
 * @route   GET /api/education/levels
 * @desc    Get all 5 levels with unlock status for the authenticated user
 * @access  Private (requires authentication)
 */
router.get('/levels', authenticate, EducationController.getLevels);

/**
 * @route   GET /api/education/levels/:slug/modules
 * @desc    Get all modules in a level with completion percentage
 * @access  Private (requires authentication)
 */
router.get('/levels/:slug/modules', authenticate, EducationController.getModules);

/**
 * @route   GET /api/education/levels/:slug/quiz
 * @desc    Get level final quiz — questions without correct answers
 * @access  Private (requires authentication)
 */
router.get('/levels/:slug/quiz', authenticate, EducationController.getLevelQuiz);

/**
 * @route   POST /api/education/levels/:slug/quiz/submit
 * @desc    Submit level final quiz — grade, award XP, unlock next level on pass
 * @access  Private (requires authentication)
 */
router.post('/levels/:slug/quiz/submit', authenticate, EducationController.submitLevelQuiz);

// ── MODULES ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/education/modules/:slug/lessons
 * @desc    Get all lessons in a module with completion status
 * @access  Private (requires authentication)
 */
router.get('/modules/:slug/lessons', authenticate, EducationController.getLessons);

/**
 * @route   GET /api/education/modules/:slug/quiz
 * @desc    Get module quiz — 5 questions without correct answers
 * @access  Private (requires authentication)
 */
router.get('/modules/:slug/quiz', authenticate, EducationController.getModuleQuiz);

/**
 * @route   POST /api/education/modules/:slug/quiz/submit
 * @desc    Submit module quiz answers — grade and award XP on first pass
 * @access  Private (requires authentication)
 */
router.post('/modules/:slug/quiz/submit', authenticate, EducationController.submitModuleQuiz);

// ── LESSONS ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/education/lessons/:slug
 * @desc    Get single lesson content — supports ?language=en|es
 * @access  Private (requires authentication)
 */
router.get('/lessons/:slug', authenticate, EducationController.getLesson);

/**
 * @route   POST /api/education/lessons/:slug/complete
 * @desc    Mark lesson as complete — awards XP, updates streak, checks badges
 * @access  Private (requires authentication)
 */
router.post('/lessons/:slug/complete', authenticate, EducationController.completeLesson);

// ── PROGRESS & GAMIFICATION ───────────────────────────────────────────────

/**
 * @route   GET /api/education/progress
 * @desc    Get full user education progress — XP, streak, level, badges
 * @access  Private (requires authentication)
 */
router.get('/progress', authenticate, EducationController.getProgress);

/**
 * @route   GET /api/education/leaderboard
 * @desc    Get global leaderboard — top users ranked by XP
 * @access  Private (requires authentication)
 * @example /api/education/leaderboard?limit=10
 */
router.get('/leaderboard', authenticate, EducationController.getLeaderboard);

/**
 * @route   GET /api/education/badges
 * @desc    Get all badges — earned and locked — for the authenticated user
 * @access  Private (requires authentication)
 */
router.get('/badges', authenticate, EducationController.getBadges);

/**
 * @route   GET /api/education/daily-challenge
 * @desc    Get today's daily challenge for the authenticated user
 * @access  Private (requires authentication)
 */
router.get('/daily-challenge', authenticate, EducationController.getDailyChallenge);

/**
 * @route   POST /api/education/daily-challenge/complete
 * @desc    Mark today's daily challenge as complete — awards XP
 * @access  Private (requires authentication)
 */
router.post('/daily-challenge/complete', authenticate, EducationController.completeDailyChallenge);

export default router;