import { z } from 'zod';


export const bondPriceCalculatorSchema = z.object({
    body: z.object({
        couponPayment: z
            .number()
            .positive('Coupon payment must be positive'),

        yieldRate: z
            .number()
            .min(0, 'Yield rate cannot be negative')
            .max(100, 'Yield rate cannot exceed 100%'),

        yearsToMaturity: z
            .number()
            .int('Years to maturity must be a whole number')
            .positive('Years to maturity must be positive'),

        faceValue: z
            .number()
            .positive('Face value must be positive'),
    }),
});

export const bondYTMCalculatorSchema = z.object({
    body: z.object({
        bondPrice: z
            .number()
            .positive('Bond price must be positive'),

        faceValue: z
            .number()
            .positive('Face value must be positive'),

        couponRate: z
            .number()
            .min(0, 'Coupon rate cannot be negative')
            .max(100, 'Coupon rate cannot exceed 100%'),

        periodsToMaturity: z
            .number()
            .int('Periods to maturity must be a whole number')
            .positive('Periods to maturity must be positive'),
    }),
});

export const breakEvenCalculatorSchema = z.object({
    body: z.object({
        fixedCosts: z
            .number()
            .nonnegative('Fixed costs cannot be negative'),

        variableCostPerUnit: z
            .number()
            .nonnegative('Variable cost per unit cannot be negative'),

        sellingPricePerUnit: z
            .number()
            .positive('Selling price per unit must be positive'),
    }),
});

export const budgetCalculatorSchema = z.object({
    body: z.object({
        income: z
            .number()
            .positive('Monthly income must be positive'),

        expenses: z.array(
            z.object({
                category: z.string().min(1, 'Category is required'),
                amount: z.number().positive('Expense amount must be positive'),
            })
        ).min(0, 'Expenses array is required'),
    }),
});


export const cdCalculatorSchema = z.object({
    body: z.object({
        principal: z
            .number()
            .positive('Principal amount must be positive'),

        annualInterestRate: z
            .number()
            .min(0, 'Interest rate cannot be negative')
            .max(100, 'Interest rate cannot exceed 100%'),

        timePeriod: z
            .number()
            .positive('Time period must be positive'),

        compoundingFrequency: z.enum(['annually', 'semiannually', 'quarterly', 'monthly', 'daily'], {
            message: 'Invalid compounding frequency',
        }),
    }),
});

export const compoundInterestCalculatorSchema = z.object({
    body: z.object({
        principal: z
            .number()
            .positive('Principal amount must be positive'),

        interestRate: z
            .number()
            .min(0, 'Interest rate cannot be negative')
            .max(100, 'Interest rate cannot exceed 100%'),

        compoundingFrequency: z
            .number()
            .int('Compounding frequency must be a whole number')
            .positive('Compounding frequency must be positive'),

        timePeriod: z
            .number()
            .positive('Time period must be positive'),
    }),
});

export const creditPayoffCalculatorSchema = z.object({
    body: z.object({
        balance: z
            .number()
            .positive('Credit card balance must be positive'),

        interestRate: z
            .number()
            .min(0, 'Interest rate cannot be negative')
            .max(100, 'Interest rate cannot exceed 100%'),

        monthlyPayment: z
            .number()
            .positive('Monthly payment must be positive'),
    }),
});

export const currencyConverterSchema = z.object({
    body: z.object({
        amount: z
            .number()
            .positive('Amount must be positive'),

        fromCurrency: z
            .string()
            .length(3, 'Currency code must be 3 characters')
            .toUpperCase(),

        toCurrency: z
            .string()
            .length(3, 'Currency code must be 3 characters')
            .toUpperCase(),
    }),
});

export const debtToIncomeCalculatorSchema = z.object({
    body: z.object({
        debtPayments: z
            .number()
            .positive('Monthly debt payments must be positive'),

        monthlyIncome: z
            .number()
            .positive('Monthly income must be positive'),
    }),
});


