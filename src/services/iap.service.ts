import axios from 'axios';
import { db } from '../db';
import { users, iapTransactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { UserService } from './user.service';
import config from '../config';
import { Plan } from '../constants/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IAPPlatform = 'ios' | 'android';
export type IAPEnvironment = 'sandbox' | 'production';

interface ValidatedReceipt {
  isValid: boolean;
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: Date;
  expiryDate: Date;
  autoRenewing: boolean;
  environment: IAPEnvironment;
}

// ─── IAP Service ──────────────────────────────────────────────────────────────

export class IAPService {

  // ── Apple Receipt Validation ─────────────────────────────────────────────

  private static async validateAppleReceipt(receipt: string): Promise<ValidatedReceipt> {
    try {
      logger.info('Validating Apple receipt...');

      // Always try production first, fallback to sandbox
      // Apple recommends this approach
      let response = await axios.post(config.APPLE_PRODUCTION_URL, {
        'receipt-data': receipt,
        'password': config.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      });

      // Status 21007 means receipt is from sandbox — retry with sandbox URL
      if (response.data.status === 21007) {
        logger.info('Apple receipt is sandbox — retrying with sandbox URL');
        response = await axios.post(config.APPLE_SANDBOX_URL, {
          'receipt-data': receipt,
          'password': config.APPLE_SHARED_SECRET,
          'exclude-old-transactions': true,
        });
      }

      // Any status other than 0 means invalid receipt
      if (response.data.status !== 0) {
        logger.error(`Apple receipt validation failed with status: ${response.data.status}`);
        throw ApiError.badRequest(`Invalid Apple receipt (status: ${response.data.status})`);
      }

      // Get the latest receipt info (most recent transaction)
      const latestReceiptInfo = response.data.latest_receipt_info;

      if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
        throw ApiError.badRequest('No receipt info found in Apple response');
      }

      // Apple returns array — take the most recent one (last in array)
      const latest = latestReceiptInfo[latestReceiptInfo.length - 1];

      const environment: IAPEnvironment =
        response.data.environment === 'Production' ? 'production' : 'sandbox';

      return {
        isValid: true,
        transactionId: latest.transaction_id,
        originalTransactionId: latest.original_transaction_id,
        productId: latest.product_id,
        purchaseDate: new Date(parseInt(latest.purchase_date_ms)),
        expiryDate: new Date(parseInt(latest.expires_date_ms)),
        autoRenewing: latest.cancellation_date == null,
        environment,
      };
    } catch (error: any) {
      logger.error('Apple receipt validation error', { error: error.message });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to validate Apple receipt');
    }
  }

  // ── Google Receipt Validation ────────────────────────────────────────────

  private static async getGoogleAccessToken(): Promise<string> {
    try {
      // Use Google service account to get access token
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: config.GOOGLE_SERVICE_ACCOUNT_KEY,
        }
      );
      return response.data.access_token;
    } catch (error: any) {
      logger.error('Failed to get Google access token', { error: error.message });
      throw ApiError.internal('Failed to authenticate with Google Play');
    }
  }

  private static async validateGoogleReceipt(
    receipt: string,         // purchaseToken from mobile
    productId: string,       // subscription product ID
    packageName: string      // app package name e.g. com.slaythebear
  ): Promise<ValidatedReceipt> {
    try {
      logger.info('Validating Google receipt...');

      const accessToken = await this.getGoogleAccessToken();

      // Call Google Play Developer API
      const response = await axios.get(
        `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${receipt}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = response.data;

      // paymentState: 1 = received, 0 = pending
      if (data.paymentState !== 1) {
        throw ApiError.badRequest('Google receipt payment is not completed');
      }

      return {
        isValid: true,
        transactionId: data.orderId,
        originalTransactionId: data.orderId.split('..')[0], // Base order ID without renewal suffix
        productId,
        purchaseDate: new Date(parseInt(data.startTimeMillis)),
        expiryDate: new Date(parseInt(data.expiryTimeMillis)),
        autoRenewing: data.autoRenewing === true,
        environment: 'production', // Google doesn't have sandbox distinction in API response
      };
    } catch (error: any) {
      logger.error('Google receipt validation error', { error: error.message });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to validate Google receipt');
    }
  }

  // ── Main Validation Entry Point ──────────────────────────────────────────

  private static async validateReceipt(
    receipt: string,
    platform: IAPPlatform,
    productId: string,
    packageName?: string
  ): Promise<ValidatedReceipt> {
    if (platform === 'ios') {
      return await this.validateAppleReceipt(receipt);
    } else {
      if (!packageName) {
        throw ApiError.badRequest('packageName is required for Android validation');
      }
      return await this.validateGoogleReceipt(receipt, productId, packageName);
    }
  }

  // ── Public Methods ───────────────────────────────────────────────────────

  /**
   * Verify Receipt & Activate Subscription
   * Called when user completes purchase on mobile
   */
  static async verifyReceipt(
    userId: string,
    receipt: string,
    platform: IAPPlatform,
    productId: string,
    packageName?: string
  ) {
    try {
      logger.info(`Verifying IAP receipt for user: ${userId}, platform: ${platform}`);

      // Step 1: Validate receipt with Apple/Google
      const validated = await this.validateReceipt(receipt, platform, productId, packageName);

      // Step 2: Check if this exact transaction was already processed (idempotency)
      const existingTransaction = await db
        .select()
        .from(iapTransactions)
        .where(eq(iapTransactions.transactionId, validated.transactionId))
        .limit(1);

      if (existingTransaction.length > 0) {
        logger.info(`Transaction ${validated.transactionId} already processed`);
        return {
          status: 'active',
          expiryDate: existingTransaction[0].expiryDate,
          autoRenewing: existingTransaction[0].autoRenewing,
          platform,
          productId: validated.productId,
          alreadyProcessed: true,
        };
      }

      // Step 3: Save transaction to iap_transactions table
      await db.insert(iapTransactions).values({
        userId,
        transactionId: validated.transactionId,
        originalTransactionId: validated.originalTransactionId,
        productId: validated.productId,
        platform,
        environment: validated.environment,
        purchaseDate: validated.purchaseDate,
        expiryDate: validated.expiryDate,
        status: 'active',
        autoRenewing: validated.autoRenewing,
        receipt,
      });

      // Map productId → correct plan
      // Product IDs must contain 'basic' or 'premium' e.g:
      // com.slaythebear.basic.monthly / com.slaythebear.premium.yearly
      const plan = validated.productId.toLowerCase().includes('basic')
        ? Plan.BASIC
        : Plan.PREMIUM;

      // Step 4: Update user → correct plan + store original_transaction_id
      await db
        .update(users)
        .set({
          plan: plan,
          iapOriginalTransactionId: validated.originalTransactionId,
          iapPlatform: platform,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info(`IAP subscription activated for user: ${userId}, product: ${validated.productId}`);

      return {
        status: 'active',
        plan: plan,
        expiryDate: validated.expiryDate,
        autoRenewing: validated.autoRenewing,
        platform,
        productId: validated.productId,
        alreadyProcessed: false,
      };
    } catch (error: any) {
      logger.error('IAP verify receipt error', { error: error.message, userId });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to verify receipt');
    }
  }

  /**
   * Get Subscription Status
   * Called on app launch to check if user is still premium
   */
  static async getSubscriptionStatus(userId: string) {
    try {
      logger.info(`Getting IAP subscription status for user: ${userId}`);

      const user = await UserService.getUserById(userId);

      // Get the most recent active transaction for this user
      const latestTransaction = await db
        .select()
        .from(iapTransactions)
        .where(
          and(
            eq(iapTransactions.userId, userId),
            eq(iapTransactions.status, 'active')
          )
        )
        .orderBy(iapTransactions.expiryDate)
        .limit(1);

      if (latestTransaction.length === 0) {
        return {
          isActive: false,
          status: 'inactive',
          expiryDate: null,
          platform: null,
          productId: null,
          autoRenewing: false,
        };
      }

      const transaction = latestTransaction[0];
      const now = new Date();
      const isActive = transaction.expiryDate > now && transaction.status === 'active';

      return {
        isActive,
        status: isActive ? 'active' : 'expired',
        expiryDate: transaction.expiryDate,
        platform: transaction.platform,
        productId: transaction.productId,
        autoRenewing: transaction.autoRenewing,
        environment: transaction.environment,
      };
    } catch (error: any) {
      logger.error('Get IAP status error', { error: error.message, userId });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to get subscription status');
    }
  }

  /**
   * Restore Purchase
   * Called when user reinstalls app — re-validates existing receipt
   */
  static async restorePurchase(
    userId: string,
    receipt: string,
    platform: IAPPlatform,
    productId: string,
    packageName?: string
  ) {
    try {
      logger.info(`Restoring IAP purchase for user: ${userId}`);

      // Re-validate the receipt — same as verify but with restore context
      const result = await this.verifyReceipt(userId, receipt, platform, productId, packageName);

      logger.info(`IAP purchase restored for user: ${userId}`);

      return {
        ...result,
        restored: true,
      };
    } catch (error: any) {
      logger.error('Restore IAP purchase error', { error: error.message, userId });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to restore purchase');
    }
  }

  /**
   * Cancel Subscription
   * Note: We don't cancel with Apple/Google — stores handle billing
   * We just mark our DB. User keeps access until expiry date.
   */
  static async cancelSubscription(userId: string) {
    try {
      logger.info(`Cancelling IAP subscription for user: ${userId}`);

      // Get user's active transaction
      const activeTransaction = await db
        .select()
        .from(iapTransactions)
        .where(
          and(
            eq(iapTransactions.userId, userId),
            eq(iapTransactions.status, 'active')
          )
        )
        .limit(1);

      if (activeTransaction.length === 0) {
        throw ApiError.notFound('No active subscription found');
      }

      // Mark as cancelled in our DB
      // User keeps access until expiryDate — same behaviour as Stripe cancel_at_period_end
      await db
        .update(iapTransactions)
        .set({
          autoRenewing: false,
          updatedAt: new Date(),
        })
        .where(eq(iapTransactions.userId, userId));

      logger.info(`IAP subscription cancelled for user: ${userId}`);

      return {
        message: 'Subscription cancelled. You will retain access until the end of your billing period.',
        expiryDate: activeTransaction[0].expiryDate,
      };
    } catch (error: any) {
      logger.error('Cancel IAP subscription error', { error: error.message, userId });
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to cancel subscription');
    }
  }

  // ── Webhook Handlers ─────────────────────────────────────────────────────

  /**
   * Handle Apple Server Notifications
   * Apple calls this URL automatically on renewal, failure, cancellation
   */
  static async handleAppleWebhook(notification: any) {
    try {
      const notificationType = notification.notification_type ||
        notification.notificationType;

      logger.info(`Apple webhook received: ${notificationType}`);

      const latestReceiptInfo =
        notification.unified_receipt?.latest_receipt_info?.[0] ||
        notification.data?.signedTransactionInfo;

      if (!latestReceiptInfo) {
        logger.warn('Apple webhook: no receipt info found');
        return;
      }

      const originalTransactionId = latestReceiptInfo.original_transaction_id;
      const expiresDateMs = latestReceiptInfo.expires_date_ms;
      const transactionId = latestReceiptInfo.transaction_id;

      // Find user by original_transaction_id
      const user = await db
        .select()
        .from(users)
        .where(eq(users.iapOriginalTransactionId, originalTransactionId))
        .limit(1);

      if (user.length === 0) {
        logger.warn(`Apple webhook: no user found for original_transaction_id: ${originalTransactionId}`);
        return;
      }

      const userId = user[0].id;

      switch (notificationType) {
        case 'DID_RENEW':
        case 'INITIAL_BUY':
          // Map productId → correct plan
          const appleProductId = latestReceiptInfo.product_id as string;
          const appleRenewPlan = appleProductId.toLowerCase().includes('basic')
            ? Plan.BASIC
            : Plan.PREMIUM;

          // Subscription renewed — extend expiry date + insert new transaction
          await db.insert(iapTransactions).values({
            userId,
            transactionId,
            originalTransactionId,
            productId: appleProductId,
            platform: 'ios',
            environment: latestReceiptInfo.environment === 'Production' ? 'production' : 'sandbox',
            purchaseDate: new Date(parseInt(latestReceiptInfo.purchase_date_ms)),
            expiryDate: new Date(parseInt(expiresDateMs)),
            status: 'active',
            autoRenewing: true,
          }).onConflictDoNothing();

          await db.update(users)
            .set({ plan: appleRenewPlan, updatedAt: new Date() })
            .where(eq(users.id, userId));

          logger.info(`Apple webhook DID_RENEW: user ${userId} renewed to ${appleRenewPlan}`);
          break;

        case 'DID_FAIL_TO_RENEW':
          // Payment failed — put in grace period
          await db.update(iapTransactions)
            .set({ status: 'grace_period', updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          logger.info(`Apple webhook DID_FAIL_TO_RENEW: user ${userId} in grace period`);
          break;

        case 'CANCEL':
        case 'DID_CHANGE_RENEWAL_STATUS':
          // User cancelled auto-renewal
          await db.update(iapTransactions)
            .set({ autoRenewing: false, updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          logger.info(`Apple webhook CANCEL: user ${userId} auto-renewal disabled`);
          break;

        case 'EXPIRED':
          // Subscription fully expired — downgrade to free
          await db.update(iapTransactions)
            .set({ status: 'expired', updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          await db.update(users)
            .set({ plan: 'free', updatedAt: new Date() })
            .where(eq(users.id, userId));

          logger.info(`Apple webhook EXPIRED: user ${userId} downgraded to free`);
          break;

        default:
          logger.info(`Apple webhook: unhandled notification type: ${notificationType}`);
      }
    } catch (error: any) {
      logger.error('Apple webhook handler error', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle Google Play Server Notifications
   * Google calls this URL via Pub/Sub on renewal, failure, cancellation
   */
  static async handleGoogleWebhook(message: any) {
    try {
      // Google sends base64 encoded message
      const decodedData = JSON.parse(
        Buffer.from(message.data, 'base64').toString()
      );

      const notificationType =
        decodedData.subscriptionNotification?.notificationType;
      const purchaseToken =
        decodedData.subscriptionNotification?.purchaseToken;
      const productId =
        decodedData.subscriptionNotification?.subscriptionId;

      logger.info(`Google webhook received: type ${notificationType}`);

      // Find user by purchase token (stored as receipt in our DB)
      const transaction = await db
        .select()
        .from(iapTransactions)
        .where(eq(iapTransactions.receipt, purchaseToken))
        .limit(1);

      if (transaction.length === 0) {
        logger.warn(`Google webhook: no transaction found for purchaseToken`);
        return;
      }

      const userId = transaction[0].userId;

      // Google notification types:
      // 1 = RECOVERED, 2 = RENEWED, 3 = CANCELED, 4 = PURCHASED
      // 5 = ON_HOLD, 6 = IN_GRACE_PERIOD, 7 = RESTARTED, 10 = EXPIRED
      switch (notificationType) {
        case 1: // SUBSCRIPTION_RECOVERED
        case 2: // SUBSCRIPTION_RENEWED
        case 1: // SUBSCRIPTION_RECOVERED
        case 2: // SUBSCRIPTION_RENEWED
        case 4: // SUBSCRIPTION_PURCHASED
          // Map productId → correct plan
          const googleRenewPlan = productId.toLowerCase().includes('basic')
            ? Plan.BASIC
            : Plan.PREMIUM;

          await db.update(iapTransactions)
            .set({ status: 'active', autoRenewing: true, updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          await db.update(users)
            .set({ plan: googleRenewPlan, updatedAt: new Date() })
            .where(eq(users.id, userId));

          logger.info(`Google webhook type ${notificationType}: user ${userId} activated to ${googleRenewPlan}`);
          break;

        case 3: // SUBSCRIPTION_CANCELED
          await db.update(iapTransactions)
            .set({ autoRenewing: false, updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          logger.info(`Google webhook CANCELED: user ${userId} auto-renewal disabled`);
          break;

        case 5: // SUBSCRIPTION_ON_HOLD
        case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
          await db.update(iapTransactions)
            .set({ status: 'grace_period', updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          logger.info(`Google webhook type ${notificationType}: user ${userId} in grace period`);
          break;

        case 10: // SUBSCRIPTION_EXPIRED
          await db.update(iapTransactions)
            .set({ status: 'expired', updatedAt: new Date() })
            .where(eq(iapTransactions.userId, userId));

          await db.update(users)
            .set({ plan: 'free', updatedAt: new Date() })
            .where(eq(users.id, userId));

          logger.info(`Google webhook EXPIRED: user ${userId} downgraded to free`);
          break;

        default:
          logger.info(`Google webhook: unhandled notification type: ${notificationType}`);
      }
    } catch (error: any) {
      logger.error('Google webhook handler error', { error: error.message });
      throw error;
    }
  }
}