import axios, { AxiosInstance } from 'axios';
import { db } from '../db';
import { tradierAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import config from '../config';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import {
    TradierRawTokenResponse,
    TradierRawProfile,
    TradierRawBalances,
    TradierRawPositions,
    TradierRawOrders,
    TradierRawOrder,
    TradierRawOrderResponse,
    TradierRawHistory,
    TradierRawGainLoss,
    TradierPosition,
    TradierOrder,
    TradierHistoryEvent,
    TradierClosedPosition,
} from '../types/trading/trading-response.types';
import {
    TradierOrderType,
    TradierOrderSide,
    TradierOrderDuration,
} from '../types/trading/trading-request.types';

export class TradingService {

    // ============================================
    // PRIVATE: AXIOS CLIENT FACTORY
    // Creates an axios instance with user's token
    // ============================================

    private static getClient(accessToken: string): AxiosInstance {
        return axios.create({
            baseURL: config.TRADIER_SANDBOX_URL,
            timeout: 15000,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });
    }

    // ============================================
    // PRIVATE: GET USER'S TRADIER ACCOUNT
    // Fetches connected account from DB
    // ============================================

    private static async getUserTradierAccount(userId: string) {
        const accounts = await db
            .select()
            .from(tradierAccounts)
            .where(eq(tradierAccounts.userId, userId))
            .limit(1);

        if (accounts.length === 0) {
            throw ApiError.notFound('No Tradier account connected. Please connect your Tradier account first.');
        }

        const account = accounts[0];

        if (!account.isActive) {
            throw ApiError.forbidden('Your Tradier account is disconnected. Please reconnect your account.');
        }

        return account;
    }

    // ============================================
    // PRIVATE: NORMALISERS
    // Convert raw Tradier response → clean shape
    // ============================================

    private static normaliseOrder(raw: TradierRawOrder): TradierOrder {
        return {
            id: raw.id,
            symbol: raw.symbol,
            type: raw.type,
            side: raw.side,
            quantity: raw.quantity,
            status: raw.status,
            duration: raw.duration,
            price: raw.price,
            stopPrice: raw.stop_price,
            avgFillPrice: raw.avg_fill_price,
            execQuantity: raw.exec_quantity,
            remainingQuantity: raw.remaining_quantity,
            createDate: raw.create_date,
            transactionDate: raw.transaction_date,
            class: raw.class,
        };
    }

    private static normalisePosition(raw: any): TradierPosition {
        return {
            id: raw.id,
            symbol: raw.symbol,
            quantity: raw.quantity,
            costBasis: raw.cost_basis,
            dateAcquired: raw.date_acquired,
        };
    }

    private static normaliseHistoryEvent(raw: any): TradierHistoryEvent {
        return {
            type: raw.type,
            date: raw.date,
            amount: raw.amount,
            description: raw.description,
            symbol: raw.symbol,
            quantity: raw.quantity,
            price: raw.price,
            tradeType: raw.trade_type,
        };
    }

    private static normaliseClosedPosition(raw: any): TradierClosedPosition {
        return {
            symbol: raw.symbol,
            quantity: raw.quantity,
            openDate: raw.open_date,
            closeDate: raw.close_date,
            cost: raw.cost,
            proceeds: raw.proceeds,
            gainLoss: raw.gain_loss,
            gainLossPercent: raw.gain_loss_percent,
            term: raw.term,
        };
    }

    // ============================================
    // AUTH METHODS
    // ============================================

    /**
     * Step 1 of OAuth — Generate Tradier authorization URL
     * User is redirected here to login to their Tradier account
     */
    static getAuthorizationUrl(userId: string): string {
        const params = new URLSearchParams({
            client_id: config.TRADIER_CLIENT_ID,
            scope: 'read write trade',
            response_type: 'code',
            state: userId,  // ← pass userId as state
        });

        const url = `https://api.tradier.com/v1/oauth/authorize?${params.toString()}`;
        console.log(url, 'URL')
        logger.info(`Tradier OAuth URL generated`);
        return url;
    }

    /**
     * Step 2 of OAuth — Exchange authorization code for access token
     * Called when Tradier redirects back to our callback URL
     */
    static async exchangeCodeForToken(code: string): Promise<TradierRawTokenResponse> {
        try {
            logger.info('Exchanging Tradier authorization code for token');

            const response = await axios.post<TradierRawTokenResponse>(
                'https://api.tradier.com/v1/oauth/accesstoken',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: config.TRADIER_CALLBACK_URL,
                }),
                {
                    headers: {
                        'Authorization': config.TRADIER_BASIC_AUTH,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                    },
                }
            );

            logger.info('Tradier token exchange successful');
            return response.data;
        } catch (error: any) {
            logger.error('Tradier token exchange error:', error.message);
            throw ApiError.internal('Failed to exchange authorization code for token');
        }
    }

    /**
     * Fetch Tradier account profile using access token
     */
    static async fetchTradierProfile(accessToken: string): Promise<TradierRawProfile> {
        try {
            const client = this.getClient(accessToken);
            const response = await client.get<TradierRawProfile>('/user/profile');
            return response.data;
        } catch (error: any) {
            logger.error('Fetch Tradier profile error:', error.message);
            throw ApiError.internal('Failed to fetch Tradier profile');
        }
    }

    /**
     * Connect user's Tradier account — called after OAuth callback
     * Stores token + account info in DB
     */
    static async connectAccount(
        userId: string,
        code: string
    ): Promise<{
        accountNumber: string;
        accountType: string;
        accountName: string;
        environment: 'sandbox' | 'production';
        connectedAt: string;
    }> {
        try {
            logger.info(`Connecting Tradier account for user: ${userId}`);

            // 1. Exchange code for token
            const tokenData = await this.exchangeCodeForToken(code);

            // 2. Fetch user's Tradier profile
            const profileData = await this.fetchTradierProfile(tokenData.access_token);
            const profile = profileData.profile;

            // 3. Get first account (users usually have one)
            const rawAccount = Array.isArray(profile.account)
                ? profile.account[0]
                : profile.account;

            // 4. Calculate token expiry
            const tokenExpiresAt = new Date(
                Date.now() + tokenData.expires_in * 1000
            );

            // 5. Check if user already has a connected account
            const existing = await db
                .select()
                .from(tradierAccounts)
                .where(eq(tradierAccounts.userId, userId))
                .limit(1);

            if (existing.length > 0) {
                // Update existing connection
                await db
                    .update(tradierAccounts)
                    .set({
                        accountNumber: rawAccount.account_number,
                        accountName: profile.name,
                        accountType: rawAccount.type,
                        accountClassification: rawAccount.classification,
                        accessToken: tokenData.access_token,
                        tokenScope: tokenData.scope,
                        tokenExpiresAt,
                        isActive: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(tradierAccounts.userId, userId));

                logger.info(`Tradier account reconnected for user: ${userId}`);
            } else {
                // Insert new connection
                await db.insert(tradierAccounts).values({
                    userId,
                    accountNumber: rawAccount.account_number,
                    accountName: profile.name,
                    accountType: rawAccount.type,
                    accountClassification: rawAccount.classification,
                    accessToken: tokenData.access_token,
                    tokenScope: tokenData.scope,
                    tokenExpiresAt,
                    environment: 'sandbox',
                    isActive: true,
                });

                logger.info(`Tradier account connected for user: ${userId}`);
            }

            return {
                accountNumber: rawAccount.account_number,
                accountType: rawAccount.type,
                accountName: profile.name,
                environment: 'sandbox',
                connectedAt: new Date().toISOString(),
            };
        } catch (error: any) {
            logger.error('Connect Tradier account error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to connect Tradier account');
        }
    }

    /**
     * Disconnect user's Tradier account
     * Sets isActive to false in DB
     */
    static async disconnectAccount(userId: string): Promise<void> {
        try {
            logger.info(`Disconnecting Tradier account for user: ${userId}`);

            const existing = await db
                .select()
                .from(tradierAccounts)
                .where(eq(tradierAccounts.userId, userId))
                .limit(1);

            if (existing.length === 0) {
                throw ApiError.notFound('No Tradier account connected');
            }

            await db
                .update(tradierAccounts)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(tradierAccounts.userId, userId));

            logger.info(`Tradier account disconnected for user: ${userId}`);
        } catch (error: any) {
            logger.error('Disconnect Tradier account error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to disconnect Tradier account');
        }
    }

    /**
     * Get connection status for a user
     */
    static async getConnectionStatus(userId: string): Promise<{
        isConnected: boolean;
        accountNumber?: string;
        accountType?: string;
        accountName?: string;
        environment?: 'sandbox' | 'production';
        connectedAt?: string;
    }> {
        try {
            const accounts = await db
                .select()
                .from(tradierAccounts)
                .where(eq(tradierAccounts.userId, userId))
                .limit(1);

            if (accounts.length === 0 || !accounts[0].isActive) {
                return { isConnected: false };
            }

            const account = accounts[0];
            return {
                isConnected: true,
                accountNumber: account.accountNumber,
                accountType: account.accountType || undefined,
                accountName: account.accountName || undefined,
                environment: account.environment,
                connectedAt: account.connectedAt.toISOString(),
            };
        } catch (error: any) {
            logger.error('Get connection status error:', error.message);
            throw ApiError.internal('Failed to get connection status');
        }
    }

    // ============================================
    // ACCOUNT METHODS
    // ============================================

    /**
     * Get user's Tradier profile
     */
    static async getProfile(userId: string) {
        try {
            logger.info(`Getting Tradier profile for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get<TradierRawProfile>('/user/profile');
            const profile = response.data.profile;
            const rawAccount = Array.isArray(profile.account)
                ? profile.account[0]
                : profile.account;

            return {
                accountNumber: rawAccount.account_number,
                accountType: rawAccount.type,
                accountClassification: rawAccount.classification,
                status: rawAccount.status,
                dayTrader: rawAccount.day_trader,
                optionLevel: rawAccount.option_level,
            };
        } catch (error: any) {
            logger.error('Get Tradier profile error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get profile');
        }
    }

    /**
     * Get account balances — buying power, cash, equity etc.
     */
    static async getBalances(userId: string) {
        try {
            logger.info(`Getting Tradier balances for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get<TradierRawBalances>(
                `/accounts/${account.accountNumber}/balances`
            );

            const b = response.data.balances;

            return {
                accountNumber: b.account_number,
                accountType: b.account_type,
                totalEquity: b.total_equity,
                totalCash: b.total_cash,
                cashAvailable: b.cash?.cash_available ?? 0,
                marketValue: b.market_value,
                longMarketValue: b.long_market_value,
                shortMarketValue: b.short_market_value,
                openPl: b.open_pl,
                pendingCash: b.pending_cash,
                unclearedFunds: b.uncleared_funds,
                pendingOrdersCount: b.pending_orders_count,
                dayTradeBuyingPower: b.pdt_information?.day_trade_buying_power,
                numDayTrades: b.pdt_information?.num_day_trades,
            };
        } catch (error: any) {
            logger.error('Get Tradier balances error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get balances');
        }
    }

    /**
     * Get current positions (stocks currently held)
     */
    static async getPositions(userId: string): Promise<TradierPosition[]> {
        try {
            logger.info(`Getting Tradier positions for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get<TradierRawPositions>(
                `/accounts/${account.accountNumber}/positions`
            );

            // Tradier returns "null" string when no positions
            if (!response.data.positions || response.data.positions === 'null') {
                return [];
            }

            const rawPositions = response.data.positions;
            if (typeof rawPositions === 'string') return [];

            const positions = rawPositions.position;
            if (!positions) return [];

            const positionArray = Array.isArray(positions) ? positions : [positions];
            return positionArray.map(this.normalisePosition);
        } catch (error: any) {
            logger.error('Get Tradier positions error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get positions');
        }
    }

    /**
     * Get account transaction history
     */
    static async getHistory(
        userId: string,
        params: {
            limit?: number;
            offset?: number;
            type?: string;
            start?: string;
            end?: string;
        }
    ): Promise<TradierHistoryEvent[]> {
        try {
            logger.info(`Getting Tradier history for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get<TradierRawHistory>(
                `/accounts/${account.accountNumber}/history`,
                { params }
            );

            if (!response.data.history || response.data.history === 'null') {
                return [];
            }

            const history = response.data.history;
            if (typeof history === 'string') return [];

            const events = history.event;
            if (!events) return [];

            const eventArray = Array.isArray(events) ? events : [events];
            return eventArray.map(this.normaliseHistoryEvent);
        } catch (error: any) {
            logger.error('Get Tradier history error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get history');
        }
    }

    /**
     * Get closed positions gain/loss
     */
    static async getGainLoss(
        userId: string,
        params: {
            limit?: number;
            offset?: number;
            sortBy?: string;
            sort?: string;
            start?: string;
            end?: string;
        }
    ): Promise<TradierClosedPosition[]> {
        try {
            logger.info(`Getting Tradier gain/loss for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get<TradierRawGainLoss>(
                `/accounts/${account.accountNumber}/gainloss`,
                { params }
            );

            if (!response.data.gainloss || response.data.gainloss === 'null') {
                return [];
            }

            const gainloss = response.data.gainloss;
            if (typeof gainloss === 'string') return [];

            const positions = gainloss.closed_position;
            if (!positions) return [];

            const positionArray = Array.isArray(positions) ? positions : [positions];
            return positionArray.map(this.normaliseClosedPosition);
        } catch (error: any) {
            logger.error('Get Tradier gain/loss error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get gain/loss');
        }
    }

    // ============================================
    // ORDER METHODS
    // ============================================

    /**
     * Preview an order before placing it
     * Shows estimated cost, commission etc. — no order placed
     */
    static async previewOrder(
        userId: string,
        orderData: {
            symbol: string;
            side: TradierOrderSide;
            quantity: number;
            type: TradierOrderType;
            duration: TradierOrderDuration;
            price?: number;
            stop?: number;
        }
    ) {
        try {
            logger.info(`Previewing order for user: ${userId} — ${orderData.symbol}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const params: Record<string, any> = {
                class: 'equity',
                symbol: orderData.symbol,
                side: orderData.side,
                quantity: orderData.quantity,
                type: orderData.type,
                duration: orderData.duration,
                preview: true,
            };

            if (orderData.price) params.price = orderData.price;
            if (orderData.stop) params.stop = orderData.stop;

            const response = await client.post(
                `/accounts/${account.accountNumber}/orders`,
                new URLSearchParams(
                    Object.fromEntries(
                        Object.entries(params).map(([k, v]) => [k, String(v)])
                    )
                ),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const order = response.data.order;
            logger.info(`Order preview successful for user: ${userId}`);

            return {
                symbol: orderData.symbol,
                side: orderData.side,
                quantity: orderData.quantity,
                type: orderData.type,
                duration: orderData.duration,
                price: orderData.price,
                stop: orderData.stop,
                estimatedCost: order?.cost ?? 0,
                commission: order?.commission ?? 0,
                extendedHours: order?.extended_hours ?? false,
                status: order?.status ?? 'ok',
            };
        } catch (error: any) {
            logger.error('Preview order error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to preview order');
        }
    }

    /**
     * Place a buy or sell order
     * This is the real deal — executes against Tradier sandbox/production
     */
    static async placeOrder(
        userId: string,
        orderData: {
            symbol: string;
            side: TradierOrderSide;
            quantity: number;
            type: TradierOrderType;
            duration: TradierOrderDuration;
            price?: number;
            stop?: number;
        }
    ): Promise<{ orderId: number; status: string }> {
        try {
            logger.info(`Placing order for user: ${userId} — ${orderData.side} ${orderData.quantity} ${orderData.symbol}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const params: Record<string, any> = {
                class: 'equity',
                symbol: orderData.symbol,
                side: orderData.side,
                quantity: orderData.quantity,
                type: orderData.type,
                duration: orderData.duration,
            };

            if (orderData.price) params.price = orderData.price;
            if (orderData.stop) params.stop = orderData.stop;

            const response = await client.post<TradierRawOrderResponse>(
                `/accounts/${account.accountNumber}/orders`,
                new URLSearchParams(
                    Object.fromEntries(
                        Object.entries(params).map(([k, v]) => [k, String(v)])
                    )
                ),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const order = response.data.order;
            logger.info(`Order placed successfully: ${order.id} for user: ${userId}`);

            return {
                orderId: order.id,
                status: order.status,
            };
        } catch (error: any) {
            logger.error('Place order error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to place order');
        }
    }

    /**
     * Get all orders for the account
     */
    static async getOrders(userId: string): Promise<TradierOrder[]> {
        try {
            logger.info(`Getting orders for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get<TradierRawOrders>(
                `/accounts/${account.accountNumber}/orders`
            );

            if (!response.data.orders || response.data.orders === 'null') {
                return [];
            }

            const orders = response.data.orders;
            if (typeof orders === 'string') return [];

            const orderList = orders.order;
            if (!orderList) return [];

            const orderArray = Array.isArray(orderList) ? orderList : [orderList];
            return orderArray.map(this.normaliseOrder);
        } catch (error: any) {
            logger.error('Get orders error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get orders');
        }
    }

    /**
     * Get a single order by ID
     */
    static async getOrder(userId: string, orderId: string): Promise<TradierOrder> {
        try {
            logger.info(`Getting order ${orderId} for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.get(
                `/accounts/${account.accountNumber}/orders/${orderId}`
            );

            return this.normaliseOrder(response.data.order);
        } catch (error: any) {
            logger.error('Get order error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get order');
        }
    }

    /**
     * Modify an existing order (change price, type or duration)
     */
    static async modifyOrder(
        userId: string,
        orderId: string,
        updates: {
            type?: TradierOrderType;
            duration?: TradierOrderDuration;
            price?: number;
            stop?: number;
        }
    ): Promise<{ orderId: number; status: string }> {
        try {
            logger.info(`Modifying order ${orderId} for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const params: Record<string, string> = {};
            if (updates.type) params.type = updates.type;
            if (updates.duration) params.duration = updates.duration;
            if (updates.price) params.price = String(updates.price);
            if (updates.stop) params.stop = String(updates.stop);

            const response = await client.put<TradierRawOrderResponse>(
                `/accounts/${account.accountNumber}/orders/${orderId}`,
                new URLSearchParams(params),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const order = response.data.order;
            logger.info(`Order ${orderId} modified successfully for user: ${userId}`);

            return {
                orderId: order.id,
                status: order.status,
            };
        } catch (error: any) {
            logger.error('Modify order error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to modify order');
        }
    }

    /**
     * Cancel an existing order
     */
    static async cancelOrder(
        userId: string,
        orderId: string
    ): Promise<{ orderId: number; status: string }> {
        try {
            logger.info(`Cancelling order ${orderId} for user: ${userId}`);

            const account = await this.getUserTradierAccount(userId);
            const client = this.getClient(account.accessToken);

            const response = await client.delete<TradierRawOrderResponse>(
                `/accounts/${account.accountNumber}/orders/${orderId}`
            );

            const order = response.data.order;
            logger.info(`Order ${orderId} cancelled successfully for user: ${userId}`);

            return {
                orderId: order.id,
                status: order.status,
            };
        } catch (error: any) {
            logger.error('Cancel order error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to cancel order');
        }
    }
}

export default TradingService;