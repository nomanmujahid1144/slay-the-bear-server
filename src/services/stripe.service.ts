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
    period: 'monthly' | 'yearly',
    planType: 'basic' | 'premium'
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
          planType: planType,
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

  /**
   * Change Plan (Upgrade or Downgrade)
   * Upgrade → immediate with proration
   * Downgrade → scheduled at period end
   */
  static async changePlan(
    userId: string,
    planType: 'basic' | 'premium',
    period: 'monthly' | 'yearly'
  ): Promise<{
    message: string;
    changeType: 'upgrade' | 'downgrade';
    effectiveDate: string;
    newPlan: string;
    newPeriod: string;
  }> {
    try {
      logger.info(`Change plan request for user: ${userId}, plan: ${planType}, period: ${period}`);

      // Step 1: Get user
      const user = await UserService.getUserById(userId);

      if (!user.customerId) {
        throw ApiError.badRequest('No active subscription found. Please subscribe first.');
      }

      // Step 2: Get current active Stripe subscription
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: user.customerId,
        status: 'active',
        limit: 1,
      });

      if (stripeSubscriptions.data.length === 0) {
        throw ApiError.notFound('No active subscription found. Please subscribe first.');
      }

      const currentSubscription = stripeSubscriptions.data[0];
      const currentPriceId = currentSubscription.items.data[0].price.id;

      // Step 3: Determine new priceId from planType + period
      const newPriceId =
        planType === 'basic' && period === 'monthly' ? config.STRIPE_BASIC_MONTHLY_PRICE_ID :
          planType === 'basic' && period === 'yearly' ? config.STRIPE_BASIC_YEARLY_PRICE_ID :
            planType === 'premium' && period === 'monthly' ? config.STRIPE_PREMIUM_MONTHLY_PRICE_ID :
              config.STRIPE_PREMIUM_YEARLY_PRICE_ID;

      // Step 4: Check if user is already on the same plan
      if (currentPriceId === newPriceId) {
        throw ApiError.badRequest(`You are already on the ${planType} ${period} plan.`);
      }

      // Step 5: Determine if this is upgrade or downgrade
      // Premium > Basic in terms of plan value
      // Yearly > Monthly in terms of period value
      const planHierarchy: Record<string, number> = {
        [config.STRIPE_BASIC_MONTHLY_PRICE_ID]: 1,
        [config.STRIPE_BASIC_YEARLY_PRICE_ID]: 2,
        [config.STRIPE_PREMIUM_MONTHLY_PRICE_ID]: 3,
        [config.STRIPE_PREMIUM_YEARLY_PRICE_ID]: 4,
      };

      const currentRank = planHierarchy[currentPriceId] ?? 0;
      const newRank = planHierarchy[newPriceId] ?? 0;
      const isUpgrade = newRank > currentRank;

      // Step 6: Apply the change
      if (isUpgrade) {
        // UPGRADE → immediate with proration
        // Stripe charges the difference right away
        await stripe.subscriptions.update(currentSubscription.id, {
          items: [
            {
              id: currentSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations', // Charge difference immediately
        });

        logger.info(`Plan upgraded immediately for user: ${userId} → ${planType} ${period}`);

        return {
          message: `Successfully upgraded to ${planType} ${period} plan. The price difference has been charged immediately.`,
          changeType: 'upgrade',
          effectiveDate: 'Immediately',
          newPlan: planType,
          newPeriod: period,
        };
      } else {
        // DOWNGRADE → schedule at period end
        // User keeps current plan until billing period ends
        // Better UX — no partial refunds, no confusion
        await stripe.subscriptions.update(currentSubscription.id, {
          items: [
            {
              id: currentSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'none',         // No immediate charge/refund
          billing_cycle_anchor: 'unchanged',  // Keep current billing cycle
        });

        // Calculate when downgrade takes effect (next billing date)
        const currentPeriodEnd = (currentSubscription as any).current_period_end;
        const periodEnd = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000)
          : new Date();

        logger.info(`Plan downgrade scheduled for user: ${userId} → ${planType} ${period} at ${periodEnd}`);

        return {
          message: `Your plan will be downgraded to ${planType} ${period} at the end of your current billing period.`,
          changeType: 'downgrade',
          effectiveDate: currentPeriodEnd ? periodEnd.toISOString() : 'End of billing period',
          newPlan: planType,
          newPeriod: period,
        };
      }
    } catch (error: any) {
      logger.error('Change plan error', { error: error.message, userId });
      throw error instanceof ApiError ? error : ApiError.internal(error.message);
    }
  }

}

export { stripe };