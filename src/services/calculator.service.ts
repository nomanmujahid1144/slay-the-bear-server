import axios from 'axios';
import config from '../config'
import alpha from 'alphavantage'
import { mean, multiply, sum, sqrt, MathType } from 'mathjs';
import { BondPriceCalculatorInput, BondYTMCalculatorInput, BreakEvenCalculatorInput, BudgetCalculatorInput, CDCalculatorInput, CompoundInterestCalculatorInput, CreditPayoffCalculatorInput, CurrencyConverterInput, DebtToIncomeCalculatorInput, DividendCalculatorInput, InvestmentReturnCalculatorInput, LoanAmortizationCalculatorInput, ModifiedDurationCalculatorInput, MortgageCalculatorInput, NetWorthCalculatorInput, PortfolioOptimizerCalculatorInput, RetirementCalculatorInput, RuleOf72CalculatorInput, SavingsGoalCalculatorInput, StockAnalyzerCalculatorInput } from '../validators/calculator.validator';

/**
 * Bond Price Calculator Service
 */
export class CalculatorService {
  /**
   * Calculate Bond Price
   * 
   * Formula:
   * Bond Price = PV(Coupons) + PV(Face Value)
   * 
   * Where:
   * - PV(Coupons) = Σ(Coupon / (1 + r)^t) for t = 1 to n
   * - PV(Face Value) = Face Value / (1 + r)^n
   * - r = yield rate (as decimal)
   * - n = years to maturity
   */
  static calculateBondPrice(input: BondPriceCalculatorInput) {
    const { couponPayment, yieldRate, yearsToMaturity, faceValue } = input;

    // Convert yield rate from percentage to decimal
    const yieldRateDecimal = yieldRate / 100;

    // Calculate the present value of coupon payments
    let presentValueCoupons = 0;
    for (let t = 1; t <= yearsToMaturity; t++) {
      presentValueCoupons += couponPayment / Math.pow(1 + yieldRateDecimal, t);
    }

    // Calculate the present value of the face value (principal)
    const presentValueFaceValue = faceValue / Math.pow(1 + yieldRateDecimal, yearsToMaturity);

    // Total bond price is the sum of the present values
    const bondPrice = presentValueCoupons + presentValueFaceValue;

    return {
      bondPrice: parseFloat(bondPrice.toFixed(2)),
      breakdown: {
        presentValueOfCoupons: parseFloat(presentValueCoupons.toFixed(2)),
        presentValueOfFaceValue: parseFloat(presentValueFaceValue.toFixed(2)),
        totalBondPrice: parseFloat(bondPrice.toFixed(2)),
      },
      inputs: {
        couponPayment,
        yieldRate,
        yearsToMaturity,
        faceValue,
      },
      message: `The bond's price today, based on the present value of its future payments, is $${bondPrice.toFixed(2)}.`,
    };
  }


  /**
   * Calculate Bond Yield to Maturity (YTM)
   * 
   * Formula (Approximation):
   * YTM ≈ (Coupon Payment + (Face Value - Price) / Periods) / ((Price + Face Value) / 2)
   * 
   * Where:
   * - Coupon Payment = Coupon Rate × Face Value
   * - This is an approximation formula, not the exact IRR calculation
   */
  static calculateBondYTM(input: BondYTMCalculatorInput) {
    const { bondPrice, faceValue, couponRate, periodsToMaturity } = input;

    // Convert coupon rate from percentage to decimal
    const couponRateDecimal = couponRate / 100;

    // Calculate coupon payment
    const couponPayment = couponRateDecimal * faceValue;

    // Approximation Formula for YTM
    const annualYield =
      (couponPayment + (faceValue - bondPrice) / periodsToMaturity) /
      ((bondPrice + faceValue) / 2);

    // Convert to percentage
    const ytmPercentage = annualYield * 100;

    return {
      ytm: parseFloat(ytmPercentage.toFixed(2)),
      breakdown: {
        couponPayment: parseFloat(couponPayment.toFixed(2)),
        capitalGainPerPeriod: parseFloat(((faceValue - bondPrice) / periodsToMaturity).toFixed(2)),
        averagePrice: parseFloat(((bondPrice + faceValue) / 2).toFixed(2)),
        ytmPercentage: parseFloat(ytmPercentage.toFixed(2)),
      },
      inputs: {
        bondPrice,
        faceValue,
        couponRate,
        periodsToMaturity,
      },
      message: `The YTM represents the annualized return you can expect to earn if you hold the bond to maturity. In this case, it is ${ytmPercentage.toFixed(2)}%.`,
    };
  }

