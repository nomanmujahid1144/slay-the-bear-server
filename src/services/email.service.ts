import { Resend } from 'resend';
import config from '../config';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { PasswordUtil } from '../utils/password';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { VerificationEmail } from '../emails/VerificationEmail';
import { ResetPassword } from '../emails/ResetPassword';
import { MessageOnPasswordChange } from '../emails/MessageOnPasswordChange';
import { JSX } from 'react';

// Initialize Resend
const resend = new Resend(config.RESEND_API_KEY);

export type EmailType = 'VERIFY' | 'RESET' | 'CHANGE_PASSWORD';

interface SendEmailParams {
  email: string;
  emailType: EmailType;
  userId: string;
  username: string;
}

export class EmailService {
  /**
   * Send email based on type (VERIFY, RESET, CHANGE_PASSWORD)
   * Converts the existing sendEmail function from helpers/mailer.js
   */
  static async sendEmail({ email, emailType, userId, username }: SendEmailParams) {
    try {
      logger.info(`Sending ${emailType} email to ${email}`);

      let hashedToken: string | undefined;
      let subject: string;
      let body: JSX.Element;

      const expiryDate = new Date(Date.now() + 3600000); // 1 hour from now

      // Generate token and update user based on email type
      if (emailType === 'VERIFY') {
        // Generate verification token
        hashedToken = await PasswordUtil.generateToken(userId);

        // Update user with verification token
        await db
          .update(users)
          .set({
            verifyToken: hashedToken,
            verifyTokenExpiry: expiryDate,
          })
          .where(eq(users.id, userId));

        subject = `${username}, Please verify your email address`;
        body = VerificationEmail({ username, hashedToken });
      } else if (emailType === 'RESET') {
        // Generate password reset token
        hashedToken = await PasswordUtil.generateToken(userId);

        // Update user with reset token
        await db
          .update(users)
          .set({
            forgotPasswordToken: hashedToken,
            forgotPasswordTokenExpiry: expiryDate,
          })
          .where(eq(users.id, userId));

        subject = `${username}, Reset your Slaythebear.com password`;
        body = ResetPassword({ username, hashedToken });
      } else if (emailType === 'CHANGE_PASSWORD') {
        subject = `${username}, your Slaythebear.com password has been changed`;
        body = MessageOnPasswordChange({ username });
      } else {
        throw ApiError.badRequest('Invalid email type');
      }

      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: config.RESEND_SENDER_EMAIL,
        to: email,
        subject: subject,
        react: body,
      });

      if (error) {
        logger.error('Failed to send email', { error, email, emailType });
        throw ApiError.internal(`Failed to send ${emailType} email: ${error.message}`);
      }

      logger.info(`${emailType} email sent successfully`, { email, messageId: data?.id });
      return data;
    } catch (error: any) {
      logger.error('Email service error', { error: error.message, email, emailType });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  // Send verification email to user
  static async sendVerificationEmail(email: string, userId: string, username: string) {
    return this.sendEmail({
      email,
      emailType: 'VERIFY',
      userId,
      username,
    });
  }

  // Send password reset email to user
  static async sendPasswordResetEmail(email: string, userId: string, username: string) {
    return this.sendEmail({
      email,
      emailType: 'RESET',
      userId,
      username,
    });
  }

  // Send password changed confirmation email to user
  static async sendPasswordChangedEmail(email: string, userId: string, username: string) {
    return this.sendEmail({
      email,
      emailType: 'CHANGE_PASSWORD',
      userId,
      username,
    });
  }
}