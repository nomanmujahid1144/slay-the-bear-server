import Stripe from 'stripe';
import { stripe } from './stripe.service';
import { UserService } from './user.service';
import { db } from '../db';
import { users, subscriptions, subscriptionEntries } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Plan } from '../constants/enums';
import config from '../config';

export class WebhookService {

  // ── Helper: map priceId → correct Plan ──────────────────────────────────
  private static getPlanFromPriceId(priceId: string): Plan {
    const basicPriceIds = [
      config.STRIPE_BASIC_MONTHLY_PRICE_ID,
      config.STRIPE_BASIC_YEARLY_PRICE_ID,
    ];
    const premiumPriceIds = [
      config.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      config.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    ];

    if (basicPriceIds.includes(priceId)) return Plan.BASIC;
    if (premiumPriceIds.includes(priceId)) return Plan.PREMIUM;

    throw new Error(`Unknown price ID: ${priceId}`);
  }

  // ── Helper: map priceId → period ────────────────────────────────────────
  private static getPeriodFromPriceId(priceId: string): 'monthly' | 'yearly' {
    const yearlyPriceIds = [
      config.STRIPE_BASIC_YEARLY_PRICE_ID,
      config.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    ];
    return yearlyPriceIds.includes(priceId) ? 'yearly' : 'monthly';
  }