  /**
  * Calculate Break-Even Point
  * 
  * Formula:
  * Break-Even Units = Fixed Costs / (Selling Price - Variable Cost)
  */
  static calculateBreakEven(input: BreakEvenCalculatorInput) {
    const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = input;

    // Calculate contribution margin per unit
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;

    // Validate selling price > variable cost
    if (contributionMargin <= 0) {
      throw new Error('Selling price must be greater than variable cost per unit');
    }

    // Calculate break-even point
    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenUnitsCeil = Math.ceil(breakEvenUnits);

    // Calculate revenue and costs at break-even
    const breakEvenRevenue = breakEvenUnitsCeil * sellingPricePerUnit;
    const totalVariableCosts = breakEvenUnitsCeil * variableCostPerUnit;
    const totalCosts = fixedCosts + totalVariableCosts;

    return {
      breakEvenUnits: breakEvenUnitsCeil,
      breakdown: {
        contributionMarginPerUnit: parseFloat(contributionMargin.toFixed(2)),
        breakEvenRevenue: parseFloat(breakEvenRevenue.toFixed(2)),
        totalFixedCosts: parseFloat(fixedCosts.toFixed(2)),
        totalVariableCosts: parseFloat(totalVariableCosts.toFixed(2)),
        totalCosts: parseFloat(totalCosts.toFixed(2)),
      },
      inputs: {
        fixedCosts,
        variableCostPerUnit,
        sellingPricePerUnit,
      },
      message: `You need to sell approximately ${breakEvenUnitsCeil} units to cover your costs.`,
    };
  }


  static calculateBudget(input: BudgetCalculatorInput) {
    const { income, expenses } = input;

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate remaining budget
    const remainingBudget = income - totalExpenses;

    // Calculate percentage spent
    const percentageSpent = (totalExpenses / income) * 100;

    // Breakdown by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      remainingBudget: parseFloat(remainingBudget.toFixed(2)),
      breakdown: {
        totalIncome: parseFloat(income.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        percentageSpent: parseFloat(percentageSpent.toFixed(2)),
        percentageRemaining: parseFloat((100 - percentageSpent).toFixed(2)),
        expensesByCategory,
      },
      inputs: {
        income,
        expenses,
      },
      message: `Remaining Budget: $${remainingBudget.toFixed(2)}`,
    };
  }

  static calculateCD(input: CDCalculatorInput) {
    const { principal, annualInterestRate, timePeriod, compoundingFrequency } = input;

    // Convert interest rate to decimal
    const r = annualInterestRate / 100;

    // Determine compounding frequency per year
    const frequencyMap: Record<string, number> = {
      daily: 365,
      monthly: 12,
      quarterly: 4,
      semiannually: 2,
      annually: 1,
    };

    const n = frequencyMap[compoundingFrequency];

    // Calculate future value: FV = P * (1 + r/n)^(nt)
    const futureValue = principal * Math.pow(1 + r / n, n * timePeriod);

    // Calculate total interest earned
    const totalInterest = futureValue - principal;

    return {
      futureValue: parseFloat(futureValue.toFixed(2)),
      breakdown: {
        principalAmount: parseFloat(principal.toFixed(2)),
        totalInterestEarned: parseFloat(totalInterest.toFixed(2)),
        effectiveRate: parseFloat(((Math.pow(1 + r / n, n) - 1) * 100).toFixed(2)),
        compoundingPeriodsPerYear: n,
        totalCompoundingPeriods: n * timePeriod,
      },
      inputs: {
        principal,
        annualInterestRate,
        timePeriod,
        compoundingFrequency,
      },
      message: `Future Value of CD: $${futureValue.toFixed(2)}`,
    };
  }

  static calculateCompoundInterest(input: CompoundInterestCalculatorInput) {
    const { principal, interestRate, compoundingFrequency, timePeriod } = input;

    // Convert interest rate to decimal
    const rate = interestRate / 100;

    // Calculate future value: FV = P * (1 + r/n)^(nt)
    const futureValue = principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * timePeriod);

    // Calculate total interest earned
    const totalInterest = futureValue - principal;

