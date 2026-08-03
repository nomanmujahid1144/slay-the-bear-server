import { db } from '../db';
import { users } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { PasswordUtil } from '../utils/password';
import { JWTUtil } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';
import { Plan } from '../constants/enums';
import type { AuthResponse } from '../types';
import { ReferralCodeUtil } from '../utils/referralCode';
import { ReferralService } from './referral.service';

export class AuthService {
  /**
   * User Signup - Register new user
   * Converts: /api/users/signup
   */
  static async signup(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<{ message: string; user?: any }> {
    try {
      logger.info(`Signup attempt for email: ${email}`);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        const user = existingUser[0];

        if (user.isVerified) {
          throw ApiError.badRequest('An account with this email address already exists.');
        }

        logger.info(`User exists but not verified, updating password: ${email}`);

        const hashedPassword = await PasswordUtil.hash(password);

        await db
          .update(users)
          .set({
            firstName,
            lastName,
            password: hashedPassword,
          })
          .where(eq(users.id, user.id));

        await EmailService.sendVerificationEmail(email, user.id, firstName);

        logger.info(`Signup retry successful for: ${email}`);

        return {
          message: 'User registered successfully, verification code is sent to your email',
        };
      }

      // Validate referral code if provided
      if (referralCode) {
        const validation = await ReferralCodeUtil.validateCode(referralCode);
        console.log(validation, 'validation')
        if (!validation.valid) {
          throw ApiError.badRequest('Invalid referral code');
        }
      }

      // Create new user with auto-generated referral code
      const hashedPassword = await PasswordUtil.hash(password);
      const newUserReferralCode = await ReferralCodeUtil.generatePersonalizedCode(firstName);

      const [newUser] = await db
        .insert(users)
        .values({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          referralCode: newUserReferralCode,
        })
        .returning();

      console.log(newUser, 'newUser')

      // Apply referral code if provided
      if (referralCode) {
        try {
          await ReferralService.applyReferralCode(newUser.id, referralCode);
          logger.info(`Referral code applied for new user: ${newUser.id}`);
        } catch (error: any) {
          logger.warn(`Failed to apply referral code: ${error.message}`);
        }
      }

      await EmailService.sendVerificationEmail(email, newUser.id, firstName);

      logger.info(`User registered successfully: ${email}`);

      return {
        message: 'User registered successfully',
      };
    } catch (error: any) {
      logger.error('Signup error', { error: error.message, email });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * User Login
   * Converts: /api/users/login
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      logger.info(`Login attempt for email: ${email}`);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.badRequest('Wrong email or password. Try again.');
      }

      const user = existingUser[0];

      const validPassword = await PasswordUtil.compare(password, user.password);

      if (!validPassword) {
        throw ApiError.badRequest('Wrong email or password. Try again.');
      }

      if (!user.isVerified) {
        logger.warn(`Login failed - user not verified: ${email}`);
        throw ApiError.forbidden('Please verify your email to continue');
      }

      const tokens = JWTUtil.generateTokenPair({
        id: user.id,
        email: user.email,
        plan: user.plan as Plan,
      });

      const {
        password: _,
        verifyToken,
        verifyTokenExpiry,
        forgotPasswordToken,
        forgotPasswordTokenExpiry,
        customerId,
        ...userWithoutPassword
      } = user;

      logger.info(`User logged in successfully: ${email}`);

      return {
        user: {
          ...userWithoutPassword,
          plan: user.plan as Plan,
        },
        tokens,
      };
    } catch (error: any) {
      logger.error('Login error', { error: error.message, email });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
     * Verify Email with OTP
     * Converts: /api/users/verifyemail
     */
  static async verifyEmail(email: string, otp: string): Promise<AuthResponse & { message: string }> {
    try {
      logger.info(`Email verification attempt for: ${email}`);

      const existingUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.verifyToken, otp),
            gt(users.verifyTokenExpiry, new Date())
          )
        )
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.badRequest('Invalid or expired code. Please request a new one.');
      }

      const user = existingUser[0];

      await db
        .update(users)
        .set({
          isVerified: true,
          verifyToken: null,
          verifyTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      // Complete referral
      await ReferralService.completeReferral(user.id);

      // Auto sign-in after successful verification
      const tokens = JWTUtil.generateTokenPair({
        id: user.id,
        email: user.email,
        plan: user.plan as Plan,
      });

      const {
        password: _,
        verifyToken,
        verifyTokenExpiry,
        forgotPasswordToken,
        forgotPasswordTokenExpiry,
        customerId,
        ...userWithoutPassword
      } = user;

      logger.info(`Email verified and user signed in: ${user.email}`);

      return {
        message: 'User verified',
        user: {
          ...userWithoutPassword,
          isVerified: true,
          plan: user.plan as Plan,
        },
        tokens,
      };
    } catch (error: any) {
      logger.error('Email verification error', { error: error.message });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Resend Verification OTP
   * Rate limited: one code per 60 seconds
   */
  static async resendOTP(email: string): Promise<{ message: string }> {
    try {
      logger.info(`Resend OTP request for: ${email}`);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.badRequest('No account found with this email address.');
      }

      const user = existingUser[0];

      if (user.isVerified) {
        throw ApiError.badRequest('This account is already verified. Please log in.');
      }

      // Rate limit: OTP expiry is 10 minutes, so lastSentAt = expiry - 10 minutes
      if (user.verifyTokenExpiry) {
        const lastSentAt = new Date(user.verifyTokenExpiry.getTime() - 10 * 60 * 1000);
        const secondsSinceLastSent = (Date.now() - lastSentAt.getTime()) / 1000;

        if (secondsSinceLastSent < 60) {
          const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
          throw ApiError.badRequest(`Please wait ${waitSeconds} seconds before requesting a new code.`);
        }
      }

      await EmailService.sendVerificationEmail(email, user.id, user.firstName);

      logger.info(`Verification OTP resent to: ${email}`);

      return {
        message: 'A new verification code has been sent to your email',
      };
    } catch (error: any) {
      logger.error('Resend OTP error', { error: error.message, email });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }


  /**
   * Forgot Password - Send reset email
   * Converts: /api/users/forget-password
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      logger.info(`Forgot password request for: ${email}`);

      // Find user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.badRequest('Invalid email address');
      }

      const user = existingUser[0];

      // Send password reset email
      await EmailService.sendPasswordResetEmail(email, user.id, user.firstName);

      logger.info(`Password reset email sent to: ${email}`);

      return {
        message: 'We have emailed you a link to reset your password',
      };
    } catch (error: any) {
      logger.error('Forgot password error', { error: error.message, email });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Verify Reset Password Token
   * Converts: /api/users/verify-reset-password
   */
  static async verifyResetToken(token: string): Promise<{ message: string; user: any }> {
    try {
      logger.info('Reset token verification attempt');

      // Find user with valid reset token
      const existingUser = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          isVerified: users.isVerified,
          plan: users.plan,
        })
        .from(users)
        .where(
          and(
            eq(users.forgotPasswordToken, token),
            gt(users.forgotPasswordTokenExpiry, new Date())
          )
        )
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.badRequest('Token is expired. Please try to reset your password again! Thanks');
      }

      const user = existingUser[0];

      // Clear the reset token (already verified)
      await db
        .update(users)
        .set({
          forgotPasswordToken: null,
          forgotPasswordTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      logger.info(`Reset token verified for: ${user.email}`);

      return {
        message: 'Token is verified',
        user,
      };
    } catch (error: any) {
      logger.error('Reset token verification error', { error: error.message });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Change Password (Reset Password)
   * Converts: /api/users/change-password
   */
  static async changePassword(userId: string, password: string): Promise<{ message: string }> {
    try {
      logger.info(`Password change request for user: ${userId}`);

      // Find user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw ApiError.badRequest('User not found');
      }

      const user = existingUser[0];

      // Hash new password
      const hashedPassword = await PasswordUtil.hash(password);

      // Update password
      await db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, userId));

      // Send password changed confirmation email
      await EmailService.sendPasswordChangedEmail(user.email, user.id, user.firstName);

      logger.info(`Password changed successfully for: ${user.email}`);

      return {
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      logger.error('Change password error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Refresh Access Token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      logger.info('Token refresh attempt');

      // Verify refresh token
      const payload = JWTUtil.verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessToken = JWTUtil.generateAccessToken({
        id: payload.id,
        email: payload.email,
        plan: payload.plan,
      });

      logger.info(`Token refreshed successfully for user: ${payload.id}`);

      return {
        accessToken,
      };
    } catch (error: any) {
      logger.error('Token refresh error', { error: error.message });
      throw error instanceof ApiError ? error : ApiError.unauthorized('Invalid refresh token');
    }
  }
}