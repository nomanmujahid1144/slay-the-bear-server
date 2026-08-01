import { db } from '../db';
import {
    educationLevels,
    educationModules,
    educationLessons,
    educationModuleQuizzes,
    educationLevelQuizzes,
    userEducationProgress,
    userModuleQuizAttempts,
    userLevelQuizAttempts,
    xpLedger,
    userBadges,
    userDailyChallenges,
    XP_REWARDS,
    XP_REASONS,
    BADGE_DEFINITIONS,
    type QuizQuestion,
} from '../db/schema/education';
import { users } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

// ============================================
// EDUCATION SERVICE
// All business logic for the educational portal
// Levels, Modules, Lessons, Quizzes, XP, Badges
// ============================================

export class EducationService {

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    /**
     * Get or create user education progress record
     * Every user starts with Beginner unlocked
     */
    private static async getOrCreateProgress(userId: string) {
        const existing = await db
            .select()
            .from(userEducationProgress)
            .where(eq(userEducationProgress.userId, userId))
            .limit(1);

        if (existing.length > 0) {
            return existing[0];
        }

        // Create new progress record for first-time user
        const [newProgress] = await db
            .insert(userEducationProgress)
            .values({
                userId,
                currentLevelSlug: 'beginner',
                totalXp: 0,
                streak: 0,
                completedLessons: [],
                completedModules: [],
                unlockedLevels: ['beginner'],
            })
            .returning();

        logger.info(`Created education progress for user: ${userId}`);
        return newProgress;
    }

    /**
     * Award XP to user and log to ledger
     * Updates totalXp in progress + inserts to xp_ledger
     */
    private static async awardXp(
        userId: string,
        amount: number,
        reason: string,
        referenceId?: string,
        description?: string
    ): Promise<void> {
        // Update total XP in progress table
        await db
            .update(userEducationProgress)
            .set({
                totalXp: sql`${userEducationProgress.totalXp} + ${amount}`,
                updatedAt: new Date(),
            })
            .where(eq(userEducationProgress.userId, userId));

        // Log to immutable XP ledger
        await db.insert(xpLedger).values({
            userId,
            amount,
            reason,
            referenceId: referenceId || null,
            description: description || null,
        });

        logger.info(`Awarded ${amount} XP to user: ${userId} for: ${reason}`);
    }

