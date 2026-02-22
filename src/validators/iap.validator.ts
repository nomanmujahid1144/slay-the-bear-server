import { z } from 'zod';

// Verify Receipt Schema
export const verifyReceiptSchema = z.object({
  body: z.object({
    receipt: z
      .string()
      .min(1, 'Receipt is required'),

    platform: z.enum(['ios', 'android'], {
      message: 'Platform must be "ios" or "android"',
    }),

    productId: z
      .string()
      .min(1, 'Product ID is required'),

    packageName: z
      .string()
      .optional()
      .nullable(),  // ← ADD THIS
  }).refine(
    (data) => data.platform === 'ios' || !!data.packageName,
    {
      message: 'packageName is required for Android platform',
      path: ['packageName'],
    }
  ),
});

// Restore Purchase Schema — same fields as verify
export const restorePurchaseSchema = verifyReceiptSchema;

// Types
export type VerifyReceiptInput = z.infer<typeof verifyReceiptSchema>['body'];