import z from "zod";

export const createCheckoutSchema = z.object({
  body: z.object({
    period: z.enum(['monthly', 'yearly']),
  }),
});