export const dividendCalculatorSchema = z.object({
    body: z.object({
        numShares: z
            .number()
            .positive('Number of shares must be positive'),

        annualDividend: z
            .number()
            .nonnegative('Annual dividend cannot be negative'),

        timePeriod: z
            .number()
            .positive('Time period must be positive'),
    }),
});

export const investmentReturnCalculatorSchema = z.object({
    body: z.object({
        initialInvestment: z
            .number()
            .positive('Initial investment must be positive'),

        annualReturnRate: z
            .number()
            .min(-100, 'Return rate cannot be less than -100%')
            .max(1000, 'Return rate cannot exceed 1000%'),

        investmentYears: z
            .number()
            .int('Investment period must be a whole number')
            .positive('Investment period must be positive'),
    }),
});

export const loanAmortizationCalculatorSchema = z.object({
    body: z.object({
        principal: z
            .number()
            .positive('Loan amount must be positive'),

        annualInterestRate: z
            .number()
            .min(0, 'Interest rate cannot be negative')
            .max(100, 'Interest rate cannot exceed 100%'),

        loanTerm: z
            .number()
            .positive('Loan term must be positive'),

        extraPayment: z
            .number()
            .nonnegative('Extra payment cannot be negative')
            .optional()
            .default(0),

        loanTermType: z
            .enum(['years', 'months'], {
                message: 'Loan term type must be either "years" or "months"',
            }),
    }),
});

export const modifiedDurationCalculatorSchema = z.object({
    body: z.object({
        bondPrice: z
            .number()
            .positive('Bond price must be positive'),

        faceValue: z
            .number()
            .positive('Face value must be positive'),

        couponRate: z
            .number()
            .min(0, 'Coupon rate cannot be negative')
            .max(100, 'Coupon rate cannot exceed 100%'),

        yieldRate: z
            .number()
            .min(-10, 'Yield rate cannot be less than -10%')
            .max(100, 'Yield rate cannot exceed 100%'),

        periodsPerYear: z
            .number()
            .refine((val) => [1, 2, 4].includes(val), {
                message: 'Periods per year must be 1 (annual), 2 (semi-annual), or 4 (quarterly)',
            }),
    }),
});

export const mortgageCalculatorSchema = z.object({
  body: z.object({
    loanAmount: z
      .number()
      .positive('Loan amount must be positive'),

    interestRate: z
      .number()
      .min(0, 'Interest rate cannot be negative')
      .max(100, 'Interest rate cannot exceed 100%'),

    loanTerm: z
      .number()
      .positive('Loan term must be positive'),

    paymentType: z
      .enum(['years', 'months'], {
        message: 'Payment type must be either "years" or "months"',
      }),
  }),
});

export const netWorthCalculatorSchema = z.object({
  body: z.object({
    assets: z
      .number()
      .nonnegative('Total assets cannot be negative'),

    liabilities: z
      .number()
      .nonnegative('Total liabilities cannot be negative'),
  }),
});

export const retirementCalculatorSchema = z.object({
  body: z.object({
    currentAge: z
      .number()
      .int('Current age must be a whole number')
      .min(18, 'Current age must be at least 18')
      .max(100, 'Current age cannot exceed 100'),

    retirementAge: z
      .number()
      .int('Retirement age must be a whole number')
      .min(18, 'Retirement age must be at least 18')
      .max(100, 'Retirement age cannot exceed 100'),

    currentSavings: z
      .number()
      .nonnegative('Current savings cannot be negative'),

    annualContributions: z
      .number()
      .nonnegative('Annual contributions cannot be negative'),

    expectedRateOfReturn: z
      .number()
      .min(-50, 'Rate of return cannot be less than -50%')
      .max(100, 'Rate of return cannot exceed 100%'),
  }).refine((data) => data.retirementAge > data.currentAge, {
    message: 'Retirement age must be greater than current age',
    path: ['retirementAge'],
  }),
});

