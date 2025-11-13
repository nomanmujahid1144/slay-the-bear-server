import { Router } from 'express';
import { CalculatorController } from '../controllers/calculator.controller';
import { authenticate, requirePremium } from '../middlewares/auth.middleware';

const router = Router();

router.post('/bond-price', CalculatorController.calculateBondPrice);
router.post('/bond-ytm', CalculatorController.calculateBondYTM);
router.post('/break-even', CalculatorController.calculateBreakEven);
router.post('/budget', CalculatorController.calculateBudget);
router.post('/cd', CalculatorController.calculateCD);
router.post('/compound-interest', CalculatorController.calculateCompoundInterest);
router.post('/credit-payoff', CalculatorController.calculateCreditPayoff);
router.post('/currency-converter', CalculatorController.convertCurrency);
router.post('/debt-to-income', CalculatorController.calculateDebtToIncome);
router.post('/dividend', CalculatorController.calculateDividend);
router.post('/investment-return', CalculatorController.calculateInvestmentReturn);
router.post('/loan-amortization', CalculatorController.calculateLoanAmortization);
router.post('/modified-duration', CalculatorController.calculateModifiedDuration);
router.post('/mortgage', CalculatorController.calculateMortgage);
router.post('/net-worth', CalculatorController.calculateNetWorth);
router.post('/retirement', CalculatorController.calculateRetirement);
router.post('/rule-of-72', CalculatorController.calculateRuleOf72);
router.post('/savings-goal', CalculatorController.calculateSavingsGoal);

// Premium Tools
router.post('/stock-analyzer', authenticate, requirePremium, CalculatorController.analyzeStock);
router.post('/portfolio-optimizer', authenticate, requirePremium, CalculatorController.optimizePortfolio);

export default router;