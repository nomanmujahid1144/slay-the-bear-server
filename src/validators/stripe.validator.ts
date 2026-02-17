import z from "zod";

export const createCheckoutSchema = z.object({
  body: z.object({
    period: z.enum(['monthly', 'yearly'], {
      message: 'Period must be "monthly" or "yearly"',
    }),
    planType: z.enum(['basic', 'premium'], {
      message: 'Plan type must be "basic" or "premium"',
    }),
  }),
});

export const changePlanSchema = z.object({
  body: z.object({
    planType: z.enum(['basic', 'premium'], {
      message: 'Plan type must be "basic" or "premium"',
    }),
    period: z.enum(['monthly', 'yearly'], {
      message: 'Period must be "monthly" or "yearly"',
    }),
  }),
});