export const ruleOf72CalculatorSchema = z.object({
  body: z.object({
    annualRate: z
      .number()
      .positive('Annual interest rate must be positive')
      .max(100, 'Annual interest rate cannot exceed 100%'),
  }),
});

export const savingsGoalCalculatorSchema = z.object({
  body: z.object({
    savingsGoal: z
      .number()
      .positive('Savings goal must be positive'),

    currentSavings: z
      .number()
      .nonnegative('Current savings cannot be negative'),

    timeFrame: z
      .number()
      .positive('Time frame must be positive'),
  }),
});


// Premium Tools

export const stockAnalyzerCalculatorSchema = z.object({
  body: z.object({
    symbol: z
      .string()
      .min(1, 'Stock symbol is required')
      .max(10, 'Stock symbol too long')
      .toUpperCase(),

    term: z
      .enum(['Short Term', 'Long Term'], {
        message: 'Term must be either "Short Term" or "Long Term"',
      }),
  }),
});

export const portfolioOptimizerCalculatorSchema = z.object({
  body: z.object({
    symbols: z
      .array(z.object({
        symbol: z.string().min(1).max(10).toUpperCase(),
        name: z.string().optional(),
      }))
      .min(2, 'At least 2 symbols required for diversification')
      .max(10, 'Maximum 10 symbols allowed'),

    investmentAmount: z
      .number()
      .positive('Investment amount must be positive'),

    targetReturn: z
      .number()
      .min(0.01, 'Target return must be at least 1%')
      .max(1, 'Target return cannot exceed 100%'),

    riskFreeRate: z
      .number()
      .min(0.01, 'Risk-free rate must be at least 1%')
      .max(0.15, 'Risk-free rate cannot exceed 15%'),
  }),
});


export type BondPriceCalculatorInput = z.infer<typeof bondPriceCalculatorSchema>['body'];
export type BondYTMCalculatorInput = z.infer<typeof bondYTMCalculatorSchema>['body'];
export type BreakEvenCalculatorInput = z.infer<typeof breakEvenCalculatorSchema>['body'];
export type BudgetCalculatorInput = z.infer<typeof budgetCalculatorSchema>['body'];
export type CDCalculatorInput = z.infer<typeof cdCalculatorSchema>['body'];
export type CompoundInterestCalculatorInput = z.infer<typeof compoundInterestCalculatorSchema>['body'];
export type CreditPayoffCalculatorInput = z.infer<typeof creditPayoffCalculatorSchema>['body'];
export type CurrencyConverterInput = z.infer<typeof currencyConverterSchema>['body'];
export type DebtToIncomeCalculatorInput = z.infer<typeof debtToIncomeCalculatorSchema>['body'];
export type DividendCalculatorInput = z.infer<typeof dividendCalculatorSchema>['body'];
export type InvestmentReturnCalculatorInput = z.infer<typeof investmentReturnCalculatorSchema>['body'];
export type LoanAmortizationCalculatorInput = z.infer<typeof loanAmortizationCalculatorSchema>['body'];
export type ModifiedDurationCalculatorInput = z.infer<typeof modifiedDurationCalculatorSchema>['body'];
export type MortgageCalculatorInput = z.infer<typeof mortgageCalculatorSchema>['body'];
export type NetWorthCalculatorInput = z.infer<typeof netWorthCalculatorSchema>['body'];
export type RetirementCalculatorInput = z.infer<typeof retirementCalculatorSchema>['body'];
export type RuleOf72CalculatorInput = z.infer<typeof ruleOf72CalculatorSchema>['body'];
export type SavingsGoalCalculatorInput = z.infer<typeof savingsGoalCalculatorSchema>['body'];

// Premium Tools
export type StockAnalyzerCalculatorInput = z.infer<typeof stockAnalyzerCalculatorSchema>['body'];
export type PortfolioOptimizerCalculatorInput = z.infer<typeof portfolioOptimizerCalculatorSchema>['body'];