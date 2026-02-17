import { NextFunction, Request, Response } from 'express';
import { CalculatorService } from '../services/calculator.service';
import { bondPriceCalculatorSchema, bondYTMCalculatorSchema, breakEvenCalculatorSchema, budgetCalculatorSchema, cdCalculatorSchema, compoundInterestCalculatorSchema, creditPayoffCalculatorSchema, currencyConverterSchema, debtToIncomeCalculatorSchema, dividendCalculatorSchema, investmentReturnCalculatorSchema, loanAmortizationCalculatorSchema, modifiedDurationCalculatorSchema, mortgageCalculatorSchema, netWorthCalculatorSchema, portfolioOptimizerCalculatorSchema, retirementCalculatorSchema, ruleOf72CalculatorSchema, savingsGoalCalculatorSchema, stockAnalyzerCalculatorSchema } from '../validators/calculator.validator';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';
import { CalculatorHistoryService } from '../services/calculator-history.service';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { ApiResponseUtil } from '../utils/ApiResponse';

/**
 * Calculator Controller
 */
export class CalculatorController {

    private static getZodError(error: ZodError): string {
        return error.issues[0]?.message || 'Invalid input data';
    }
    
    static async calculateBondPrice(req: Request, res: Response) {
        try {
            // Validate request (schema includes body wrapper)
            const validatedData = bondPriceCalculatorSchema.parse(req);

            // Calculate bond price
            const result = CalculatorService.calculateBondPrice(validatedData.body);

            // Send response
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            // Handle Zod validation errors
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateBondYTM(req: Request, res: Response) {
        try {
            // Validate request (schema includes body wrapper)
            const validatedData = bondYTMCalculatorSchema.parse(req);

            // Calculate bond YTM using validated body data
            const result = CalculatorService.calculateBondYTM(validatedData.body);

            // Send response
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            // Handle Zod validation errors
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateBreakEven(req: Request, res: Response) {
        try {
            const validatedData = breakEvenCalculatorSchema.parse(req);
            const result = CalculatorService.calculateBreakEven(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            if (error instanceof Error) {
                throw ApiError.badRequest(error.message);
            }
            throw error;
        }
    }

    static async calculateBudget(req: Request, res: Response) {
        try {
            const validatedData = budgetCalculatorSchema.parse(req);
            const result = CalculatorService.calculateBudget(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateCD(req: Request, res: Response) {
        try {
            const validatedData = cdCalculatorSchema.parse(req);
            const result = CalculatorService.calculateCD(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateCompoundInterest(req: Request, res: Response) {
        try {
            const validatedData = compoundInterestCalculatorSchema.parse(req);
            const result = CalculatorService.calculateCompoundInterest(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateCreditPayoff(req: Request, res: Response) {
        try {
            const validatedData = creditPayoffCalculatorSchema.parse(req);
            const result = CalculatorService.calculateCreditPayoff(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            if (error instanceof Error) {
                throw ApiError.badRequest(error.message);
            }
            throw error;
        }
    }

    static async convertCurrency(req: Request, res: Response) {
        try {
            const validatedData = currencyConverterSchema.parse(req);
            const result = await CalculatorService.convertCurrency(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            if (error instanceof Error) {
                throw ApiError.badRequest(error.message);
            }
            throw error;
        }
    }

    static async calculateDebtToIncome(req: Request, res: Response) {
        try {
            const validatedData = debtToIncomeCalculatorSchema.parse(req);
            const result = CalculatorService.calculateDebtToIncome(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateDividend(req: Request, res: Response) {
        try {
            const validatedData = dividendCalculatorSchema.parse(req);
            const result = CalculatorService.calculateDividend(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateInvestmentReturn(req: Request, res: Response) {
        try {
            const validatedData = investmentReturnCalculatorSchema.parse(req);
            const result = CalculatorService.calculateInvestmentReturn(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateLoanAmortization(req: Request, res: Response) {
        try {
            const validatedData = loanAmortizationCalculatorSchema.parse(req);
            const result = CalculatorService.calculateLoanAmortization(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateModifiedDuration(req: Request, res: Response) {
        try {
            const validatedData = modifiedDurationCalculatorSchema.parse(req);
            const result = CalculatorService.calculateModifiedDuration(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateMortgage(req: Request, res: Response) {
        try {
            const validatedData = mortgageCalculatorSchema.parse(req);
            const result = CalculatorService.calculateMortgage(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateNetWorth(req: Request, res: Response) {
        try {
            const validatedData = netWorthCalculatorSchema.parse(req);
            const result = CalculatorService.calculateNetWorth(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateRetirement(req: Request, res: Response) {
        try {
            const validatedData = retirementCalculatorSchema.parse(req);
            const result = CalculatorService.calculateRetirement(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateRuleOf72(req: Request, res: Response) {
        try {
            const validatedData = ruleOf72CalculatorSchema.parse(req);
            const result = CalculatorService.calculateRuleOf72(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    static async calculateSavingsGoal(req: Request, res: Response) {
        try {
            const validatedData = savingsGoalCalculatorSchema.parse(req);
            const result = CalculatorService.calculateSavingsGoal(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest(CalculatorController.getZodError(error));
            }
            throw error;
        }
    }

    // Premium Tools
    static async analyzeStock(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            console.log(userId, 'userId')

            if (!userId) {
                throw new Error('User ID not found in request');
            }

            // Validate input
            const validatedData = stockAnalyzerCalculatorSchema.parse(req);
            const inputData = validatedData.body;

            console.log(inputData, 'inputData')

            logger.info(`Stock analyzer request for user: ${userId}, symbol: ${inputData.symbol}`);

            // Calculate result
            const result = await CalculatorService.analyzeStock(inputData);

            // Save to history
            await CalculatorHistoryService.saveCalculatorResult(
                userId,
                'stock-analyzer',
                inputData,
                result
            );

            logger.info(`Stock analysis completed and saved for user: ${userId}`);

            return ApiResponseUtil.success(
                res,
                result,
                'Stock analysis completed successfully',
                200
            );
        } catch (error) {
            if (error instanceof ZodError) {
                return next(ApiError.badRequest(CalculatorController.getZodError(error)));
            }
            if (error instanceof Error) {
                console.log(error, 'error')
                return next(ApiError.badRequest(error.message));
            }
            next(error);
        }
    }

    static async optimizePortfolio(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                throw new Error('User ID not found in request');
            }

            // Validate input
            const validatedData = portfolioOptimizerCalculatorSchema.parse(req);
            const inputData = validatedData.body;

            logger.info(`Portfolio optimizer request for user: ${userId}`);

            // Calculate result
            const result = await CalculatorService.optimizePortfolio(inputData);

            // Save to history
            await CalculatorHistoryService.saveCalculatorResult(
                userId,
                'portfolio-optimizer',
                inputData,
                result
            );

            logger.info(`Portfolio optimization completed and saved for user: ${userId}`);

            return ApiResponseUtil.success(
                res,
                result,
                'Portfolio optimization completed successfully',
                200
            );
        } catch (error) {
            if (error instanceof ZodError) {
                return next(ApiError.badRequest(CalculatorController.getZodError(error)));
            }
            if (error instanceof Error) {
                return next(ApiError.badRequest(error.message));
            }
            next(error);
        }
    }

    static async getCalculatorHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { type } = req.query; // Optional: filter by calculator type

            console.log(type)

            if (!userId) {
                throw new Error('User ID not found in request');
            }

            logger.info(`Calculator history request for user: ${userId}, type: ${type || 'all'}`);

            const history = await CalculatorHistoryService.getCalculatorHistory(
                userId,
                type as string | undefined
            );

            return ApiResponseUtil.success(
                res,
                history,
                'Calculator history retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    static async getCalculatorHistoryById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { historyId } = req.params;

            if (!userId) {
                throw new Error('User ID not found in request');
            }

            logger.info(`Get calculator history by ID: ${historyId} for user: ${userId}`);

            const history = await CalculatorHistoryService.getCalculatorHistoryById(
                userId,
                historyId
            );

            return ApiResponseUtil.success(
                res,
                history,
                'Calculator history retrieved successfully',
                200
            );
        } catch (error) {
            next(error);
        }
    }

    static async deleteCalculatorHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { historyId } = req.params;

            if (!userId) {
                throw new Error('User ID not found in request');
            }

            logger.info(`Delete calculator history: ${historyId} for user: ${userId}`);

            const result = await CalculatorHistoryService.deleteCalculatorHistory(
                userId,
                historyId
            );

            return ApiResponseUtil.success(
                res,
                undefined,
                result.message,
                200
            );
        } catch (error) {
            next(error);
        }
    }


}