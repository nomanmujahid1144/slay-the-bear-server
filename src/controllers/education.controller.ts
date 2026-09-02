import { Response, NextFunction } from 'express';
import { EducationService } from '../services/education.service';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../types';

// ============================================
// EDUCATION CONTROLLER
// Handles all HTTP requests for the educational portal
// All routes require authentication (JWT)
// ============================================

export class EducationController {

    // ============================================
    // LEVELS
    // ============================================

    /**
     * GET /api/education/levels
     * Get all 5 levels with unlock status for the authenticated user
     */
    static async getLevels(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Get levels request for user: ${userId}`);

            const levels = await EducationService.getLevels(userId);

            return ApiResponseUtil.success(
                res,
                levels,
                'Levels retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // MODULES
    // ============================================

    /**
     * GET /api/education/levels/:slug/modules
     * Get all modules in a level with completion percentage
     */
    static async getModules(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;

            logger.info(`Get modules request for level: ${slug}, user: ${userId}`);

            const modules = await EducationService.getModules(userId, slug as string);

            return ApiResponseUtil.success(
                res,
                modules,
                'Modules retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // LESSONS
    // ============================================

    /**
     * GET /api/education/modules/:slug/lessons
     * Get all lessons in a module with completion status
     */
    static async getLessons(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;

            logger.info(`Get lessons request for module: ${slug}, user: ${userId}`);

            const lessons = await EducationService.getLessons(userId, slug as string);

            return ApiResponseUtil.success(
                res,
                lessons,
                'Lessons retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/education/lessons/:slug
     * Get single lesson content
     * Supports ?language=en|es for bilingual content
     */
    static async getLesson(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;
            const language = (req.query.language as 'en' | 'es') || 'en';

            logger.info(`Get lesson request: ${slug}, user: ${userId}, lang: ${language}`);

            const lesson = await EducationService.getLesson(userId, slug as string, language);

            return ApiResponseUtil.success(
                res,
                lesson,
                'Lesson retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/education/lessons/:slug/complete
     * Mark lesson as complete — awards XP, updates streak, checks badges
     */
    static async completeLesson(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;

            logger.info(`Complete lesson request: ${slug}, user: ${userId}`);

            const result = await EducationService.completeLesson(userId, slug as string);

            return ApiResponseUtil.success(
                res,
                result,
                result.message,
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // MODULE QUIZ
    // ============================================

    /**
     * GET /api/education/modules/:slug/quiz
     * Get module quiz — questions without correct answers
     */
    static async getModuleQuiz(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;

            logger.info(`Get module quiz request for: ${slug}, user: ${userId}`);

            const quiz = await EducationService.getModuleQuiz(userId, slug as string);

            return ApiResponseUtil.success(
                res,
                quiz,
                'Module quiz retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/education/modules/:slug/quiz/submit
     * Submit module quiz answers — grade and award XP on first pass
     */
    static async submitModuleQuiz(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;
            const { answers } = req.body;

            logger.info(`Submit module quiz request for: ${slug}, user: ${userId}`);

            const result = await EducationService.submitModuleQuiz(userId, slug as string, answers);

            return ApiResponseUtil.success(
                res,
                result,
                result.message,
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // LEVEL QUIZ
    // ============================================

    /**
     * GET /api/education/levels/:slug/quiz
     * Get level final quiz — questions without correct answers
     */
    static async getLevelQuiz(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;

            logger.info(`Get level quiz request for: ${slug}, user: ${userId}`);

            const quiz = await EducationService.getLevelQuiz(userId, slug as string);

            return ApiResponseUtil.success(
                res,
                quiz,
                'Level quiz retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/education/levels/:slug/quiz/submit
     * Submit level final quiz — grade, award XP, unlock next level on pass
     */
    static async submitLevelQuiz(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const { slug } = req.params;
            const { answers } = req.body;

            logger.info(`Submit level quiz request for: ${slug}, user: ${userId}`);

            const result = await EducationService.submitLevelQuiz(userId, slug as string, answers);

            return ApiResponseUtil.success(
                res,
                result,
                result.message,
                200
            );
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // PROGRESS & GAMIFICATION
    // ============================================

    /**
     * GET /api/education/progress
     * Get full user education progress — XP, streak, level, badges
     */
    static async getProgress(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Get education progress request for user: ${userId}`);

            const progress = await EducationService.getProgress(userId);

            return ApiResponseUtil.success(
                res,
                progress,
                'Progress retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/education/leaderboard
     * Get global leaderboard — top users ranked by XP
     */
    static async getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

            logger.info(`Get leaderboard request for user: ${userId}`);

            const result = await EducationService.getLeaderboard(userId, limit);

            return ApiResponseUtil.success(
                res,
                result,
                'Leaderboard retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/education/badges
     * Get all badges — earned and locked — for the authenticated user
     */
    static async getBadges(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Get badges request for user: ${userId}`);

            const badges = await EducationService.getBadges(userId);

            return ApiResponseUtil.success(
                res,
                badges,
                'Badges retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/education/daily-challenge
     * Get today's daily challenge for the authenticated user
     */
    static async getDailyChallenge(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Get daily challenge request for user: ${userId}`);

            const challenge = await EducationService.getDailyChallenge(userId);

            return ApiResponseUtil.success(
                res,
                challenge,
                'Daily challenge retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/education/daily-challenge/complete
     * Mark today's daily challenge as complete — awards XP
     */
    static async completeDailyChallenge(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id!;

            logger.info(`Complete daily challenge request for user: ${userId}`);

            const result = await EducationService.completeDailyChallenge(userId);

            return ApiResponseUtil.success(
                res,
                result,
                result.message,
                200
            );
        } catch (error) {
            next(error);
        }
    }
}

export default EducationController;