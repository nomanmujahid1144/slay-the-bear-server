import Stripe from 'stripe';
import config from '../config';
import { UserService } from './user.service';
import { db } from '../db';
import { subscriptions, subscriptionEntries } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Plan } from '../constants/enums';

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

export class StripeService {
  /**
   * Create Stripe Checkout Session
   * Called when user clicks on Monthly/Yearly plan
   */
  static async createCheckoutSession(
    userId: string,
    priceId: string,
    period: 'monthly' | 'yearly'
  ): Promise<{ url: string }> {
    try {
      logger.info(`Creating checkout session for user: ${userId}`);

      // Get user details
      const user = await UserService.getUserById(userId);

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Get or create Stripe customer
      let customerId = user.customerId;

      if (!customerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
          },
        });

        customerId = customer.id;

        // Save customer ID to database
        await UserService.updateCustomerId(userId, customerId);

        logger.info(`Created Stripe customer: ${customerId} for user: ${userId}`);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer: customerId,
        metadata: {
          userId: user.id,
          period: period,
        },
        success_url: `${config.FRONTEND_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.FRONTEND_URL}/pricing`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 30, // 30 minutes
      });

      logger.info(`Checkout session created: ${session.id} for user: ${userId}`);

      return { url: session.url! };
    } catch (error: any) {
      logger.error('Create checkout session error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get Session Details (for success page)
   * Called on /purchase-success page
   */
  static async getSessionDetails(sessionId: string): Promise<{
    invoiceId: string;
    amount: number;
    period: string;
    startDate: number;
    endDate: number;
  }> {
    try {
      logger.info(`Retrieving session details: ${sessionId}`);

      // Retrieve session
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session.subscription) {
        throw ApiError.badRequest('No subscription found in session');
      }

      // Retrieve subscription
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Retrieve invoice
      const invoice = await stripe.invoices.retrieve(
        subscription.latest_invoice as string
      );

      const details = {
        invoiceId: (invoice as any).number || 'N/A',
        amount: subscription.items.data[0].price.unit_amount! / 100,
        period: subscription.items.data[0].price.recurring!.interval,
        startDate: (subscription as any).current_period_start * 1000,
        endDate: (subscription as any).current_period_end * 1000,
      };

      logger.info('Session details retrieved', { sessionId, details });

      return details;
    } catch (error: any) {
      logger.error('Get session details error', { error: error.message, sessionId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Cancel Subscription
   * Cancel at period end (user keeps access until billing cycle ends)
   */
  static async cancelSubscription(userId: string): Promise<{ message: string }> {
    try {
      logger.info(`Canceling subscription for user: ${userId}`);

      const user = await UserService.getUserById(userId);

      if (!user.customerId) {
        throw ApiError.badRequest('No customer ID found');
      }

      // Get active subscriptions
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: user.customerId,
        status: 'active',
      });

      if (stripeSubscriptions.data.length === 0) {
        throw ApiError.notFound('No active subscription found');
      }

      // Cancel at period end (doesn't immediately revoke access)
      await stripe.subscriptions.update(stripeSubscriptions.data[0].id, {
        cancel_at_period_end: true,
      });

      logger.info(`Subscription canceled for user: ${userId}`);

      return {
        message: 'Subscription will be canceled at the end of billing period',
      };
    } catch (error: any) {
      logger.error('Cancel subscription error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Reactivate Subscription (if canceled but still active)
   */
  static async reactivateSubscription(userId: string): Promise<{ message: string }> {
    try {
      logger.info(`Reactivating subscription for user: ${userId}`);

      const user = await UserService.getUserById(userId);

      if (!user.customerId) {
        throw ApiError.badRequest('No customer ID found');
      }

      // Get subscriptions set to cancel
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: user.customerId,
        status: 'active',
      });

      if (stripeSubscriptions.data.length === 0) {
        throw ApiError.notFound('No subscription found');
      }

      const subscription = stripeSubscriptions.data[0];

      if (!subscription.cancel_at_period_end) {
        throw ApiError.badRequest('Subscription is not set to cancel');
      }

      // Remove cancellation
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      logger.info(`Subscription reactivated for user: ${userId}`);

      return {
        message: 'Subscription reactivated successfully',
      };
    } catch (error: any) {
      logger.error('Reactivate subscription error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

  /**
   * Get Customer Portal URL
   * Allows users to manage their subscription in Stripe
   */
  static async getCustomerPortalUrl(userId: string): Promise<{ url: string }> {
    try {
      logger.info(`Getting customer portal URL for user: ${userId}`);

      const user = await UserService.getUserById(userId);

      if (!user.customerId) {
        throw ApiError.badRequest('No customer ID found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.customerId,
        return_url: `${config.FRONTEND_URL}/dashboard`,
      });

      logger.info(`Customer portal URL created for user: ${userId}`);

      return { url: session.url };
    } catch (error: any) {
      logger.error('Get customer portal error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }
}

export { stripe };