  /**
   * Verify Stripe Webhook Signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error: any) {
      logger.error('Webhook signature verification failed', { error: error.message });
      throw ApiError.badRequest(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Handle Stripe Webhook Events
   */
  static async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Processing webhook: ${event.type}`, { eventId: event.id });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error: any) {
      logger.error('Webhook handler error', {
        eventType: event.type,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle: checkout.session.completed
   * Triggered when user completes checkout
   */
  private static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    logger.info('Processing checkout.session.completed', { sessionId: session.id });

    // Expand session to get line items and invoice
    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'invoice'],
    });

    const customerEmail = expandedSession.customer_details?.email;

    if (!customerEmail) {
      throw new Error('Customer email not found in session');
    }

    // Find user by email
    const user = await UserService.getUserByEmail(customerEmail);

    if (!user) {
      throw new Error(`User not found for email: ${customerEmail}`);
    }

    // Update customer ID if not already set
    if (!user.customerId && expandedSession.customer) {
      await UserService.updateCustomerId(user.id, expandedSession.customer as string);
    }

    // Process subscription
    const lineItems = expandedSession.line_items?.data || [];

    for (const item of lineItems) {
      const priceId = item.price?.id;
      const isSubscription = item.price?.type === 'recurring';

      if (isSubscription && priceId) {
        // Determine plan and period from priceId — not hardcoded
        const plan = this.getPlanFromPriceId(priceId);
        const period = this.getPeriodFromPriceId(priceId);

        let endDate = new Date();
        if (period === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Get invoice details
        const invoice = expandedSession.invoice as Stripe.Invoice;

        // Create or update subscription record
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, user.id))
          .limit(1);

        let subscriptionId: string;

        if (existingSubscription.length > 0) {
          // Update existing subscription
          await db
            .update(subscriptions)
            .set({
              plan: plan,
              period: period,
              startDate: new Date(),
              endDate: endDate,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, user.id));

          subscriptionId = existingSubscription[0].id;
        } else {
          // Create new subscription
          const [newSubscription] = await db
            .insert(subscriptions)
            .values({
              userId: user.id,
              plan: plan,
              period: period,
              startDate: new Date(),
              endDate: endDate,
            })
            .returning();

          subscriptionId = newSubscription.id;
        }

        // Add subscription entry (invoice record)
        await db.insert(subscriptionEntries).values({
          subscriptionId: subscriptionId,
          invoiceId: invoice.number || 'N/A',
          amount: ((item.price?.unit_amount || 0) / 100).toString(),
          status: 'Subscribed',
          startDate: new Date(),
          endDate: endDate,
          viewURL: invoice.hosted_invoice_url || null,
          downloadURL: invoice.invoice_pdf || null,
        });

        // Update user plan
        await UserService.updateUserPlan(user.id, plan);

        logger.info('Subscription created successfully', {
          userId: user.id,
          plan,
          period,
        });
      }
    }
  }

  /**
   * Handle: customer.subscription.created
   */
  private static async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    logger.info('Processing subscription.created', {
      subscriptionId: subscription.id,
    });

    // Already handled in checkout.session.completed
    // This is a backup/confirmation event
  }

  /**
   * Handle: customer.subscription.updated
   * Triggered when subscription is modified (e.g., plan change, renewal)
   */
  private static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    logger.info('Processing subscription.updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    const customerId = subscription.customer as string;

    // Find user by customer ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.customerId, customerId))
      .limit(1);

    if (user.length === 0) {
      throw new Error(`User not found for customer: ${customerId}`);
    }

    const userId = user[0].id;

    // Handle renewal or reactivation
    if (subscription.status === 'active') {
      const priceId = subscription.items.data[0].price.id;

      // Determine plan and period from priceId — not hardcoded
      const plan = this.getPlanFromPriceId(priceId);
      const period = this.getPeriodFromPriceId(priceId);
      const endDate = new Date((subscription as any).current_period_end * 1000);

      // Update subscription
      await db
        .update(subscriptions)
        .set({
          plan: plan,
          period: period,
          endDate: endDate,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));

      // Update user plan
      await UserService.updateUserPlan(userId, plan);

      logger.info('Subscription updated to active', { userId, plan, period });
    }
  }

  /**
   * Handle: customer.subscription.deleted
   * Triggered when subscription is canceled/expired
   */
  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    logger.info('Processing subscription.deleted', {
      subscriptionId: subscription.id,
    });

    const customerId = subscription.customer as string;

    // Find user by customer ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.customerId, customerId))
      .limit(1);

    if (user.length === 0) {
      throw new Error(`User not found for customer: ${customerId}`);
    }

    const userId = user[0].id;

    // Get user's subscription record
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSubscription.length > 0) {
      const subscriptionId = userSubscription[0].id;

      // Get latest invoice
      const latestInvoice = await stripe.invoices.retrieve(
        subscription.latest_invoice as string
      );

      // Update subscription entry status to Canceled
      await db
        .update(subscriptionEntries)
        .set({
          status: 'Canceled',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptionEntries.subscriptionId, subscriptionId),
            eq(subscriptionEntries.invoiceId, latestInvoice.number || 'N/A')
          )
        );

      // Update subscription plan to free
      await db
        .update(subscriptions)
        .set({
          plan: Plan.FREE,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));
    }

    // Update user plan to free
    await UserService.updateUserPlan(userId, Plan.FREE);

    logger.info('Subscription canceled, user downgraded to free', { userId });
  }

  /**
   * Handle: invoice.payment_succeeded
   * Triggered on successful recurring payment
   */
  private static async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    logger.info('Processing invoice.payment_succeeded', {
      invoiceId: invoice.id,
    });

    // If this is a subscription renewal, add new invoice entry
    if ((invoice as any).subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        (invoice as any).subscription as string
      );

      const customerId = subscription.customer as string;

      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.customerId, customerId))
        .limit(1);

      if (user.length === 0) {
        throw new Error(`User not found for customer: ${customerId}`);
      }

      const userId = user[0].id;

      // Get user's subscription
      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (userSubscription.length > 0) {
        const subscriptionId = userSubscription[0].id;
        const periodStart = (subscription as any).current_period_start;
        const periodEnd = (subscription as any).current_period_end;
        const endDate = periodEnd ? new Date(periodEnd * 1000) : new Date();
        const startDate = periodStart ? new Date(periodStart * 1000) : new Date();

        // Add new invoice entry for renewal
        await db.insert(subscriptionEntries).values({
          subscriptionId: subscriptionId,
          invoiceId: (invoice as any).number || 'N/A',
          amount: (((invoice as any).amount_paid || 0) / 100).toString(),
          status: 'Renewal',
          startDate: startDate,
          endDate: endDate,
          viewURL: (invoice as any).hosted_invoice_url || null,
          downloadURL: (invoice as any).invoice_pdf || null,
        });

        // Update subscription end date
        await db
          .update(subscriptions)
          .set({
            endDate: endDate,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        logger.info('Subscription renewed successfully', { userId });
      }
    }
  }

  /**
   * Handle: invoice.payment_failed
   * Triggered when payment fails
   */
  private static async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<void> {
    logger.warn('Processing invoice.payment_failed', {
      invoiceId: invoice.id,
    });

    // Log the failure - you might want to send an email notification
    logger.warn('Payment failed for invoice', {
      invoiceId: invoice.id,
      customerEmail: invoice.customer_email,
    });

    // Note: Don't immediately downgrade - Stripe will retry
    // Only downgrade after all retries fail (subscription.deleted event)
  }
}