    return {
      futureValue: parseFloat(futureValue.toFixed(2)),
      breakdown: {
        principalAmount: parseFloat(principal.toFixed(2)),
        totalInterestEarned: parseFloat(totalInterest.toFixed(2)),
        effectiveAnnualRate: parseFloat(((Math.pow(1 + rate / compoundingFrequency, compoundingFrequency) - 1) * 100).toFixed(2)),
        totalCompoundingPeriods: compoundingFrequency * timePeriod,
      },
      inputs: {
        principal,
        interestRate,
        compoundingFrequency,
        timePeriod,
      },
      message: `Future Value: $${futureValue.toFixed(2)}`,
    };
  }

  static calculateCreditPayoff(input: CreditPayoffCalculatorInput) {
    const { balance, interestRate, monthlyPayment } = input;

    // Convert annual rate to monthly rate
    const monthlyInterestRate = interestRate / 12 / 100;

    // Check if payment covers minimum interest
    const minimumPayment = balance * monthlyInterestRate;
    if (monthlyPayment <= minimumPayment) {
      throw new Error('Monthly payment must be greater than the minimum interest payment to pay off the debt');
    }

    // Calculate months to payoff: log(P / (P - B*r)) / log(1 + r)
    const months = Math.log(monthlyPayment / (monthlyPayment - balance * monthlyInterestRate)) / Math.log(1 + monthlyInterestRate);

    const monthsToPayoff = Math.ceil(months);
    const totalPaid = monthlyPayment * monthsToPayoff;
    const totalInterest = totalPaid - balance;

    return {
      monthsToPayoff,
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      breakdown: {
        originalBalance: parseFloat(balance.toFixed(2)),
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        totalAmountPaid: parseFloat(totalPaid.toFixed(2)),
        totalInterestPaid: parseFloat(totalInterest.toFixed(2)),
        monthlyInterestRate: parseFloat((monthlyInterestRate * 100).toFixed(4)),
      },
      inputs: {
        balance,
        interestRate,
        monthlyPayment,
      },
      message: `It will take ${monthsToPayoff} months to pay off the debt. Total interest paid will be: $${totalInterest.toFixed(2)}`,
    };
  }

  static async convertCurrency(input: CurrencyConverterInput) {
    const { amount, fromCurrency, toCurrency } = input;

    try {
      // Call Alpha Vantage API
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${config.ALPHA_VANTAGE_API_KEY}`
      );

      // Check for API error
      if (response.data['Error Message']) {
        throw new Error('Error fetching exchange rates from API');
      }

      // Check if exchange rate exists
      if (!response.data['Realtime Currency Exchange Rate']) {
        throw new Error('Invalid currency pair or API response');
      }

      const exchangeRate = parseFloat(response.data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
      const convertedAmount = amount * exchangeRate;

      return {
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        exchangeRate: parseFloat(exchangeRate.toFixed(6)),
        breakdown: {
          originalAmount: parseFloat(amount.toFixed(2)),
          fromCurrency,
          toCurrency,
          rate: parseFloat(exchangeRate.toFixed(6)),
        },
        inputs: {
          amount,
          fromCurrency,
          toCurrency,
        },
        message: `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error('Failed to fetch exchange rates. Please try again later.');
      }
      throw error;
    }
  }

  static calculateDebtToIncome(input: DebtToIncomeCalculatorInput) {
    const { debtPayments, monthlyIncome } = input;

    // Calculate DTI ratio
    const dtir = (debtPayments / monthlyIncome) * 100;

    // Determine assessment
    let assessment: string;
    if (dtir <= 36) {
      assessment = 'Excellent - You have a healthy debt-to-income ratio.';
    } else if (dtir <= 43) {
      assessment = 'Good - Your ratio is manageable but could be improved.';
    } else if (dtir <= 50) {
      assessment = 'Fair - You may face difficulty obtaining credit.';
    } else {
      assessment = 'Poor - Consider reducing your debt or increasing your income.';
    }

    return {
      dtir: parseFloat(dtir.toFixed(2)),
      assessment,
      breakdown: {
        totalMonthlyDebt: parseFloat(debtPayments.toFixed(2)),
        grossMonthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
        remainingIncome: parseFloat((monthlyIncome - debtPayments).toFixed(2)),
        debtPercentage: parseFloat(dtir.toFixed(2)),
      },
      inputs: {
        debtPayments,
        monthlyIncome,
      },
      message: `Your Debt-to-Income Ratio is: ${dtir.toFixed(2)}%`,
    };
  }

  static calculateDividend(input: DividendCalculatorInput) {
    const { numShares, annualDividend, timePeriod } = input;

    // Calculate total dividend income
    const totalDividendIncome = numShares * annualDividend * timePeriod;

    // Calculate per year and per share breakdown
    const annualIncome = numShares * annualDividend;

    return {
      totalDividendIncome: parseFloat(totalDividendIncome.toFixed(2)),
      breakdown: {
        numberOfShares: numShares,
        annualDividendPerShare: parseFloat(annualDividend.toFixed(2)),
        annualIncome: parseFloat(annualIncome.toFixed(2)),
        timePeriodYears: timePeriod,
        totalIncome: parseFloat(totalDividendIncome.toFixed(2)),
      },
      inputs: {
        numShares,
        annualDividend,
        timePeriod,
      },
      message: `Total Dividend Income: $${totalDividendIncome.toFixed(2)}`,
    };
  }

  static calculateInvestmentReturn(input: InvestmentReturnCalculatorInput) {
    const { initialInvestment, annualReturnRate, investmentYears } = input;

    // Convert percentage to decimal
    const rate = annualReturnRate / 100;

    // Calculate future value: FV = P * (1 + r)^t
    const futureValue = initialInvestment * Math.pow(1 + rate, investmentYears);

    // Calculate total return and gain
    const totalReturn = futureValue - initialInvestment;
    const returnPercentage = (totalReturn / initialInvestment) * 100;

    return {
      futureValue: parseFloat(futureValue.toFixed(2)),
      breakdown: {
        initialInvestment: parseFloat(initialInvestment.toFixed(2)),
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        returnPercentage: parseFloat(returnPercentage.toFixed(2)),
        annualReturnRate: parseFloat(annualReturnRate.toFixed(2)),
        investmentPeriod: investmentYears,
      },
      inputs: {
        initialInvestment,
        annualReturnRate,
        investmentYears,
      },
      message: `Future Value of Investment: $${futureValue.toFixed(2)}`,
    };
  }

  static calculateLoanAmortization(input: LoanAmortizationCalculatorInput) {
    const { principal, annualInterestRate, loanTerm, extraPayment = 0, loanTermType } = input;

    // Convert to months
    const totalPayments = loanTermType === 'years' ? loanTerm * 12 : loanTerm;
    const monthlyInterestRate = (annualInterestRate / 100) / 12;

    // Calculate base monthly payment
    const baseMonthlyPayment = (principal * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));

    let balance = principal;
    const amortizationSchedule = [];
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let i = 1; i <= totalPayments; i++) {
      const interestPayment = balance * monthlyInterestRate;
      const principalPayment = baseMonthlyPayment + extraPayment - interestPayment;
      balance -= principalPayment;

      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;

      amortizationSchedule.push({
        month: i,
        principalPayment: parseFloat(principalPayment.toFixed(2)),
        interestPayment: parseFloat(interestPayment.toFixed(2)),
        balance: parseFloat(Math.max(balance, 0).toFixed(2)),
      });

      if (balance <= 0) break;
    }

    return {
      amortizationSchedule,
      summary: {
        totalPayments: amortizationSchedule.length,
        baseMonthlyPayment: parseFloat(baseMonthlyPayment.toFixed(2)),
        totalMonthlyPayment: parseFloat((baseMonthlyPayment + extraPayment).toFixed(2)),
        totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
        totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)),
        totalAmountPaid: parseFloat((totalInterestPaid + totalPrincipalPaid).toFixed(2)),
      },
      inputs: {
        principal,
        annualInterestRate,
        loanTerm,
        extraPayment,
        loanTermType,
      },
      message: `Loan will be paid off in ${amortizationSchedule.length} months`,
    };
  }

  static calculateModifiedDuration(input: ModifiedDurationCalculatorInput) {
    const { bondPrice, faceValue, couponRate, yieldRate, periodsPerYear } = input;

    // Convert percentages to decimals
    const couponRateDecimal = couponRate / 100;
    const yieldRateDecimal = yieldRate / 100;

    // Calculate Macaulay Duration
    let macaulayDuration = 0;
    let totalPresentValue = 0;

    for (let t = 1; t <= periodsPerYear; t++) {
      // Coupon payment per period
      const couponPayment = (couponRateDecimal * faceValue) / periodsPerYear;

      // Present value of coupon payment at time t
      const presentValueOfCoupon = couponPayment / Math.pow(1 + yieldRateDecimal / periodsPerYear, t);
      macaulayDuration += t * presentValueOfCoupon;
      totalPresentValue += presentValueOfCoupon;
    }

    // Present value of face value at maturity
    const presentValueOfFaceValue = faceValue / Math.pow(1 + yieldRateDecimal / periodsPerYear, periodsPerYear);
    macaulayDuration += periodsPerYear * presentValueOfFaceValue;
    totalPresentValue += presentValueOfFaceValue;

    // Final Macaulay Duration (in periods)
    const macaulayDurationValue = macaulayDuration / totalPresentValue;

    // Calculate Modified Duration
    const modifiedDurationValue = macaulayDurationValue / (1 + yieldRateDecimal / periodsPerYear);

    return {
      modifiedDuration: parseFloat(modifiedDurationValue.toFixed(2)),
      breakdown: {
        macaulayDuration: parseFloat(macaulayDurationValue.toFixed(2)),
        bondPrice: parseFloat(bondPrice.toFixed(2)),
        faceValue: parseFloat(faceValue.toFixed(2)),
        periodsPerYear,
      },
      inputs: {
        bondPrice,
        faceValue,
        couponRate,
        yieldRate,
        periodsPerYear,
      },
      message: `Modified Duration: ${modifiedDurationValue.toFixed(2)}. For every 1% change in interest rates, the bond's price will change by approximately ${modifiedDurationValue.toFixed(2)}%.`,
    };
  }

  static calculateMortgage(input: MortgageCalculatorInput) {
    const { loanAmount, interestRate, loanTerm, paymentType } = input;

    // Convert to months
    const totalPayments = paymentType === 'years' ? loanTerm * 12 : loanTerm;

    // Convert annual interest rate to monthly
    const monthlyInterestRate = (interestRate / 100) / 12;

    // Calculate monthly payment: M = P * [r(1 + r)^n] / [(1 + r)^n - 1]
    let monthlyPayment: number;

    if (monthlyInterestRate === 0) {
      // If interest rate is 0, payment is simply principal divided by number of payments
      monthlyPayment = loanAmount / totalPayments;
    } else {
      monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) /
        (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
    }

    // Calculate totals
    const totalAmountPaid = monthlyPayment * totalPayments;
    const totalInterest = totalAmountPaid - loanAmount;

    return {
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      breakdown: {
        loanAmount: parseFloat(loanAmount.toFixed(2)),
        totalPayments,
        totalAmountPaid: parseFloat(totalAmountPaid.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        monthlyInterestRate: parseFloat((monthlyInterestRate * 100).toFixed(4)),
      },
      inputs: {
        loanAmount,
        interestRate,
        loanTerm,
        paymentType,
      },
      message: `Monthly Payment: $${monthlyPayment.toFixed(2)}`,
    };
  }

  static calculateNetWorth(input: NetWorthCalculatorInput) {
    const { assets, liabilities } = input;

    // Calculate net worth
    const netWorth = assets - liabilities;

    // Determine financial health status
    let status: string;
    if (netWorth > 0) {
      status = 'Positive - You have more assets than liabilities.';
    } else if (netWorth === 0) {
      status = 'Neutral - Your assets equal your liabilities.';
    } else {
      status = 'Negative - You have more liabilities than assets.';
    }

    return {
      netWorth: parseFloat(netWorth.toFixed(2)),
      status,
      breakdown: {
        totalAssets: parseFloat(assets.toFixed(2)),
        totalLiabilities: parseFloat(liabilities.toFixed(2)),
        difference: parseFloat(netWorth.toFixed(2)),
      },
      inputs: {
        assets,
        liabilities,
      },
      message: `Your Net Worth: $${netWorth.toFixed(2)}`,
    };
  }

  static calculateRetirement(input: RetirementCalculatorInput) {
    const { currentAge, retirementAge, currentSavings, annualContributions, expectedRateOfReturn } = input;

    // Calculate years to retirement
    const yearsToRetirement = retirementAge - currentAge;

    // Convert percentage to decimal
    const rate = expectedRateOfReturn / 100;

    // Future value of annual contributions: FV = PMT * [((1 + r)^n - 1) / r]
    let futureValueContributions: number;
    if (rate === 0) {
      futureValueContributions = annualContributions * yearsToRetirement;
    } else {
      futureValueContributions = annualContributions * (((Math.pow(1 + rate, yearsToRetirement) - 1) / rate));
    }

    // Future value of current savings: FV = PV * (1 + r)^n
    const futureValueSavings = currentSavings * Math.pow(1 + rate, yearsToRetirement);

    // Total future value
    const totalFutureValue = futureValueContributions + futureValueSavings;

    return {
      futureValue: parseFloat(totalFutureValue.toFixed(2)),
      breakdown: {
        yearsToRetirement,
        futureValueOfContributions: parseFloat(futureValueContributions.toFixed(2)),
        futureValueOfCurrentSavings: parseFloat(futureValueSavings.toFixed(2)),
        totalFutureValue: parseFloat(totalFutureValue.toFixed(2)),
      },
      inputs: {
        currentAge,
        retirementAge,
        currentSavings,
        annualContributions,
        expectedRateOfReturn,
      },
      message: `Estimated Savings at Retirement: $${totalFutureValue.toFixed(2)}`,
    };
  }

  static calculateRuleOf72(input: RuleOf72CalculatorInput) {
    const { annualRate } = input;

    // Calculate years to double using Rule of 72: Years = 72 / Rate
    const yearsToDouble = 72 / annualRate;

    return {
      yearsToDouble: parseFloat(yearsToDouble.toFixed(2)),
      breakdown: {
        annualRate,
        formula: '72 / Annual Rate',
        yearsToDouble: parseFloat(yearsToDouble.toFixed(2)),
      },
      inputs: {
        annualRate,
      },
      message: `Years to Double: ${yearsToDouble.toFixed(2)} years`,
    };
  }

  static calculateSavingsGoal(input: SavingsGoalCalculatorInput) {
    const { savingsGoal, currentSavings, timeFrame } = input;

    // Calculate total months
    const totalMonths = timeFrame * 12;

    // Calculate remaining amount needed
    const remainingGoal = savingsGoal - currentSavings;

    // Calculate required monthly contribution
    const requiredSavings = remainingGoal > 0 ? remainingGoal / totalMonths : 0;

    // Calculate total amount to save
    const totalToSave = Math.max(remainingGoal, 0);

    return {
      requiredSavings: parseFloat(requiredSavings.toFixed(2)),
      breakdown: {
        savingsGoal: parseFloat(savingsGoal.toFixed(2)),
        currentSavings: parseFloat(currentSavings.toFixed(2)),
        remainingGoal: parseFloat(remainingGoal.toFixed(2)),
        timeFrameYears: timeFrame,
        totalMonths,
        monthlyContribution: parseFloat(requiredSavings.toFixed(2)),
      },
      inputs: {
        savingsGoal,
        currentSavings,
        timeFrame,
      },
      message: `Required Savings per Month: $${requiredSavings.toFixed(2)}`,
    };
  }


  // Premium Tools:

  // Stock Analyzer
  private static safeFloat(value: any): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0.0 : num;
  }

  private static calculateRSI(prices: number[]): number {
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains.push(change);
      } else {
        losses.push(Math.abs(change));
      }
    }

    const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  static async analyzeStock(input: StockAnalyzerCalculatorInput) {
    const { symbol, term } = input;
    const apiKey = config.ALPHA_VANTAGE_API_KEY;

    try {
      // Fetch company overview
      const overviewResponse = await axios.get(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
      );
      const dataCompany = overviewResponse.data;

      const companyName = dataCompany.Name || 'N/A';
      const peRatio = this.safeFloat(dataCompany.PERatio);
      const pbRatio = this.safeFloat(dataCompany.PriceToBookRatio);

      // Fetch weekly prices
      const weeklyPricesResponse = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}&outputsize=full`
      );
      const weeklyData = weeklyPricesResponse.data['Weekly Adjusted Time Series'];

      if (!weeklyData) {
        throw new Error('Unable to fetch stock data. Invalid symbol or API limit reached.');
      }

      // Extract weekly closing prices
      const weeklyPrices = Object.values(weeklyData).map((day: any) => parseFloat(day['4. close']));
      const intrinsicValue = weeklyPrices.reduce((a, b) => a + b, 0) / weeklyPrices.length;

      // Fetch current stock price
      const currentPriceResponse = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      );
      const currentPrice = this.safeFloat(currentPriceResponse.data['Global Quote']['05. price']);

      // Recommendation logic
      let recommendation: string;
      let explanation: string;

      if (term === 'Long Term') {
        if (intrinsicValue > currentPrice) {
          recommendation = 'Strong Buy';
          explanation = `The stock is undervalued for the long term, meaning it is priced lower than its actual worth. This suggests it could be a good investment for future growth.`;
        } else {
          recommendation = 'Sell';
          explanation = `The stock is overvalued for the long term, meaning it is priced higher than what it's worth. This suggests it might not grow much and could be a good time to sell.`;
        }
      } else {
        if (peRatio < 15 && pbRatio < 1.5) {
          recommendation = 'Buy';
          explanation = `The stock is undervalued for the short term, meaning it's cheap compared to what the company earns and owns. This could make it a good buy right now.`;
        } else if (peRatio > 25 || pbRatio > 3.0) {
          recommendation = 'Sell';
          explanation = `The stock is overvalued for the short term, meaning it's expensive compared to what the company earns and owns. This could be a good time to sell before the price drops.`;
        } else {
          recommendation = 'Hold';
          explanation = `The stock is fairly priced for the short term, meaning it's neither too cheap nor too expensive. It might be best to wait and see how it performs before buying or selling.`;
        }
      }

      // Calculate RSI
      const rsi = this.calculateRSI(weeklyPrices.slice(0, 14));
      let trend: string;
      if (rsi <= 30) {
        trend = 'Bearish';
      } else if (rsi >= 70) {
        trend = 'Bullish';
      } else if (rsi < 50) {
        trend = 'Downtrend';
      } else {
        trend = 'Uptrend';
      }

      return {
        companyName,
        symbol,
        intrinsicStockValue: `$${intrinsicValue.toFixed(2)}`,
        currentStockPrice: `$${currentPrice.toFixed(2)}`,
        stockTrend: trend,
        valuationStatus: recommendation,
        explanation,
        disclaimer: 'This analysis is for educational purposes only and does not constitute financial advice. Please consult a financial professional before making any investment decisions.',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error('Failed to fetch stock data. Please check the symbol or try again later.');
      }
      throw error;
    }
  }

  // Profile Optimization
  private static simpleOptimization(
    returns: number[][],
    targetReturn: number,
    numAssets: number
  ): number[] {
    let bestWeights: number[] = [];
    let bestVolatility = Infinity;

    // Simple grid search
    const steps = 20;
    const generateWeights = (index: number, remaining: number, current: number[]): void => {
      if (index === numAssets - 1) {
        current[index] = remaining;
        const weights = [...current];

        // Check if meets target return
        const portReturn = this.portfolioReturn(weights, returns);
        if (portReturn >= targetReturn) {
          const volatility = this.portfolioVolatility(weights, returns);
          if (volatility < bestVolatility) {
            bestVolatility = volatility;
            bestWeights = [...weights];
          }
        }
        return;
      }

      for (let i = 0; i <= steps; i++) {
        const weight = (i / steps) * remaining;
        current[index] = weight;
        generateWeights(index + 1, remaining - weight, current);
      }
    };

    generateWeights(0, 1, new Array(numAssets).fill(0));

    // If no valid solution, use equal weights
    if (bestWeights.length === 0) {
      bestWeights = Array(numAssets).fill(1 / numAssets);
    }

    return bestWeights;
  }

  private static async getStockData(symbol: string, apiKey: string): Promise<number[]> {
    try {

      const alpha = require('alphavantage')({ key: apiKey });
      const data = await alpha.data.monthly(symbol);

      if (!data['Monthly Time Series']) {
        throw new Error(`No monthly time series data for ${symbol}`);
      }

      const prices = Object.entries(data['Monthly Time Series'])
        .map(([date, values]: [string, any]) => ({
          date: new Date(date),
          price: parseFloat(values['4. close']),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .filter((item) => item.date >= new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000))
        .map((entry) => entry.price);

      if (prices.length < 60) {
        const padding = Array(60 - prices.length).fill(prices[0] || 0);
        return [...padding, ...prices];
      }

      return prices.slice(-60);
    } catch (error) {
      console.error(`Error in getStockData for ${symbol}:`, error);
      throw new Error(`Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static calculateCovarianceMatrix(returns: number[][]) {
    const numAssets = returns.length;
    const means = returns.map(assetReturns => {
      return assetReturns.reduce((sum, val) => sum + val, 0) / assetReturns.length;
    });

    const covMatrix = Array(numAssets).fill(0).map(() => Array(numAssets).fill(0));

    for (let i = 0; i < numAssets; i++) {
      for (let j = 0; j < numAssets; j++) {
        let cov = 0;
        for (let k = 0; k < returns[i].length; k++) {
          cov += (returns[i][k] - means[i]) * (returns[j][k] - means[j]);
        }
        covMatrix[i][j] = cov / (returns[i].length - 1);
      }
    }
    return covMatrix;
  }
  private static portfolioReturn(weights: number[], returns: number[][]) {
    // Calculate mean returns for each asset
    const meanReturns = returns.map(assetReturns => {
      return assetReturns.reduce((sum, val) => sum + val, 0) / assetReturns.length;
    });

    // Calculate weighted sum
    const weightedSum = meanReturns.reduce((sum, ret, i) => sum + ret * weights[i], 0);
    return weightedSum * 12; // Annualized
  }

  private static portfolioVolatility(weights: number[], returns: number[][]) {
    const covMatrix = this.calculateCovarianceMatrix(returns);

    // Manual matrix multiplication: weights * covMatrix * weights
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        sum += weights[i] * covMatrix[i][j] * weights[j];
      }
    }

    return Math.sqrt(sum) * Math.sqrt(12); // Annualized
  }

  private static calculateVaR(volatility: number, timePeriod = 1) {
    const zScore = -1.645; // 95% confidence
    return zScore * volatility * Math.sqrt(timePeriod);
  }

  // Add main method
  static async optimizePortfolio(input: PortfolioOptimizerCalculatorInput) {
    const { symbols, investmentAmount, targetReturn, riskFreeRate } = input;
    const apiKey = config.ALPHA_VANTAGE_API_KEY;

    try {
      // Fetch stock data
      const stockData = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const data = await this.getStockData(symbol.symbol, apiKey);
            return { symbol: symbol.symbol, data };
          } catch (error) {
            console.error(`Error fetching ${symbol.symbol}:`, error);
            throw error;
          }
        })
      );

      // Calculate returns
      const prices = stockData.map((item) => item.data);

      const returns = prices.map((priceArray) => {
        const percentageChanges = [];
        for (let i = 1; i < priceArray.length; i++) {
          percentageChanges.push((priceArray[i] - priceArray[i - 1]) / priceArray[i - 1]);
        }
        return percentageChanges;
      });
      const numAssets = symbols.length;

      // Use simple optimization
      const optimalWeights = this.simpleOptimization(returns, targetReturn, numAssets);

      const optReturn = this.portfolioReturn(optimalWeights, returns);
      const optVolatility = this.portfolioVolatility(optimalWeights, returns);
      const var95 = this.calculateVaR(optVolatility);
      const potentialLoss = investmentAmount * Math.abs(var95);
      const sharpeRatio = (optReturn - riskFreeRate) / optVolatility;

      return {
        portfolio: symbols.map((symbol, index) => ({
          symbol: symbol.symbol,
          weight: parseFloat((optimalWeights[index] * 100).toFixed(2)),
          allocation: parseFloat((optimalWeights[index] * investmentAmount).toFixed(2)),
        })),
        metrics: {
          expectedReturn: parseFloat((optReturn * 100).toFixed(2)),
          volatility: parseFloat((optVolatility * 100).toFixed(2)),
          sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
          valueAtRisk: parseFloat((Math.abs(var95) * 100).toFixed(2)),
          potentialLoss: parseFloat(potentialLoss.toFixed(2)),
        },
        inputs: {
          investmentAmount,
          targetReturn: parseFloat((targetReturn * 100).toFixed(2)),
          riskFreeRate: parseFloat((riskFreeRate * 100).toFixed(2)),
          symbols: symbols.map(s => s.symbol),
        },
      };
    } catch (error) {
      console.error('Portfolio optimization error:', error);
      if (error instanceof Error) {
        throw new Error(`Portfolio optimization failed: ${error.message}`);
      }
      throw new Error('Portfolio optimization failed. Please check symbols and try again.');
    }
  }

}