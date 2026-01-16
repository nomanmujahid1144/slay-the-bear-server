import { z } from 'zod';

// Reusable validations
const nameValidation = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be no more than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

const emailValidation = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be no more than 100 characters');

// Sign Up Schema
export const signUpSchema = z.object({
  body: z.object({
    firstName: nameValidation,
    lastName: nameValidation,
    email: emailValidation,
    password: passwordValidation,
  }),
});


const locationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).optional();

// Validation schema for profile update
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be no more than 50 characters').optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be no more than 50 characters').optional(),
  }),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional().or(z.literal('')),
  location: locationSchema,
});

// Login Schema
export const loginSchema = z.object({
  body: z.object({
    email: emailValidation,
    password: z.string().min(1, 'Password is required'),
  }),
});

// Verify Email Schema
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailValidation,
  }),
});

// Verify Reset Token Schema
export const verifyResetTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

// Change Password Schema
export const changePasswordSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    password: passwordValidation,
    confirmPassword: passwordValidation,
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Refresh Token Schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});


// Refferal Code
export const validateReferralCodeSchema = z.object({
  body: z.object({
    code: z.string().min(6).max(12).regex(/^[A-Z0-9]+$/),
  }),
});


// Types inferred from schemas
export type SignUpInput = z.infer<typeof signUpSchema>['body'];
export type UpdateProfileSchemaInput = z.infer<typeof updateProfileSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];