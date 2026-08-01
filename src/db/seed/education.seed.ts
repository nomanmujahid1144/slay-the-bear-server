import { db } from '../../db';
import {
    educationLevels,
    educationModules,
    educationLessons,
    educationModuleQuizzes,
    educationLevelQuizzes,
} from '../schema/education';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// EDUCATION SEED SCRIPT
// Seeds all curriculum data into PostgreSQL
// Run: npx ts-node src/db/seed/education.seed.ts
// Safe to re-run — uses upsert (insert or ignore)
// ============================================

// ============================================
// STEP 1 — LEVELS DATA
// 5 levels: Beginner → Intermediate → Advanced → Expert → Master
// ============================================

const levelsData = [
    {
        slug: 'beginner',
        title: 'Beginner',
        description: 'Build your financial foundation. Learn the basics of money, budgeting, saving, and investing.',
        order: 1,
        xpRequired: 0,
        isActive: true,
    },
    {
        slug: 'intermediate',
        title: 'Intermediate',
        description: 'Deepen your knowledge. Explore stocks, bonds, ETFs, and portfolio building.',
        order: 2,
        xpRequired: 1000,
        isActive: true,
    },
    {
        slug: 'advanced',
        title: 'Advanced',
        description: 'Go beyond the basics. Learn technical analysis, options, and advanced strategies.',
        order: 3,
        xpRequired: 5000,
        isActive: true,
    },
    {
        slug: 'expert',
        title: 'Expert',
        description: 'Think like a professional. Master portfolio construction, macroeconomics, and risk management.',
        order: 4,
        xpRequired: 10000,
        isActive: true,
    },
    {
        slug: 'master',
        title: 'Master',
        description: 'Coming soon. The pinnacle of financial mastery.',
        order: 5,
        xpRequired: 25000,
        isActive: false, // placeholder — no content yet
    },
];

// ============================================
// STEP 2 — MODULES DATA
// Each module belongs to a level (by slug)
// ============================================

const modulesData = [
    // ── BEGINNER MODULES ──────────────────────
    {
        levelSlug: 'beginner',
        slug: 'money-management',
        title: 'Money Management',
        description: 'Learn how to budget, save, and build healthy financial habits.',
        order: 1,
        xpReward: 150,
        estimatedMinutes: 15,
    },
    {
        levelSlug: 'beginner',
        slug: 'what-is-investing',
        title: 'What Is Investing?',
        description: 'Understand why investing exists and how it works.',
        order: 2,
        xpReward: 150,
        estimatedMinutes: 15,
    },
    {
        levelSlug: 'beginner',
        slug: 'stocks-basics',
        title: 'Stocks Explained',
        description: 'Learn what ownership in a company means in plain English.',
        order: 3,
        xpReward: 150,
        estimatedMinutes: 15,
    },
    {
        levelSlug: 'beginner',
        slug: 'bonds-basics',
        title: 'Bonds & Fixed Income',
        description: 'Understand lending, income, and stability.',
        order: 4,
        xpReward: 150,
        estimatedMinutes: 15,
    },
    {
        levelSlug: 'beginner',
        slug: 'risk-and-return',
        title: 'Risk & Return',
        description: 'Understand risk before you take it.',
        order: 5,
        xpReward: 150,
        estimatedMinutes: 15,
    },

    // ── INTERMEDIATE MODULES ──────────────────
    {
        levelSlug: 'intermediate',
        slug: 'asset-allocation',
        title: 'Asset Allocation',
        description: 'Use mix — not prediction — as the foundation of investing.',
        order: 1,
        xpReward: 150,
        estimatedMinutes: 20,
    },
    {
        levelSlug: 'intermediate',
        slug: 'etfs-and-mutual-funds',
        title: 'ETFs vs Mutual Funds',
        description: 'Compare investment vehicles simply and clearly.',
        order: 2,
        xpReward: 150,
        estimatedMinutes: 20,
    },
    {
        levelSlug: 'intermediate',
        slug: 'market-cycles',
        title: 'Market Cycles',
        description: 'Recognize bull, bear, and sideways market phases.',
        order: 3,
        xpReward: 150,
        estimatedMinutes: 20,
    },
    {
        levelSlug: 'intermediate',
        slug: 'diversification',
        title: 'Diversification',
        description: 'Learn why spreading risk protects your portfolio.',
        order: 4,
        xpReward: 150,
        estimatedMinutes: 20,
    },
    {
        levelSlug: 'intermediate',
        slug: 'rebalancing',
        title: 'Rebalancing',
        description: 'Learn when and why to rebalance your portfolio.',
        order: 5,
        xpReward: 150,
        estimatedMinutes: 20,
    },

    // ── ADVANCED MODULES ──────────────────────
    {
        levelSlug: 'advanced',
        slug: 'portfolio-construction',
        title: 'Portfolio Construction',
        description: 'Learn how professional portfolios are built.',
        order: 1,
        xpReward: 150,
        estimatedMinutes: 25,
    },
    {
        levelSlug: 'advanced',
        slug: 'valuation-basics',
        title: 'Valuation Basics',
        description: 'Learn the difference between price and value.',
        order: 2,
        xpReward: 150,
        estimatedMinutes: 25,
    },
    {
        levelSlug: 'advanced',
        slug: 'technical-analysis',
        title: 'Technical Analysis',
        description: 'Read charts and understand price patterns.',
        order: 3,
        xpReward: 150,
        estimatedMinutes: 25,
    },
    {
        levelSlug: 'advanced',
        slug: 'risk-management',
        title: 'Risk Management',
        description: 'Manage downside exposure with discipline.',
        order: 4,
        xpReward: 150,
        estimatedMinutes: 25,
    },
    {
        levelSlug: 'advanced',
        slug: 'macro-influence',
        title: 'Macro Influence',
        description: 'See how interest rates and inflation affect markets.',
        order: 5,
        xpReward: 150,
        estimatedMinutes: 25,
    },

    // ── EXPERT MODULES ────────────────────────
    {
        levelSlug: 'expert',
        slug: 'behavioral-finance',
        title: 'Behavioral Finance',
        description: 'Master emotional decision-making in investing.',
        order: 1,
        xpReward: 150,
        estimatedMinutes: 30,
    },
    {
        levelSlug: 'expert',
        slug: 'institutional-thinking',
        title: 'Institutional Thinking',
        description: 'View portfolios the way professional investors do.',
        order: 2,
        xpReward: 150,
        estimatedMinutes: 30,
    },
    {
        levelSlug: 'expert',
        slug: 'stress-testing',
        title: 'Stress Testing',
        description: 'Test your portfolio resilience across difficult environments.',
        order: 3,
        xpReward: 150,
        estimatedMinutes: 30,
    },
    {
        levelSlug: 'expert',
        slug: 'tax-awareness',
        title: 'Tax-Aware Investing',
        description: 'Improve long-term after-tax outcomes conceptually.',
        order: 4,
        xpReward: 150,
        estimatedMinutes: 30,
    },
    {
        levelSlug: 'expert',
        slug: 'long-term-strategy',
        title: 'Long-Term Strategy',
        description: 'Build durable strategy habits that stand the test of time.',
        order: 5,
        xpReward: 150,
        estimatedMinutes: 30,
    },
];