    /**
     * Update user streak based on last active date
     * Called whenever a lesson is completed
     */
    private static async updateStreak(userId: string): Promise<number> {
        const progress = await db
            .select()
            .from(userEducationProgress)
            .where(eq(userEducationProgress.userId, userId))
            .limit(1);

        if (progress.length === 0) return 0;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastActive = progress[0].lastActiveDate;

        let newStreak = progress[0].streak;

        if (!lastActive) {
            // First time — start streak at 1
            newStreak = 1;
        } else {
            const lastDate = new Date(lastActive);
            const todayDate = new Date(today);
            const diffDays = Math.floor(
                (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 0) {
                // Already active today — no change
            } else if (diffDays === 1) {
                // Consecutive day — increment streak
                newStreak = progress[0].streak + 1;
            } else {
                // Missed a day — reset streak
                newStreak = 1;
            }
        }

        await db
            .update(userEducationProgress)
            .set({
                streak: newStreak,
                lastActiveDate: today,
                updatedAt: new Date(),
            })
            .where(eq(userEducationProgress.userId, userId));

        return newStreak;
    }

    /**
     * Check and award badges based on current progress
     * Called after every XP award
     */
    private static async checkAndAwardBadges(userId: string): Promise<string[]> {
        const progress = await db
            .select()
            .from(userEducationProgress)
            .where(eq(userEducationProgress.userId, userId))
            .limit(1);

        if (progress.length === 0) return [];

        const p = progress[0];
        const completedLessons = (p.completedLessons as string[]) || [];
        const unlockedLevels = (p.unlockedLevels as string[]) || [];

        // Get all badges user already has
        const existingBadges = await db
            .select()
            .from(userBadges)
            .where(eq(userBadges.userId, userId));

        const existingSlugs = new Set(existingBadges.map(b => b.badgeSlug));
        const newBadges: string[] = [];

        // Check each badge definition
        for (const badge of BADGE_DEFINITIONS) {
            if (existingSlugs.has(badge.slug)) continue;

            let earned = false;

            if (badge.slug === 'first_lesson' && completedLessons.length >= 1) earned = true;
            if (badge.slug === '7_day_streak' && p.streak >= 7) earned = true;
            if (badge.slug === '30_day_streak' && p.streak >= 30) earned = true;
            if (badge.slug === 'beginner_complete' && unlockedLevels.includes('intermediate')) earned = true;
            if (badge.slug === 'intermediate_complete' && unlockedLevels.includes('advanced')) earned = true;
            if (badge.slug === 'xp_1000' && p.totalXp >= 1000) earned = true;
            if (badge.slug === 'xp_5000' && p.totalXp >= 5000) earned = true;

            if (earned) {
                await db.insert(userBadges).values({
                    userId,
                    badgeSlug: badge.slug,
                    badgeName: badge.name,
                    description: badge.description,
                });
                newBadges.push(badge.slug);
                logger.info(`Badge awarded: ${badge.slug} to user: ${userId}`);
            }
        }

        return newBadges;
    }

    // ============================================
    // LEVELS
    // ============================================

    /**
     * Get all 5 levels with unlock status for the user
     * GET /api/education/levels
     */
    static async getLevels(userId: string) {
        try {
            logger.info(`Getting education levels for user: ${userId}`);

            const progress = await this.getOrCreateProgress(userId);
            const unlockedLevels = (progress.unlockedLevels as string[]) || ['beginner'];

            const levels = await db
                .select()
                .from(educationLevels)
                .orderBy(educationLevels.order);

            const result = levels.map(level => ({
                id: level.id,
                slug: level.slug,
                title: level.title,
                description: level.description,
                order: level.order,
                xpRequired: level.xpRequired,
                isActive: level.isActive,
                isUnlocked: unlockedLevels.includes(level.slug),
                isCurrent: progress.currentLevelSlug === level.slug,
            }));

            logger.info(`Retrieved ${result.length} levels for user: ${userId}`);
            return result;
        } catch (error: any) {
            logger.error('Get levels error', { error: error.message, userId });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    // ============================================
    // MODULES
    // ============================================

    /**
     * Get all modules in a level with completion status
     * GET /api/education/levels/:slug/modules
     */
    static async getModules(userId: string, levelSlug: string) {
        try {
            logger.info(`Getting modules for level: ${levelSlug}, user: ${userId}`);

            // Check level exists
            const level = await db
                .select()
                .from(educationLevels)
                .where(eq(educationLevels.slug, levelSlug))
                .limit(1);

            if (level.length === 0) {
                throw ApiError.notFound('Level not found');
            }

            // Check level is unlocked for user
            const progress = await this.getOrCreateProgress(userId);
            const unlockedLevels = (progress.unlockedLevels as string[]) || ['beginner'];

            if (!unlockedLevels.includes(levelSlug)) {
                throw ApiError.forbidden('This level is locked. Complete the previous level quiz to unlock it.');
            }

            const modules = await db
                .select()
                .from(educationModules)
                .where(eq(educationModules.levelId, level[0].id))
                .orderBy(educationModules.order);

            const completedModules = (progress.completedModules as string[]) || [];
            const completedLessons = (progress.completedLessons as string[]) || [];

            // Get lesson counts per module
            const result = await Promise.all(modules.map(async (module) => {
                const lessons = await db
                    .select({ slug: educationLessons.slug })
                    .from(educationLessons)
                    .where(eq(educationLessons.moduleId, module.id));

                const totalLessons = lessons.length;
                const completedCount = lessons.filter(l =>
                    completedLessons.includes(l.slug)
                ).length;

                const completionPercent = totalLessons > 0
                    ? Math.round((completedCount / totalLessons) * 100)
                    : 0;

                return {
                    id: module.id,
                    slug: module.slug,
                    title: module.title,
                    description: module.description,
                    order: module.order,
                    xpReward: module.xpReward,
                    estimatedMinutes: module.estimatedMinutes,
                    isCompleted: completedModules.includes(module.slug),
                    completionPercent,
                    totalLessons,
                    completedLessons: completedCount,
                };
            }));

            logger.info(`Retrieved ${result.length} modules for level: ${levelSlug}`);
            return result;
        } catch (error: any) {
            logger.error('Get modules error', { error: error.message, userId, levelSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    // ============================================
    // LESSONS
    // ============================================

    /**
     * Get all lessons in a module with completion status
     * GET /api/education/modules/:slug/lessons
     */
    static async getLessons(userId: string, moduleSlug: string) {
        try {
            logger.info(`Getting lessons for module: ${moduleSlug}, user: ${userId}`);

            const module = await db
                .select()
                .from(educationModules)
                .where(eq(educationModules.slug, moduleSlug))
                .limit(1);

            if (module.length === 0) {
                throw ApiError.notFound('Module not found');
            }

            const progress = await this.getOrCreateProgress(userId);
            const completedLessons = (progress.completedLessons as string[]) || [];

            const lessons = await db
                .select()
                .from(educationLessons)
                .where(eq(educationLessons.moduleId, module[0].id))
                .orderBy(educationLessons.order);

            const result = lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.slug);
                // First lesson always unlocked, others require previous to be complete
                const previousCompleted = index === 0
                    ? true
                    : completedLessons.includes(lessons[index - 1].slug);

                return {
                    id: lesson.id,
                    slug: lesson.slug,
                    title: lesson.title,
                    order: lesson.order,
                    xpReward: lesson.xpReward,
                    estimatedMinutes: lesson.estimatedMinutes,
                    isCompleted,
                    isUnlocked: isCompleted || previousCompleted,
                    status: isCompleted ? 'complete' : previousCompleted ? 'in_progress' : 'locked',
                };
            });

            logger.info(`Retrieved ${result.length} lessons for module: ${moduleSlug}`);
            return result;
        } catch (error: any) {
            logger.error('Get lessons error', { error: error.message, userId, moduleSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Get single lesson content
     * GET /api/education/lessons/:slug
     */
    static async getLesson(userId: string, lessonSlug: string, language: 'en' | 'es' = 'en') {
        try {
            logger.info(`Getting lesson: ${lessonSlug}, user: ${userId}, lang: ${language}`);

            const lesson = await db
                .select()
                .from(educationLessons)
                .where(eq(educationLessons.slug, lessonSlug))
                .limit(1);

            if (lesson.length === 0) {
                throw ApiError.notFound('Lesson not found');
            }

            const l = lesson[0];

            // Check sequential unlock — ensure previous lesson is complete
            const allModuleLessons = await db
                .select()
                .from(educationLessons)
                .where(eq(educationLessons.moduleId, l.moduleId))
                .orderBy(educationLessons.order);

            const lessonIndex = allModuleLessons.findIndex(ml => ml.slug === lessonSlug);
            const progress = await this.getOrCreateProgress(userId);
            const completedLessons = (progress.completedLessons as string[]) || [];

            // If not the first lesson, previous must be complete
            if (lessonIndex > 0) {
                const prevLesson = allModuleLessons[lessonIndex - 1];
                if (!completedLessons.includes(prevLesson.slug)) {
                    throw ApiError.forbidden('Complete the previous lesson first.');
                }
            }

            // Return bilingual content based on language param
            const content = language === 'es' && l.contentEs ? l.contentEs : l.content;
            const title = language === 'es' && l.titleEs ? l.titleEs : l.title;

            logger.info(`Lesson retrieved: ${lessonSlug}`);
            return {
                id: l.id,
                slug: l.slug,
                title,
                content,
                order: l.order,
                xpReward: l.xpReward,
                estimatedMinutes: l.estimatedMinutes,
                isCompleted: completedLessons.includes(lessonSlug),
                language,
            };
        } catch (error: any) {
            logger.error('Get lesson error', { error: error.message, userId, lessonSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Mark lesson as complete — awards XP, updates streak, checks badges
     * POST /api/education/lessons/:slug/complete
     */
    static async completeLesson(userId: string, lessonSlug: string) {
        try {
            logger.info(`Completing lesson: ${lessonSlug} for user: ${userId}`);

            const lesson = await db
                .select()
                .from(educationLessons)
                .where(eq(educationLessons.slug, lessonSlug))
                .limit(1);

            if (lesson.length === 0) {
                throw ApiError.notFound('Lesson not found');
            }

            const progress = await this.getOrCreateProgress(userId);
            const completedLessons = (progress.completedLessons as string[]) || [];

            // Idempotent — don't award XP twice
            if (completedLessons.includes(lessonSlug)) {
                return {
                    message: 'Lesson already completed',
                    xpAwarded: 0,
                    alreadyCompleted: true,
                };
            }

            // Add lesson to completed array
            const updatedCompletedLessons = [...completedLessons, lessonSlug];

            await db
                .update(userEducationProgress)
                .set({
                    completedLessons: updatedCompletedLessons,
                    updatedAt: new Date(),
                })
                .where(eq(userEducationProgress.userId, userId));

            // Award XP
            const xpAmount = lesson[0].xpReward || XP_REWARDS.LESSON_COMPLETE;
            await this.awardXp(
                userId,
                xpAmount,
                XP_REASONS.LESSON_COMPLETE,
                lessonSlug,
                `Completed lesson: ${lesson[0].title}`
            );

            // Update streak
            const newStreak = await this.updateStreak(userId);

            // Check and award badges
            const newBadges = await this.checkAndAwardBadges(userId);

            // Find next lesson in the same module
            const allModuleLessons = await db
                .select()
                .from(educationLessons)
                .where(eq(educationLessons.moduleId, lesson[0].moduleId))
                .orderBy(educationLessons.order);

            const currentIndex = allModuleLessons.findIndex(l => l.slug === lessonSlug);
            const nextLesson = allModuleLessons[currentIndex + 1] || null;

            logger.info(`Lesson completed: ${lessonSlug} for user: ${userId}, XP: ${xpAmount}`);

            return {
                message: 'Lesson completed successfully',
                xpAwarded: xpAmount,
                newStreak,
                newBadges,
                nextLesson: nextLesson ? {
                    slug: nextLesson.slug,
                    title: nextLesson.title,
                } : null,
                alreadyCompleted: false,
            };
        } catch (error: any) {
            logger.error('Complete lesson error', { error: error.message, userId, lessonSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    // ============================================
    // MODULE QUIZ
    // ============================================

    /**
     * Get module quiz — questions WITHOUT correct answers
     * GET /api/education/modules/:slug/quiz
     */
    static async getModuleQuiz(userId: string, moduleSlug: string) {
        try {
            logger.info(`Getting module quiz for: ${moduleSlug}, user: ${userId}`);

            const module = await db
                .select()
                .from(educationModules)
                .where(eq(educationModules.slug, moduleSlug))
                .limit(1);

            if (module.length === 0) {
                throw ApiError.notFound('Module not found');
            }

            const quiz = await db
                .select()
                .from(educationModuleQuizzes)
                .where(eq(educationModuleQuizzes.moduleId, module[0].id))
                .limit(1);

            if (quiz.length === 0) {
                throw ApiError.notFound('Quiz not found for this module');
            }

            const q = quiz[0];
            const questions = (q.questions as QuizQuestion[]) || [];

            // Strip correctAnswer before sending to frontend
            const safeQuestions = questions.map(({ correctAnswer: _removed, ...rest }) => rest);

            logger.info(`Module quiz retrieved for: ${moduleSlug}`);
            return {
                id: q.id,
                title: q.title,
                questionCount: q.questionCount,
                passThreshold: q.passThreshold,
                xpReward: q.xpReward,
                questions: safeQuestions,
            };
        } catch (error: any) {
            logger.error('Get module quiz error', { error: error.message, userId, moduleSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Submit module quiz answers — grade and award XP
     * POST /api/education/modules/:slug/quiz/submit
     */
    static async submitModuleQuiz(
        userId: string,
        moduleSlug: string,
        answers: { questionId: string; selectedAnswer: string }[]
    ) {
        try {
            logger.info(`Submitting module quiz for: ${moduleSlug}, user: ${userId}`);

            const module = await db
                .select()
                .from(educationModules)
                .where(eq(educationModules.slug, moduleSlug))
                .limit(1);

            if (module.length === 0) {
                throw ApiError.notFound('Module not found');
            }

            const quiz = await db
                .select()
                .from(educationModuleQuizzes)
                .where(eq(educationModuleQuizzes.moduleId, module[0].id))
                .limit(1);

            if (quiz.length === 0) {
                throw ApiError.notFound('Quiz not found for this module');
            }

            const q = quiz[0];
            const questions = (q.questions as QuizQuestion[]) || [];

            // Grade the quiz server-side
            let correctCount = 0;
            const gradedAnswers = answers.map(answer => {
                const question = questions.find(ques => ques.id === answer.questionId);
                const isCorrect = question?.correctAnswer === answer.selectedAnswer;
                if (isCorrect) correctCount++;
                return {
                    questionId: answer.questionId,
                    selectedAnswer: answer.selectedAnswer,
                    correctAnswer: question?.correctAnswer,
                    isCorrect,
                };
            });

            const totalCount = questions.length;
            const score = Math.round((correctCount / totalCount) * 100);
            const passed = score >= q.passThreshold;

            // Check if XP was already awarded for this quiz
            const existingAttempts = await db
                .select()
                .from(userModuleQuizAttempts)
                .where(
                    and(
                        eq(userModuleQuizAttempts.userId, userId),
                        eq(userModuleQuizAttempts.quizId, q.id),
                        eq(userModuleQuizAttempts.xpAwarded, true)
                    )
                )
                .limit(1);

            const xpAlreadyAwarded = existingAttempts.length > 0;
            let xpAwarded = 0;

            // Save attempt
            await db.insert(userModuleQuizAttempts).values({
                userId,
                quizId: q.id,
                score,
                correctCount,
                totalCount,
                passed,
                xpAwarded: passed && !xpAlreadyAwarded,
                submittedAnswers: answers,
            });

            // Award XP only on first pass
            if (passed && !xpAlreadyAwarded) {
                xpAwarded = q.xpReward;
                await this.awardXp(
                    userId,
                    xpAwarded,
                    XP_REASONS.MODULE_QUIZ_PASS,
                    q.id,
                    `Passed module quiz: ${q.title}`
                );

                // Check badges after XP award
                await this.checkAndAwardBadges(userId);
            }

            logger.info(`Module quiz submitted: ${moduleSlug}, score: ${score}%, passed: ${passed}`);

            return {
                score,
                correctCount,
                totalCount,
                passed,
                passThreshold: q.passThreshold,
                xpAwarded,
                gradedAnswers,
                message: passed
                    ? 'Congratulations! You passed the quiz.'
                    : `You scored ${score}%. You need ${q.passThreshold}% to pass. Try again!`,
            };
        } catch (error: any) {
            logger.error('Submit module quiz error', { error: error.message, userId, moduleSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    // ============================================
    // LEVEL QUIZ
    // ============================================

    /**
     * Get level final quiz — questions WITHOUT correct answers
     * GET /api/education/levels/:slug/quiz
     */
    static async getLevelQuiz(userId: string, levelSlug: string) {
        try {
            logger.info(`Getting level quiz for: ${levelSlug}, user: ${userId}`);

            const level = await db
                .select()
                .from(educationLevels)
                .where(eq(educationLevels.slug, levelSlug))
                .limit(1);

            if (level.length === 0) {
                throw ApiError.notFound('Level not found');
            }

            const quiz = await db
                .select()
                .from(educationLevelQuizzes)
                .where(eq(educationLevelQuizzes.levelId, level[0].id))
                .limit(1);

            if (quiz.length === 0) {
                throw ApiError.notFound('Level quiz not found');
            }

            const q = quiz[0];
            const questions = (q.questions as QuizQuestion[]) || [];

            // Strip correctAnswer before sending to frontend
            const safeQuestions = questions.map(({ correctAnswer: _removed, ...rest }) => rest);

            logger.info(`Level quiz retrieved for: ${levelSlug}`);
            return {
                id: q.id,
                title: q.title,
                questionCount: q.questionCount,
                passThreshold: q.passThreshold,
                xpReward: q.xpReward,
                questions: safeQuestions,
            };
        } catch (error: any) {
            logger.error('Get level quiz error', { error: error.message, userId, levelSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Submit level final quiz — grade, award XP, unlock next level
     * POST /api/education/levels/:slug/quiz/submit
     */
    static async submitLevelQuiz(
        userId: string,
        levelSlug: string,
        answers: { questionId: string; selectedAnswer: string }[]
    ) {
        try {
            logger.info(`Submitting level quiz for: ${levelSlug}, user: ${userId}`);

            const level = await db
                .select()
                .from(educationLevels)
                .where(eq(educationLevels.slug, levelSlug))
                .limit(1);

            if (level.length === 0) {
                throw ApiError.notFound('Level not found');
            }

            const quiz = await db
                .select()
                .from(educationLevelQuizzes)
                .where(eq(educationLevelQuizzes.levelId, level[0].id))
                .limit(1);

            if (quiz.length === 0) {
                throw ApiError.notFound('Level quiz not found');
            }

            const q = quiz[0];
            const questions = (q.questions as QuizQuestion[]) || [];

            // Grade the quiz server-side
            let correctCount = 0;
            const gradedAnswers = answers.map(answer => {
                const question = questions.find(ques => ques.id === answer.questionId);
                const isCorrect = question?.correctAnswer === answer.selectedAnswer;
                if (isCorrect) correctCount++;
                return {
                    questionId: answer.questionId,
                    selectedAnswer: answer.selectedAnswer,
                    correctAnswer: question?.correctAnswer,
                    isCorrect,
                };
            });

            const totalCount = questions.length;
            const score = Math.round((correctCount / totalCount) * 100);
            const passed = score >= q.passThreshold;

            // Check if XP was already awarded (first pass only)
            const existingPass = await db
                .select()
                .from(userLevelQuizAttempts)
                .where(
                    and(
                        eq(userLevelQuizAttempts.userId, userId),
                        eq(userLevelQuizAttempts.quizId, q.id),
                        eq(userLevelQuizAttempts.xpAwarded, true)
                    )
                )
                .limit(1);

            const xpAlreadyAwarded = existingPass.length > 0;
            let xpAwarded = 0;
            let nextLevelUnlocked = false;
            let nextLevelSlug: string | null = null;

            // Find next level to unlock
            if (passed) {
                const nextLevel = await db
                    .select()
                    .from(educationLevels)
                    .where(eq(educationLevels.order, level[0].order + 1))
                    .limit(1);

                if (nextLevel.length > 0 && nextLevel[0].isActive) {
                    nextLevelSlug = nextLevel[0].slug;

                    // Unlock next level if not already unlocked
                    const progress = await this.getOrCreateProgress(userId);
                    const unlockedLevels = (progress.unlockedLevels as string[]) || ['beginner'];

                    if (!unlockedLevels.includes(nextLevelSlug)) {
                        const updatedLevels = [...unlockedLevels, nextLevelSlug];
                        await db
                            .update(userEducationProgress)
                            .set({
                                unlockedLevels: updatedLevels,
                                currentLevelSlug: nextLevelSlug,
                                updatedAt: new Date(),
                            })
                            .where(eq(userEducationProgress.userId, userId));

                        nextLevelUnlocked = true;
                        logger.info(`Level unlocked: ${nextLevelSlug} for user: ${userId}`);
                    }
                }

                // Award XP only on first pass
                if (!xpAlreadyAwarded) {
                    xpAwarded = q.xpReward;
                    await this.awardXp(
                        userId,
                        xpAwarded,
                        XP_REASONS.LEVEL_QUIZ_PASS,
                        q.id,
                        `Passed level quiz: ${q.title}`
                    );

                    // Check badges after XP award
                    await this.checkAndAwardBadges(userId);
                }
            }

            // Save attempt
            await db.insert(userLevelQuizAttempts).values({
                userId,
                quizId: q.id,
                score,
                correctCount,
                totalCount,
                passed,
                xpAwarded: passed && !xpAlreadyAwarded,
                levelUnlocked: nextLevelUnlocked,
                submittedAnswers: answers,
            });

            logger.info(`Level quiz submitted: ${levelSlug}, score: ${score}%, passed: ${passed}`);

            return {
                score,
                correctCount,
                totalCount,
                passed,
                passThreshold: q.passThreshold,
                xpAwarded,
                nextLevelUnlocked,
                nextLevelSlug,
                gradedAnswers,
                message: passed
                    ? nextLevelUnlocked
                        ? `Congratulations! You passed and unlocked the ${nextLevelSlug} level!`
                        : 'Congratulations! You passed the quiz.'
                    : `You scored ${score}%. You need ${q.passThreshold}% to pass. Try again!`,
            };
        } catch (error: any) {
            logger.error('Submit level quiz error', { error: error.message, userId, levelSlug });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    // ============================================
    // PROGRESS & GAMIFICATION
    // ============================================

    /**
     * Get full user progress summary
     * GET /api/education/progress
     */
    static async getProgress(userId: string) {
        try {
            logger.info(`Getting education progress for user: ${userId}`);

            const progress = await this.getOrCreateProgress(userId);

            const completedLessons = (progress.completedLessons as string[]) || [];
            const completedModules = (progress.completedModules as string[]) || [];
            const unlockedLevels = (progress.unlockedLevels as string[]) || ['beginner'];

            // Get user badges
            const badges = await db
                .select()
                .from(userBadges)
                .where(eq(userBadges.userId, userId))
                .orderBy(desc(userBadges.earnedAt));

            logger.info(`Progress retrieved for user: ${userId}`);

            return {
                totalXp: progress.totalXp,
                currentLevelSlug: progress.currentLevelSlug,
                streak: progress.streak,
                lastActiveDate: progress.lastActiveDate,
                completedLessonsCount: completedLessons.length,
                completedModulesCount: completedModules.length,
                unlockedLevels,
                badges: badges.map(b => ({
                    slug: b.badgeSlug,
                    name: b.badgeName,
                    description: b.description,
                    earnedAt: b.earnedAt,
                })),
            };
        } catch (error: any) {
            logger.error('Get progress error', { error: error.message, userId });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Get global leaderboard — top users by XP
     * GET /api/education/leaderboard
     */
    static async getLeaderboard(userId: string, limit: number = 10) {
        try {
            logger.info(`Getting leaderboard for user: ${userId}`);

            // Get top users by XP
            const topUsers = await db
                .select({
                    userId: userEducationProgress.userId,
                    totalXp: userEducationProgress.totalXp,
                    currentLevelSlug: userEducationProgress.currentLevelSlug,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    picture: users.picture,
                })
                .from(userEducationProgress)
                .innerJoin(users, eq(users.id, userEducationProgress.userId))
                .orderBy(desc(userEducationProgress.totalXp))
                .limit(limit);

            // Find current user rank
            const allUsers = await db
                .select({ userId: userEducationProgress.userId })
                .from(userEducationProgress)
                .orderBy(desc(userEducationProgress.totalXp));

            const userRank = allUsers.findIndex(u => u.userId === userId) + 1;

            const result = topUsers.map((u, index) => ({
                rank: index + 1,
                userId: u.userId,
                firstName: u.firstName,
                lastName: u.lastName,
                picture: u.picture,
                totalXp: u.totalXp,
                currentLevelSlug: u.currentLevelSlug,
                isCurrentUser: u.userId === userId,
            }));

            logger.info(`Leaderboard retrieved, user rank: ${userRank}`);
            return {
                leaderboard: result,
                userRank,
            };
        } catch (error: any) {
            logger.error('Get leaderboard error', { error: error.message, userId });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Get user badges
     * GET /api/education/badges
     */
    static async getBadges(userId: string) {
        try {
            logger.info(`Getting badges for user: ${userId}`);

            const earned = await db
                .select()
                .from(userBadges)
                .where(eq(userBadges.userId, userId))
                .orderBy(desc(userBadges.earnedAt));

            const earnedSlugs = new Set(earned.map(b => b.badgeSlug));

            // Return all badges with earned/locked status
            const allBadges = BADGE_DEFINITIONS.map(badge => ({
                slug: badge.slug,
                name: badge.name,
                description: badge.description,
                isEarned: earnedSlugs.has(badge.slug),
                earnedAt: earned.find(b => b.badgeSlug === badge.slug)?.earnedAt || null,
            }));

            logger.info(`Retrieved badges for user: ${userId}`);
            return allBadges;
        } catch (error: any) {
            logger.error('Get badges error', { error: error.message, userId });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Get today's daily challenge for user
     * GET /api/education/daily-challenge
     */
    static async getDailyChallenge(userId: string) {
        try {
            logger.info(`Getting daily challenge for user: ${userId}`);

            const today = new Date().toISOString().split('T')[0];

            // Check if challenge exists for today
            const existing = await db
                .select()
                .from(userDailyChallenges)
                .where(
                    and(
                        eq(userDailyChallenges.userId, userId),
                        eq(userDailyChallenges.challengeDate, today)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                return existing[0];
            }

            // Create today's challenge
            const challenges = [
                { title: 'The Bear Market Survival Quiz', description: 'Answer 3 questions about market downturns. Beat the bear!' },
                { title: 'Compound Interest Challenge', description: 'Test your knowledge of compound growth concepts.' },
                { title: 'Portfolio Diversification Quiz', description: 'How well do you understand diversification strategies?' },
                { title: 'Risk & Reward Assessment', description: 'Evaluate your understanding of risk vs return tradeoffs.' },
                { title: 'Stock Market Basics', description: 'Quick fire questions on how stock markets work.' },
                { title: 'Bond Market Fundamentals', description: 'Test your bond market knowledge today.' },
                { title: 'Financial Planning Essentials', description: 'Budgeting, saving, and planning — core skills quiz.' },
            ];

            // Pick a challenge based on day of year to rotate them
            const dayOfYear = Math.floor(
                (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
            );
            const challenge = challenges[dayOfYear % challenges.length];

            const [newChallenge] = await db
                .insert(userDailyChallenges)
                .values({
                    userId,
                    challengeDate: today,
                    title: challenge.title,
                    description: challenge.description,
                    xpReward: XP_REWARDS.DAILY_CHALLENGE,
                    completed: false,
                })
                .returning();

            logger.info(`Daily challenge created for user: ${userId}`);
            return newChallenge;
        } catch (error: any) {
            logger.error('Get daily challenge error', { error: error.message, userId });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }

    /**
     * Complete today's daily challenge — awards XP
     * POST /api/education/daily-challenge/complete
     */
    static async completeDailyChallenge(userId: string) {
        try {
            logger.info(`Completing daily challenge for user: ${userId}`);

            const today = new Date().toISOString().split('T')[0];

            const challenge = await db
                .select()
                .from(userDailyChallenges)
                .where(
                    and(
                        eq(userDailyChallenges.userId, userId),
                        eq(userDailyChallenges.challengeDate, today)
                    )
                )
                .limit(1);

            if (challenge.length === 0) {
                throw ApiError.notFound('No challenge found for today');
            }

            if (challenge[0].completed) {
                return {
                    message: 'Daily challenge already completed',
                    xpAwarded: 0,
                    alreadyCompleted: true,
                };
            }

            // Mark as complete
            await db
                .update(userDailyChallenges)
                .set({
                    completed: true,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(userDailyChallenges.userId, userId),
                        eq(userDailyChallenges.challengeDate, today)
                    )
                );

            // Award XP
            const xpAmount = challenge[0].xpReward;
            await this.awardXp(
                userId,
                xpAmount,
                XP_REASONS.DAILY_CHALLENGE,
                challenge[0].id,
                `Completed daily challenge: ${challenge[0].title}`
            );

            // Check badges
            await this.checkAndAwardBadges(userId);

            logger.info(`Daily challenge completed for user: ${userId}, XP: ${xpAmount}`);

            return {
                message: 'Daily challenge completed!',
                xpAwarded: xpAmount,
                alreadyCompleted: false,
            };
        } catch (error: any) {
            logger.error('Complete daily challenge error', { error: error.message, userId });
            throw error instanceof ApiError ? error : ApiError.internal(error.message);
        }
    }
}

export default EducationService;