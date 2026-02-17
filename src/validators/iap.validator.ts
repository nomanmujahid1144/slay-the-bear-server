import { z } from 'zod';

// Verify Receipt Schema
export const verifyReceiptSchema = z.object({
  body: z.object({
    // Raw receipt string from Apple / purchaseToken from Google
    receipt: z
      .string()
      .min(1, 'Receipt is required'),

    // Platform: ios or android
    platform: z.enum(['ios', 'android'], {
      message: 'Platform must be "ios" or "android"',
    }),

    // General purpose productId — not hardcoded to any plan
    // e.g. "com.slaythebear.monthly" or "com.slaythebear.yearly"
    productId: z
      .string()
      .min(1, 'Product ID is required'),

    // Android only — app package name e.g. "com.slaythebear"
    packageName: z
      .string()
      .optional(),
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