// ============================================
// STEP 3 — LESSONS DATA
// Each lesson belongs to a module (by slug)
// Content is in English — Spanish optional
// ============================================

const lessonsData = [
    // ── MONEY MANAGEMENT ─────────────────────
    {
        moduleSlug: 'money-management',
        slug: 'building-a-budget',
        title: 'Building a Budget',
        content: `A budget is a plan for your money. It tells your dollars where to go instead of wondering where they went.

The simplest budgeting method is the 50/30/20 rule:
- 50% of your income goes to needs (rent, food, utilities)
- 30% goes to wants (entertainment, dining out)
- 20% goes to savings and debt repayment

Start by tracking what you spend for one month. Most people are surprised by where their money actually goes. Once you know your spending patterns, you can make a plan that works for your real life — not an imaginary one.

KEY CONCEPT: A budget is not a restriction. It is permission to spend on what matters most to you.

DID YOU KNOW? People who write down their financial goals are 42% more likely to achieve them than those who do not.`,
        order: 1,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'money-management',
        slug: 'emergency-funds',
        title: 'Emergency Funds',
        content: `An emergency fund is money set aside for unexpected expenses — a job loss, medical bill, or car repair. It is not an investment. It is protection.

The standard recommendation is 3 to 6 months of living expenses. If your monthly expenses are $3,000, your target emergency fund is $9,000 to $18,000.

Where should you keep it? A high-yield savings account. It should be easy to access but not so easy that you spend it on non-emergencies.

KEY CONCEPT: Your emergency fund is the foundation of your financial life. Build it before investing.

DID YOU KNOW? 40% of Americans cannot cover an unexpected $400 expense without borrowing money. An emergency fund puts you in the protected majority.`,
        order: 2,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'money-management',
        slug: 'saving-strategies',
        title: 'Saving Strategies',
        content: `Saving money consistently is one of the most powerful financial habits you can build. The key is to make it automatic.

Pay yourself first. Before you pay any bill, transfer a set amount to your savings account on payday. Treat it like a non-negotiable expense.

Even small amounts matter. Saving $5 per day is $1,825 per year. Over 10 years with compound interest, that could grow significantly.

KEY CONCEPT: Consistency beats amount. Saving $100 every month for 30 years beats saving $1,000 occasionally.

DID YOU KNOW? The average American saves about 5% of their income. Financial experts recommend saving at least 15% for long-term security.`,
        order: 3,
        xpReward: 50,
        estimatedMinutes: 5,
    },

    // ── WHAT IS INVESTING ─────────────────────
    {
        moduleSlug: 'what-is-investing',
        slug: 'why-invest',
        title: 'Why Invest?',
        content: `Investing is putting your money to work so it can grow over time. Without investing, inflation slowly erodes the purchasing power of your savings.

If you keep $10,000 in cash for 30 years and inflation averages 3% per year, that money will only buy what $4,120 buys today. Investing helps your money grow faster than inflation.

The stock market has historically returned about 7-10% per year on average over long periods. That means money invested wisely tends to grow significantly over time.

KEY CONCEPT: Investing is not gambling. Gambling creates risk out of nothing. Investing takes on existing risk in exchange for potential reward.

DID YOU KNOW? If you had invested $1,000 in the S&P 500 in 1990, it would be worth over $20,000 today.`,
        order: 1,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'what-is-investing',
        slug: 'compound-interest',
        title: 'The Power of Compound Interest',
        content: `Compound interest is earning interest on your interest. It is the most powerful force in personal finance.

If you invest $1,000 at 8% per year:
- After 10 years: $2,159
- After 20 years: $4,661
- After 30 years: $10,063

Your money more than doubled in the first 10 years — but grew 5x more in the next 20. This is the magic of compounding. The longer you wait, the faster your money grows.

KEY CONCEPT: Time is the most important ingredient in compound interest. Starting early matters more than investing large amounts later.

DID YOU KNOW? Albert Einstein reportedly called compound interest the eighth wonder of the world.`,
        order: 2,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'what-is-investing',
        slug: 'time-horizon',
        title: 'Time Horizon',
        content: `Your time horizon is how long you plan to keep money invested before you need it. It is one of the most important factors in choosing how to invest.

Short time horizon (1-3 years): Keep money safe. Use savings accounts or short-term bonds. You cannot afford to lose it.

Medium time horizon (3-10 years): A balanced mix of stocks and bonds makes sense.

Long time horizon (10+ years): You can afford to take more risk because you have time to recover from downturns.

KEY CONCEPT: Your time horizon determines your risk tolerance. Never invest money you will need within 2 years in stocks.

DID YOU KNOW? The stock market has never had a negative 20-year period in history. Time in the market beats timing the market.`,
        order: 3,
        xpReward: 50,
        estimatedMinutes: 5,
    },

    // ── STOCKS BASICS ─────────────────────────
    {
        moduleSlug: 'stocks-basics',
        slug: 'what-is-a-stock',
        title: 'What Is a Stock?',
        content: `A stock represents a share of ownership in a company. When you buy a stock, you become a part-owner — called a shareholder — of that business.

If the company grows and becomes more valuable, your shares become worth more. If the company does well, it may also pay you a portion of its profits — called a dividend.

Companies issue stock to raise money. Instead of borrowing from a bank, they sell pieces of ownership to investors like you.

KEY CONCEPT: Stocks are not pieces of paper. They are real ownership stakes in real businesses.

DID YOU KNOW? The New York Stock Exchange (NYSE) was founded in 1792 under a buttonwood tree on Wall Street.`,
        order: 1,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'stocks-basics',
        slug: 'how-stocks-are-traded',
        title: 'How Stocks Are Traded',
        content: `Stocks are bought and sold on stock exchanges — marketplaces where buyers and sellers meet. The biggest exchanges in the US are the NYSE and NASDAQ.

When you want to buy a stock, you place an order through a brokerage account. The price you pay depends on what other investors are willing to sell for at that moment.

Stock prices change constantly during trading hours — Monday through Friday from 9:30 AM to 4:00 PM Eastern Time.

KEY CONCEPT: Stock prices are set by supply and demand. When more people want to buy than sell, prices rise. When more want to sell than buy, prices fall.

DID YOU KNOW? Over 5 billion shares are traded on US stock exchanges every single day.`,
        order: 2,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'stocks-basics',
        slug: 'reading-stock-prices',
        title: 'Reading Stock Prices',
        content: `When you look up a stock, you see several important numbers:

Price: The current cost of one share.
Market Cap: Total value of all shares (price × total shares). This tells you the size of the company.
P/E Ratio: Price divided by earnings per share. A high P/E means investors expect strong future growth.
52-Week High/Low: The highest and lowest price the stock has traded at in the past year.
Volume: How many shares were traded today.

KEY CONCEPT: No single number tells you if a stock is a good investment. You need to look at the full picture.

DID YOU KNOW? Apple became the first company to reach a $1 trillion market cap in 2018, then $2 trillion in 2020, and $3 trillion in 2022.`,
        order: 3,
        xpReward: 50,
        estimatedMinutes: 5,
    },

    // ── BONDS BASICS ──────────────────────────
    {
        moduleSlug: 'bonds-basics',
        slug: 'what-is-a-bond',
        title: 'What Is a Bond?',
        content: `A bond is a loan you give to a company or government. In exchange, they promise to pay you regular interest payments and return your money at the end of a set period.

When you buy a bond, you are the lender. The bond issuer — a company, city, or government — is the borrower.

For example: A 10-year US Treasury bond with a 4% coupon rate means the government will pay you 4% of the bond's face value every year for 10 years, then return your original investment.

KEY CONCEPT: Bonds are generally safer than stocks but offer lower returns. They provide stability and predictable income.

DID YOU KNOW? The US government has never defaulted on its bonds. US Treasuries are considered the safest investment in the world.`,
        order: 1,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'bonds-basics',
        slug: 'bond-vs-stock',
        title: 'Bonds vs Stocks',
        content: `Stocks and bonds are the two main building blocks of most investment portfolios. They behave very differently.

Stocks:
- Represent ownership in a company
- Higher potential returns
- Higher risk — prices can drop significantly
- No guaranteed payments

Bonds:
- Represent a loan to a company or government
- Lower potential returns
- Lower risk — you know exactly what you will receive
- Predictable interest payments

When stocks fall, bonds often hold steady or rise. This is why most investors hold both — they balance each other out.

KEY CONCEPT: Diversifying between stocks and bonds reduces the overall risk of your portfolio without eliminating returns.`,
        order: 2,
        xpReward: 50,
        estimatedMinutes: 5,
    },

    // ── RISK AND RETURN ───────────────────────
    {
        moduleSlug: 'risk-and-return',
        slug: 'understanding-risk',
        title: 'Understanding Risk',
        content: `In investing, risk means the possibility that your investment loses value. All investments carry some level of risk — even a savings account carries the risk of inflation eating away its value.

Types of risk:
- Market Risk: The overall market falls and most investments lose value
- Company Risk: A specific company performs poorly
- Inflation Risk: Your returns do not keep up with rising prices
- Liquidity Risk: You cannot sell your investment quickly when you need cash

KEY CONCEPT: Higher potential returns almost always come with higher risk. There is no free lunch in investing.

DID YOU KNOW? The stock market dropped over 50% during the 2008-2009 financial crisis — but fully recovered within 4 years.`,
        order: 1,
        xpReward: 50,
        estimatedMinutes: 5,
    },
    {
        moduleSlug: 'risk-and-return',
        slug: 'risk-tolerance',
        title: 'Your Risk Tolerance',
        content: `Risk tolerance is how much financial loss you can handle — both financially and emotionally — without making panic-driven decisions.

Two components of risk tolerance:
1. Ability to take risk: Based on your time horizon, income, and financial situation
2. Willingness to take risk: Based on your personality and how you react to losses

A young investor with a 30-year time horizon can afford to take more risk than a retiree who needs income now. But if that young investor cannot sleep when their portfolio drops 20%, they may need a more conservative approach.

KEY CONCEPT: The best portfolio is one you can stick with through both good times and bad times.

DID YOU KNOW? Studies show that investors who check their portfolios less frequently make better long-term decisions.`,
        order: 2,
        xpReward: 50,
        estimatedMinutes: 5,
    },
];

