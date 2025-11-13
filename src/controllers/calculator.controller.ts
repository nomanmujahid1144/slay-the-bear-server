import { Request, Response } from 'express';
import { CalculatorService } from '../services/calculator.service';
import { bondPriceCalculatorSchema, bondYTMCalculatorSchema, breakEvenCalculatorSchema, budgetCalculatorSchema, cdCalculatorSchema, compoundInterestCalculatorSchema, creditPayoffCalculatorSchema, currencyConverterSchema, debtToIncomeCalculatorSchema, dividendCalculatorSchema, investmentReturnCalculatorSchema, loanAmortizationCalculatorSchema, modifiedDurationCalculatorSchema, mortgageCalculatorSchema, netWorthCalculatorSchema, portfolioOptimizerCalculatorSchema, retirementCalculatorSchema, ruleOf72CalculatorSchema, savingsGoalCalculatorSchema, stockAnalyzerCalculatorSchema } from '../validators/calculator.validator';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';

/**
 * Calculator Controller
 */
export class CalculatorController {

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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
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
                throw ApiError.badRequest('Invalid input data');
            }
            throw error;
        }
    }

    // Premium Tools
    static async analyzeStock(req: Request, res: Response) {
        try {
            const validatedData = stockAnalyzerCalculatorSchema.parse(req);
            const result = await CalculatorService.analyzeStock(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest('Invalid input data');
            }
            if (error instanceof Error) {
                throw ApiError.badRequest(error.message);
            }
            throw error;
        }
    }

    static async optimizePortfolio(req: Request, res: Response) {
        try {
            const validatedData = portfolioOptimizerCalculatorSchema.parse(req);
            const result = await CalculatorService.optimizePortfolio(validatedData.body);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof ZodError) {
                throw ApiError.badRequest('Invalid input data');
            }
            if (error instanceof Error) {
                throw ApiError.badRequest(error.message);
            }
            throw error;
        }
    }
}