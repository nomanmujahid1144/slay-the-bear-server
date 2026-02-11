import { db } from '../db';
import { calculatorHistory } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class CalculatorHistoryService {
  /**
   * Save calculator result to history
   */
  static async saveCalculatorResult(
    userId: string,
    calculatorType: string,
    inputData: any,
    resultData: any
  ): Promise<{ message: string; historyId: string }> {
    try {
      logger.info(`Saving calculator history for user: ${userId}, type: ${calculatorType}`);

      const [newHistory] = await db
        .insert(calculatorHistory)
        .values({
          userId,
          calculatorType,
          inputData,
          resultData,
        })
        .returning();

      logger.info(`Calculator history saved: ${newHistory.id}`);

      return {
        message: 'Calculator result saved successfully',
        historyId: newHistory.id,
      };
    } catch (error: any) {
      logger.error('Save calculator history error', {
        error: error.message,
        userId,
        calculatorType,
      });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get calculator history for user by calculator type
   */
  static async getCalculatorHistory(
    userId: string,
    calculatorType?: string
  ): Promise<any[]> {
    try {
      logger.info(`Fetching calculator history for user: ${userId}, type: ${calculatorType || 'all'}`);

      let query = db
        .select({
          id: calculatorHistory.id,
          calculatorType: calculatorHistory.calculatorType,
          inputData: calculatorHistory.inputData,
          resultData: calculatorHistory.resultData,
          createdAt: calculatorHistory.createdAt,
        })
        .from(calculatorHistory)
        .where(eq(calculatorHistory.userId, userId))
        .orderBy(desc(calculatorHistory.createdAt));

      const history = await query;

      // Filter by calculator type if provided
      const filteredHistory = calculatorType
        ? history.filter((item) => item.calculatorType === calculatorType)
        : history;

      logger.info(`Retrieved ${filteredHistory.length} calculator history records`);

      return filteredHistory;
    } catch (error: any) {
      logger.error('Get calculator history error', {
        error: error.message,
        userId,
        calculatorType,
      });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get single calculator history by ID
   */
  static async getCalculatorHistoryById(
    userId: string,
    historyId: string
  ): Promise<any> {
    try {
      logger.info(`Fetching calculator history: ${historyId} for user: ${userId}`);

      const history = await db
        .select({
          id: calculatorHistory.id,
          calculatorType: calculatorHistory.calculatorType,
          inputData: calculatorHistory.inputData,
          resultData: calculatorHistory.resultData,
          createdAt: calculatorHistory.createdAt,
        })
        .from(calculatorHistory)
        .where(eq(calculatorHistory.id, historyId))
        .limit(1);

      if (history.length === 0) {
        throw ApiError.notFound('Calculator history not found');
      }

      const record = history[0];

      // Verify ownership
      const userRecord = await db
        .select()
        .from(calculatorHistory)
        .where(eq(calculatorHistory.id, historyId))
        .limit(1);

      if (userRecord.length === 0 || userRecord[0].userId !== userId) {
        throw ApiError.forbidden('Access denied');
      }

      logger.info(`Calculator history retrieved: ${historyId}`);

      return record;
    } catch (error: any) {
      logger.error('Get calculator history by ID error', {
        error: error.message,
        userId,
        historyId,
      });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Delete calculator history by ID
   */
  static async deleteCalculatorHistory(
    userId: string,
    historyId: string
  ): Promise<{ message: string }> {
    try {
      logger.info(`Deleting calculator history: ${historyId} for user: ${userId}`);

      // Verify ownership before deleting
      const existing = await db
        .select()
        .from(calculatorHistory)
        .where(eq(calculatorHistory.id, historyId))
        .limit(1);

      if (existing.length === 0) {
        throw ApiError.notFound('Calculator history not found');
      }

      if (existing[0].userId !== userId) {
        throw ApiError.forbidden('Access denied');
      }

      await db
        .delete(calculatorHistory)
        .where(eq(calculatorHistory.id, historyId));

      logger.info(`Calculator history deleted: ${historyId}`);

      return {
        message: 'Calculator history deleted successfully',
      };
    } catch (error: any) {
      logger.error('Delete calculator history error', {
        error: error.message,
        userId,
        historyId,
      });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }
}