// ============================================
// STEP 4 — MODULE QUIZZES DATA
// One quiz per module — 5 questions each
// correctAnswer is NEVER sent to frontend
// ============================================

const moduleQuizzesData = [
    {
        moduleSlug: 'money-management',
        title: 'Money Management Quiz',
        questionCount: 5,
        passThreshold: 80,
        xpReward: 50,
        questions: [
            {
                id: 'mm-q1',
                question: 'What does the 50/30/20 budgeting rule recommend for savings?',
                options: [
                    { label: 'A', value: '10% of income' },
                    { label: 'B', value: '20% of income' },
                    { label: 'C', value: '30% of income' },
                    { label: 'D', value: '50% of income' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'mm-q2',
                question: 'What is the recommended size for an emergency fund?',
                options: [
                    { label: 'A', value: '1 month of expenses' },
                    { label: 'B', value: '3 to 6 months of expenses' },
                    { label: 'C', value: '12 months of expenses' },
                    { label: 'D', value: '$10,000 flat' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'mm-q3',
                question: 'What does "pay yourself first" mean?',
                options: [
                    { label: 'A', value: 'Buy what you want before paying bills' },
                    { label: 'B', value: 'Transfer to savings before spending on anything else' },
                    { label: 'C', value: 'Pay off all debts before saving' },
                    { label: 'D', value: 'Give yourself a raise' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'mm-q4',
                question: 'Where should you keep your emergency fund?',
                options: [
                    { label: 'A', value: 'In stocks for higher returns' },
                    { label: 'B', value: 'In a checking account' },
                    { label: 'C', value: 'In a high-yield savings account' },
                    { label: 'D', value: 'In cash at home' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'mm-q5',
                question: 'What is the first step to building a budget?',
                options: [
                    { label: 'A', value: 'Cut all spending immediately' },
                    { label: 'B', value: 'Open a new bank account' },
                    { label: 'C', value: 'Track what you currently spend for one month' },
                    { label: 'D', value: 'Ask a financial advisor' },
                ],
                correctAnswer: 'C',
            },
        ],
    },
    {
        moduleSlug: 'what-is-investing',
        title: 'What Is Investing Quiz',
        questionCount: 5,
        passThreshold: 80,
        xpReward: 50,
        questions: [
            {
                id: 'wi-q1',
                question: 'What is the main reason to invest rather than keep all money in cash?',
                options: [
                    { label: 'A', value: 'Investing is required by law' },
                    { label: 'B', value: 'To beat inflation and grow purchasing power' },
                    { label: 'C', value: 'Cash is not safe in banks' },
                    { label: 'D', value: 'To avoid paying taxes' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'wi-q2',
                question: 'What is compound interest?',
                options: [
                    { label: 'A', value: 'Interest paid to your bank' },
                    { label: 'B', value: 'Earning interest on your original amount only' },
                    { label: 'C', value: 'Earning interest on both your principal and accumulated interest' },
                    { label: 'D', value: 'A type of bank fee' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'wi-q3',
                question: 'What does a long time horizon allow an investor to do?',
                options: [
                    { label: 'A', value: 'Avoid all risk' },
                    { label: 'B', value: 'Take on more risk because there is time to recover from downturns' },
                    { label: 'C', value: 'Guarantee higher returns' },
                    { label: 'D', value: 'Avoid paying taxes on gains' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'wi-q4',
                question: 'How is investing different from gambling?',
                options: [
                    { label: 'A', value: 'Investing always makes money' },
                    { label: 'B', value: 'Gambling is legal and investing is not' },
                    { label: 'C', value: 'Investing takes on existing economic risk for potential reward, gambling creates risk artificially' },
                    { label: 'D', value: 'There is no difference' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'wi-q5',
                question: 'What is the historical average annual return of the stock market?',
                options: [
                    { label: 'A', value: '2-3%' },
                    { label: 'B', value: '7-10%' },
                    { label: 'C', value: '15-20%' },
                    { label: 'D', value: '25-30%' },
                ],
                correctAnswer: 'B',
            },
        ],
    },
    {
        moduleSlug: 'stocks-basics',
        title: 'Stocks Quiz',
        questionCount: 5,
        passThreshold: 80,
        xpReward: 50,
        questions: [
            {
                id: 'sb-q1',
                question: 'What does a stock represent?',
                options: [
                    { label: 'A', value: 'A loan to a company' },
                    { label: 'B', value: 'Ownership share in a company' },
                    { label: 'C', value: 'A government bond' },
                    { label: 'D', value: 'A savings account' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'sb-q2',
                question: 'What is a dividend?',
                options: [
                    { label: 'A', value: 'A fee charged by brokers' },
                    { label: 'B', value: 'A portion of company profits paid to shareholders' },
                    { label: 'C', value: 'The total value of a company' },
                    { label: 'D', value: 'The price of a single share' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'sb-q3',
                question: 'What does market capitalization (market cap) represent?',
                options: [
                    { label: 'A', value: 'The daily trading volume' },
                    { label: 'B', value: 'The price of one share' },
                    { label: 'C', value: 'Total value of all shares outstanding' },
                    { label: 'D', value: 'Annual company revenue' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'sb-q4',
                question: 'When do US stock markets trade?',
                options: [
                    { label: 'A', value: '24 hours a day, 7 days a week' },
                    { label: 'B', value: 'Monday-Friday, 9:30 AM to 4:00 PM Eastern Time' },
                    { label: 'C', value: 'Monday-Saturday, 8:00 AM to 6:00 PM' },
                    { label: 'D', value: 'Only on business days in December' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'sb-q5',
                question: 'What causes stock prices to rise?',
                options: [
                    { label: 'A', value: 'Government decisions only' },
                    { label: 'B', value: 'When more people want to sell than buy' },
                    { label: 'C', value: 'When more people want to buy than sell' },
                    { label: 'D', value: 'When inflation rises' },
                ],
                correctAnswer: 'C',
            },
        ],
    },
    {
        moduleSlug: 'bonds-basics',
        title: 'Bonds Quiz',
        questionCount: 5,
        passThreshold: 80,
        xpReward: 50,
        questions: [
            {
                id: 'bb-q1',
                question: 'What is a bond?',
                options: [
                    { label: 'A', value: 'A share of ownership in a company' },
                    { label: 'B', value: 'A loan you give to a company or government' },
                    { label: 'C', value: 'A type of savings account' },
                    { label: 'D', value: 'A cryptocurrency' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'bb-q2',
                question: 'What is a coupon rate on a bond?',
                options: [
                    { label: 'A', value: 'A discount you get when buying the bond' },
                    { label: 'B', value: 'The annual interest rate paid to bondholders' },
                    { label: 'C', value: 'The bond\'s market price' },
                    { label: 'D', value: 'A penalty for selling early' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'bb-q3',
                question: 'Why are bonds considered safer than stocks?',
                options: [
                    { label: 'A', value: 'Bonds always increase in value' },
                    { label: 'B', value: 'Bonds offer predictable payments and return of principal' },
                    { label: 'C', value: 'Bonds are backed by gold' },
                    { label: 'D', value: 'Bonds have higher returns' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'bb-q4',
                question: 'Why do investors hold both stocks and bonds?',
                options: [
                    { label: 'A', value: 'It is required by law' },
                    { label: 'B', value: 'They tend to balance each other — when stocks fall, bonds often hold steady' },
                    { label: 'C', value: 'Bonds double stock returns' },
                    { label: 'D', value: 'To avoid all risk' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'bb-q5',
                question: 'Which is considered the safest investment in the world?',
                options: [
                    { label: 'A', value: 'Corporate bonds' },
                    { label: 'B', value: 'Gold' },
                    { label: 'C', value: 'US Treasury bonds' },
                    { label: 'D', value: 'Real estate' },
                ],
                correctAnswer: 'C',
            },
        ],
    },
    {
        moduleSlug: 'risk-and-return',
        title: 'Risk & Return Quiz',
        questionCount: 5,
        passThreshold: 80,
        xpReward: 50,
        questions: [
            {
                id: 'rr-q1',
                question: 'What does investment risk mean?',
                options: [
                    { label: 'A', value: 'The chance your investment makes money' },
                    { label: 'B', value: 'The possibility that your investment loses value' },
                    { label: 'C', value: 'The fees charged by brokers' },
                    { label: 'D', value: 'The tax rate on investment gains' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'rr-q2',
                question: 'What is inflation risk?',
                options: [
                    { label: 'A', value: 'The risk that inflation causes your job loss' },
                    { label: 'B', value: 'The risk that your returns do not keep pace with rising prices' },
                    { label: 'C', value: 'The risk of buying too many bonds' },
                    { label: 'D', value: 'The risk that stocks rise too fast' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'rr-q3',
                question: 'What typically happens to potential return as investment risk increases?',
                options: [
                    { label: 'A', value: 'Returns decrease' },
                    { label: 'B', value: 'Returns stay the same' },
                    { label: 'C', value: 'Returns increase' },
                    { label: 'D', value: 'There is no relationship' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'rr-q4',
                question: 'What are the two components of risk tolerance?',
                options: [
                    { label: 'A', value: 'Age and income' },
                    { label: 'B', value: 'Ability to take risk and willingness to take risk' },
                    { label: 'C', value: 'Time horizon and net worth' },
                    { label: 'D', value: 'Education and experience' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'rr-q5',
                question: 'What is the best portfolio for an investor?',
                options: [
                    { label: 'A', value: 'The one with the highest returns' },
                    { label: 'B', value: 'The one with the lowest risk' },
                    { label: 'C', value: 'The one you can stick with through good times and bad times' },
                    { label: 'D', value: 'The one recommended by your bank' },
                ],
                correctAnswer: 'C',
            },
        ],
    },
];

// ============================================
// STEP 5 — LEVEL QUIZZES DATA
// One final quiz per level — 10 questions
// Must score 80%+ to unlock next level
// ============================================

const levelQuizzesData = [
    {
        levelSlug: 'beginner',
        title: 'Beginner Level Final Quiz',
        questionCount: 10,
        passThreshold: 80,
        xpReward: 200,
        questions: [
            {
                id: 'blq-q1',
                question: 'What is the primary purpose of a budget?',
                options: [
                    { label: 'A', value: 'To restrict spending completely' },
                    { label: 'B', value: 'To plan where your money goes' },
                    { label: 'C', value: 'To track investments only' },
                    { label: 'D', value: 'To calculate taxes' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q2',
                question: 'What does compound interest do?',
                options: [
                    { label: 'A', value: 'Charges you extra bank fees' },
                    { label: 'B', value: 'Pays interest on your principal and accumulated interest' },
                    { label: 'C', value: 'Reduces your tax bill' },
                    { label: 'D', value: 'Only applies to savings accounts' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q3',
                question: 'What is a stock?',
                options: [
                    { label: 'A', value: 'A loan to a government' },
                    { label: 'B', value: 'A share of ownership in a company' },
                    { label: 'C', value: 'A type of savings account' },
                    { label: 'D', value: 'An insurance policy' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q4',
                question: 'What is a bond?',
                options: [
                    { label: 'A', value: 'Ownership in a company' },
                    { label: 'B', value: 'A loan you give to a company or government' },
                    { label: 'C', value: 'A retirement account' },
                    { label: 'D', value: 'A mutual fund' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q5',
                question: 'How many months of expenses should an emergency fund cover?',
                options: [
                    { label: 'A', value: '1 month' },
                    { label: 'B', value: '3 to 6 months' },
                    { label: 'C', value: '12 months' },
                    { label: 'D', value: '2 years' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q6',
                question: 'What does the 50/30/20 rule allocate 20% to?',
                options: [
                    { label: 'A', value: 'Entertainment' },
                    { label: 'B', value: 'Food and housing' },
                    { label: 'C', value: 'Savings and debt repayment' },
                    { label: 'D', value: 'Clothing' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'blq-q7',
                question: 'Why is inflation a risk even for cash savings?',
                options: [
                    { label: 'A', value: 'Banks can lose your cash' },
                    { label: 'B', value: 'Rising prices reduce the purchasing power of your money' },
                    { label: 'C', value: 'Cash earns negative interest' },
                    { label: 'D', value: 'Inflation only affects stocks' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q8',
                question: 'What makes US Treasury bonds unique?',
                options: [
                    { label: 'A', value: 'They offer the highest returns' },
                    { label: 'B', value: 'They are tax-free always' },
                    { label: 'C', value: 'They are considered the safest investment in the world' },
                    { label: 'D', value: 'They are backed by gold' },
                ],
                correctAnswer: 'C',
            },
            {
                id: 'blq-q9',
                question: 'What does a long time horizon allow an investor to do?',
                options: [
                    { label: 'A', value: 'Guarantee profits' },
                    { label: 'B', value: 'Take on more risk because there is time to recover' },
                    { label: 'C', value: 'Avoid all taxes' },
                    { label: 'D', value: 'Skip diversification' },
                ],
                correctAnswer: 'B',
            },
            {
                id: 'blq-q10',
                question: 'What is the best description of an ideal portfolio?',
                options: [
                    { label: 'A', value: 'The highest returning portfolio' },
                    { label: 'B', value: 'The safest portfolio possible' },
                    { label: 'C', value: 'The portfolio you can stick with through market ups and downs' },
                    { label: 'D', value: 'The portfolio recommended by TV experts' },
                ],
                correctAnswer: 'C',
            },
        ],
    },
];

// ============================================
// MAIN SEED FUNCTION
// Seeds in the correct order respecting FK constraints:
// Levels → Modules → Lessons → Module Quizzes → Level Quizzes
// ============================================

async function seedEducation() {
    console.log('=================================================================');
    console.log('🌱 SLAY THE BEAR — EDUCATION SEED STARTING');
    console.log('=================================================================\n');

    try {

        // ── SEED LEVELS ───────────────────────────────────────────────────
        console.log('📚 Seeding levels...');
        for (const level of levelsData) {
            await db
                .insert(educationLevels)
                .values(level)
                .onConflictDoUpdate({
                    target: educationLevels.slug,
                    set: {
                        title: level.title,
                        description: level.description,
                        order: level.order,
                        xpRequired: level.xpRequired,
                        isActive: level.isActive,
                        updatedAt: new Date(),
                    },
                });
        }
        console.log(`✅ Seeded ${levelsData.length} levels\n`);

        // ── SEED MODULES ──────────────────────────────────────────────────
        console.log('📖 Seeding modules...');

        // Fetch all levels to get their IDs
        const allLevels = await db.select().from(educationLevels);
        const levelMap = new Map(allLevels.map((l: { slug: string; id: string }) => [l.slug, l.id]));

        let modulesSeeded = 0;
        for (const module of modulesData) {
            const levelId = levelMap.get(module.levelSlug);
            if (!levelId) {
                console.warn(`⚠️  Level not found for slug: ${module.levelSlug}`);
                continue;
            }

            await db
                .insert(educationModules)
                .values({
                    levelId,
                    slug: module.slug,
                    title: module.title,
                    description: module.description,
                    order: module.order,
                    xpReward: module.xpReward,
                    estimatedMinutes: module.estimatedMinutes,
                })
                .onConflictDoUpdate({
                    target: educationModules.slug,
                    set: {
                        title: module.title,
                        description: module.description,
                        order: module.order,
                        xpReward: module.xpReward,
                        estimatedMinutes: module.estimatedMinutes,
                        updatedAt: new Date(),
                    },
                });
            modulesSeeded++;
        }
        console.log(`✅ Seeded ${modulesSeeded} modules\n`);

        // ── SEED LESSONS ──────────────────────────────────────────────────
        console.log('📝 Seeding lessons...');

        // Fetch all modules to get their IDs
        const allModules = await db.select().from(educationModules);
        const moduleMap = new Map(allModules.map((m: { slug: string; id: string }) => [m.slug, m.id]));

        let lessonsSeeded = 0;
        for (const lesson of lessonsData) {
            const moduleId = moduleMap.get(lesson.moduleSlug);
            if (!moduleId) {
                console.warn(`⚠️  Module not found for slug: ${lesson.moduleSlug}`);
                continue;
            }

            await db
                .insert(educationLessons)
                .values({
                    moduleId,
                    slug: lesson.slug,
                    title: lesson.title,
                    content: lesson.content,
                    order: lesson.order,
                    xpReward: lesson.xpReward,
                    estimatedMinutes: lesson.estimatedMinutes,
                })
                .onConflictDoUpdate({
                    target: educationLessons.slug,
                    set: {
                        title: lesson.title,
                        content: lesson.content,
                        order: lesson.order,
                        xpReward: lesson.xpReward,
                        estimatedMinutes: lesson.estimatedMinutes,
                        updatedAt: new Date(),
                    },
                });
            lessonsSeeded++;
        }
        console.log(`✅ Seeded ${lessonsSeeded} lessons\n`);

        // ── SEED MODULE QUIZZES ───────────────────────────────────────────
        console.log('🧠 Seeding module quizzes...');

        let moduleQuizzesSeeded = 0;
        for (const quiz of moduleQuizzesData) {
            const moduleId = moduleMap.get(quiz.moduleSlug);
            if (!moduleId) {
                console.warn(`⚠️  Module not found for slug: ${quiz.moduleSlug}`);
                continue;
            }

            await db
                .insert(educationModuleQuizzes)
                .values({
                    moduleId,
                    title: quiz.title,
                    questionCount: quiz.questionCount,
                    passThreshold: quiz.passThreshold,
                    xpReward: quiz.xpReward,
                    questions: quiz.questions,
                })
                .onConflictDoUpdate({
                    target: educationModuleQuizzes.moduleId,
                    set: {
                        title: quiz.title,
                        questionCount: quiz.questionCount,
                        passThreshold: quiz.passThreshold,
                        xpReward: quiz.xpReward,
                        questions: quiz.questions,
                        updatedAt: new Date(),
                    },
                });
            moduleQuizzesSeeded++;
        }
        console.log(`✅ Seeded ${moduleQuizzesSeeded} module quizzes\n`);

        // ── SEED LEVEL QUIZZES ────────────────────────────────────────────
        console.log('🏆 Seeding level quizzes...');

        let levelQuizzesSeeded = 0;
        for (const quiz of levelQuizzesData) {
            const levelId = levelMap.get(quiz.levelSlug);
            if (!levelId) {
                console.warn(`⚠️  Level not found for slug: ${quiz.levelSlug}`);
                continue;
            }

            await db
                .insert(educationLevelQuizzes)
                .values({
                    levelId,
                    title: quiz.title,
                    questionCount: quiz.questionCount,
                    passThreshold: quiz.passThreshold,
                    xpReward: quiz.xpReward,
                    questions: quiz.questions,
                })
                .onConflictDoUpdate({
                    target: educationLevelQuizzes.levelId,
                    set: {
                        title: quiz.title,
                        questionCount: quiz.questionCount,
                        passThreshold: quiz.passThreshold,
                        xpReward: quiz.xpReward,
                        questions: quiz.questions,
                        updatedAt: new Date(),
                    },
                });
            levelQuizzesSeeded++;
        }
        console.log(`✅ Seeded ${levelQuizzesSeeded} level quizzes\n`);

        // ── SUMMARY ───────────────────────────────────────────────────────
        console.log('=================================================================');
        console.log(`🏆 SUCCESS: Education seed complete!`);
        console.log(`   📚 Levels:         ${levelsData.length}`);
        console.log(`   📖 Modules:        ${modulesSeeded}`);
        console.log(`   📝 Lessons:        ${lessonsSeeded}`);
        console.log(`   🧠 Module Quizzes: ${moduleQuizzesSeeded}`);
        console.log(`   🏆 Level Quizzes:  ${levelQuizzesSeeded}`);
        console.log('=================================================================\n');

    } catch (error: any) {
        console.error('❌ Education seed failed:', error.message || error);
        process.exit(1);
    }

    process.exit(0);
}

seedEducation();