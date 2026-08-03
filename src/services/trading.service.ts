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
    TradierRawOrder,
    TradierRawHistory,
    TradierRawGainLoss,
    TradierPosition,
    TradierOrder,
    TradierHistoryEvent,
    TradierClosedPosition,
} from '../types/trading/trading-response.types';

export class TradingService {

    // ============================================
    // PRIVATE: AXIOS CLIENT FACTORY
    // Creates an axios instance with user's token
    // ============================================

    private static getClient(accessToken: string, baseURL?: string): AxiosInstance {
        const client = axios.create({
            // Base URL is passed explicitly by getTradierContext (sandbox vs production)
            baseURL: baseURL || 'https://api.tradier.com/v1',
            timeout: 15000,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });

        // Intercept 401 responses from Tradier
        // If token expired — throw a clear message to reconnect
        client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
                }
                throw error;
            }
        );

        return client;
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

        // Check token expiry
        if (account.tokenExpiresAt && new Date() > new Date(account.tokenExpiresAt)) {
            // Mark as inactive in DB
            await db
                .update(tradierAccounts)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(tradierAccounts.userId, userId));

            throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
        }

        return account;
    }

    // ============================================
    // PRIVATE: GET TRADIER CONTEXT
    // Dev  → hardcoded sandbox account (fast local/Uzair testing)
    // Prod → real user's connected account from DB
    // ============================================
    private static async getTradierContext(userId: string): Promise<{
        accountNumber: string;
        accessToken: string;
        baseUrl: string;
    }> {

        const useSandbox = config.TRADIER_MODE === 'sandbox' || config.NODE_ENV === 'development';

        if (useSandbox) {
            // Sandbox testing account — hardcoded for dev/testing only.
            // Sandbox MUST use sandbox.tradier.com, not api.tradier.com.
            return {
                accountNumber: config.TRADIER_SANDBOX_ACCOUNT_NUMBER,
                accessToken: config.TRADIER_SANDBOX_ACCESS_TOKEN,
                baseUrl: config.TRADIER_SANDBOX_URL,
            };
        }

        const account = await this.getUserTradierAccount(userId);
        return {
            accountNumber: account.accountNumber,
            accessToken: account.accessToken,
            baseUrl: config.TRADIER_API_URL,
        };
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
            lastFillPrice: raw.last_fill_price,
            lastFillQuantity: raw.last_fill_quantity,
            remainingQuantity: raw.remaining_quantity,
            createDate: raw.create_date,
            transactionDate: raw.transaction_date,
            class: raw.class,
            optionSymbol: raw.option_symbol,
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
        // Tradier nests type-specific details under a key matching the event type
        // e.g. { type: "journal", journal: { description, quantity } }
        //      { type: "trade", trade: { description, commission, ... } }
        const detail = raw[raw.type] ?? {};

        return {
            type: raw.type,
            date: raw.date,
            amount: raw.amount,
            description: detail.description,
            symbol: detail.symbol ?? raw.symbol,
            quantity: detail.quantity ?? raw.quantity,
            price: detail.price ?? raw.price,
            tradeType: detail.trade_type ?? raw.trade_type,
            commission: detail.commission,
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
            response_type: 'code',
            redirect_uri: config.TRADIER_CALLBACK_URL,
            client_id: config.TRADIER_CLIENT_ID,
            scope: 'read,write,trade',
            type: 'web_server',
            state: userId,
        });

        const url = `https://api.tradier.com/v1/oauth/authorize?${params.toString()}`;
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
                    // redirect_uri: config.TRADIER_CALLBACK_URL,
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
            // const client = this.getClient(accessToken);
            // const response = await client.get<TradierRawProfile>('/user/profile');
            const response = await axios.get<TradierRawProfile>(
                'https://api.tradier.com/v1/user/profile',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json',
                    },
                }
            );

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

            // 3. Get the account to connect — prefer an active one over closed
            const accountList = Array.isArray(profile.account) ? profile.account : [profile.account];
            const rawAccount = accountList.find(a => a.status === 'active') ?? accountList[0];

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
                    environment: 'production',
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

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get<TradierRawProfile>('/user/profile');
            const profile = response.data.profile;
            const accountList = Array.isArray(profile.account) ? profile.account : [profile.account];

            // Match the account we actually connected/stored — don't just take the first one
            const rawAccount = accountList.find(a => a.account_number === accountNumber)
                ?? accountList[0];

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

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1' );
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get<TradierRawBalances>(
                `/accounts/${accountNumber}/balances`
            );

            const b = response.data.balances;

            const cashAvailable = b.cash?.cash_available
                ?? b.margin?.stock_buying_power
                ?? 0;

            return {
                accountNumber: b.account_number,
                accountType: b.account_type,
                totalEquity: b.total_equity,
                equity: b.equity,
                totalCash: b.total_cash,
                cashAvailable,
                marketValue: b.market_value,
                longMarketValue: b.long_market_value,
                shortMarketValue: b.short_market_value,
                stockLongValue: b.stock_long_value,
                openPl: b.open_pl,
                closePl: b.close_pl,
                pendingCash: b.pending_cash,
                unclearedFunds: b.uncleared_funds,
                unsettledFunds: b.cash?.unsettled_funds,
                sweep: b.cash?.sweep ?? b.margin?.sweep,
                pendingOrdersCount: b.pending_orders_count,
                currentRequirement: b.current_requirement,
                optionRequirement: b.option_requirement,
                optionLongValue: b.option_long_value,
                optionShortValue: b.option_short_value,
                optionBuyingPower: b.margin?.option_buying_power,
                stockBuyingPower: b.margin?.stock_buying_power,
                fedCall: b.margin?.fed_call,
                maintenanceCall: b.margin?.maintenance_call,
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

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1' );
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get<TradierRawPositions>(
                `/accounts/${accountNumber}/positions`
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

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1' );
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get<TradierRawHistory>(
                `/accounts/${accountNumber}/history`,
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

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1' );
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get<TradierRawGainLoss>(
                `/accounts/${accountNumber}/gainloss`,
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
        symbol: string,
        side: 'buy' | 'sell' | 'sell_short' | 'buy_to_cover',
        quantity: number,
        type: 'market' | 'limit' | 'stop' | 'stop_limit',
        duration: 'day' | 'gtc' | 'pre' | 'post',
        price?: number,
        stop?: number
    ) {
        try {
            logger.info(`Previewing order for user: ${userId}`);

            // Get user's connected Tradier account from DB
            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            // Build form-urlencoded body — REQUIRED by Tradier
            const params = new URLSearchParams();
            params.append('class', 'equity');   // ← REQUIRED — was missing
            params.append('symbol', symbol.toUpperCase());
            params.append('side', side);
            params.append('quantity', String(quantity));
            params.append('type', type);
            params.append('duration', duration);
            params.append('preview', 'true');

            // Limit and stop_limit orders require price
            if (price && (type === 'limit' || type === 'stop_limit')) {
                params.append('price', String(price));
            }

            // Stop and stop_limit orders require stop price
            if (stop && (type === 'stop' || type === 'stop_limit')) {
                params.append('stop', String(stop));
            }

            const response = await client.post(
                `/accounts/${accountNumber}/orders`,
                params.toString(),
                {
                    headers: {
                        // CRITICAL: must be form-urlencoded not JSON
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            // Tradier returns HTTP 200 even when rejecting an order —
            // the rejection is embedded in the body, not the status code
            if (response.data?.errors) {
                const tradierError = response.data.errors.error;
                const message = Array.isArray(tradierError) ? tradierError.join(', ') : tradierError;
                throw ApiError.badRequest(message || 'Order preview failed');
            }

            logger.info(`Order preview successful for user: ${userId}`);
            return response.data;
        } catch (error: any) {
            logger.error('Preview order error', { error: error.message, userId });
            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
            }
            if (error.response?.status === 400) {
                const tradierError = error.response?.data?.errors?.error;
                throw ApiError.badRequest(tradierError || 'Invalid order parameters');
            }
            throw error instanceof ApiError ? error : ApiError.internal('Failed to preview order');
        }
    }

    /**
     * Place a buy or sell order
     * This is the real deal — executes against Tradier sandbox/production
     */
    static async placeOrder(
        userId: string,
        symbol: string,
        side: 'buy' | 'sell' | 'sell_short' | 'buy_to_cover',
        quantity: number,
        type: 'market' | 'limit' | 'stop' | 'stop_limit',
        duration: 'day' | 'gtc' | 'pre' | 'post',
        price?: number,
        stop?: number
    ) {
        try {
            logger.info(`Placing order for user: ${userId}, symbol: ${symbol}, side: ${side}`);

            // Get user's connected Tradier account from DB
            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            // Build form-urlencoded body — REQUIRED by Tradier
            const params = new URLSearchParams();
            params.append('class', 'equity');
            params.append('symbol', symbol.toUpperCase());
            params.append('side', side);
            params.append('quantity', String(quantity));
            params.append('type', type);
            params.append('duration', duration);
            // params.append('preview', 'true'); ONLY FOR PREVIEW

            // Limit and stop_limit orders require price
            if (price && (type === 'limit' || type === 'stop_limit')) {
                params.append('price', String(price));
            }

            // Stop and stop_limit orders require stop price
            if (stop && (type === 'stop' || type === 'stop_limit')) {
                params.append('stop', String(stop));
            }

            const response = await client.post(
                `/accounts/${accountNumber}/orders`,
                params.toString(),
                {
                    headers: {
                        // CRITICAL: must be form-urlencoded not JSON
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            // Tradier returns HTTP 200 even when rejecting an order —
            // check the body for embedded errors before declaring success
            if (response.data?.errors) {
                const tradierError = response.data.errors.error;
                const message = Array.isArray(tradierError) ? tradierError.join(', ') : tradierError;
                throw ApiError.badRequest(message || 'Order placement failed');
            }

            logger.info(`Order placed successfully for user: ${userId}, order: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            logger.error('Place order error', { error: error.message, userId });
            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
            }
            if (error.response?.status === 400) {
                const tradierError = error.response?.data?.errors?.error;
                throw ApiError.badRequest(tradierError || 'Invalid order parameters');
            }
            throw error instanceof ApiError ? error : ApiError.internal('Failed to place order');
        }
    }

    /**
     * Get all orders for the account
     */
    static async getOrders(userId: string) {
        try {
            logger.info(`Getting orders for user: ${userId}`);

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get(`/accounts/${accountNumber}/orders`);

            // Tradier returns "null" as a string when no orders exist
            // Normalize this to an empty array
            const orders = response.data?.orders;
            if (!orders || orders === 'null') {
                logger.info(`No orders found for user: ${userId}`);
                return { orders: [] };
            }

            // Tradier returns single order as object, multiple as array
            // Normalize to always return array
            const orderList = orders.order
                ? Array.isArray(orders.order)
                    ? orders.order
                    : [orders.order]
                : [];

            logger.info(`Orders retrieved for user: ${userId}`);
            return { orders: orderList.map(this.normaliseOrder) };

        } catch (error: any) {
            logger.error('Get orders error:', error.message);
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get orders');
        }
    }

    /**
     * Get a single order by ID
     */
    static async getOrder(userId: string, orderId: string) {
        try {
            logger.info(`Getting order: ${orderId} for user: ${userId}`);

            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.get(
                `/accounts/${accountNumber}/orders/${orderId}`
            );

            logger.info(`Order retrieved: ${orderId} for user: ${userId}`);
            return this.normaliseOrder(response.data.order);
        } catch (error: any) {
            logger.error('Get order error', { error: error.message, userId, orderId });
            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
            }
            if (error.response?.status === 404) {
                throw ApiError.notFound(`Order ${orderId} not found`);
            }
            throw error instanceof ApiError ? error : ApiError.internal('Failed to get order');
        }
    }

    /**
     * Modify an existing order (change price, type or duration)
     */
    static async modifyOrder(
        userId: string,
        orderId: string,
        type: 'market' | 'limit' | 'stop' | 'stop_limit',
        duration: 'day' | 'gtc' | 'pre' | 'post',
        price?: number,
        stop?: number
    ) {
        try {
            logger.info(`Modifying order: ${orderId} for user: ${userId}`);

            // Get user's connected Tradier account from DB
            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            // Build form-urlencoded body — REQUIRED by Tradier
            const params = new URLSearchParams();
            params.append('type', type);
            params.append('duration', duration);

            if (price && (type === 'limit' || type === 'stop_limit')) {
                params.append('price', String(price));
            }

            if (stop && (type === 'stop' || type === 'stop_limit')) {
                params.append('stop', String(stop));
            }

            const response = await client.put(
                `/accounts/${accountNumber}/orders/${orderId}`,
                params.toString(),
                {
                    headers: {
                        // CRITICAL: must be form-urlencoded not JSON
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            logger.info(`Order modified successfully: ${orderId} for user: ${userId}`);
            return response.data;
        } catch (error: any) {
            logger.error('Modify order error', { error: error.message, userId, orderId });
            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
            }
            if (error.response?.status === 400) {
                const tradierError = error.response?.data?.errors?.error;
                throw ApiError.badRequest(tradierError || 'Invalid order modification parameters');
            }
            throw error instanceof ApiError ? error : ApiError.internal('Failed to modify order');
        }
    }

    /**
     * Cancel an existing order
     */
    static async cancelOrder(userId: string, orderId: string) {
        try {
            logger.info(`Cancelling order: ${orderId} for user: ${userId}`);

            // Get user's connected Tradier account from DB
            // const account = await this.getUserTradierAccount(userId);
            // const client = this.getClient(account.accessToken, 'https://api.tradier.com/v1');
            const { accountNumber, accessToken, baseUrl } = await this.getTradierContext(userId);
            const client = this.getClient(accessToken, baseUrl);

            const response = await client.delete(
                `/accounts/${accountNumber}/orders/${orderId}`
            );

            logger.info(`Order cancelled successfully: ${orderId} for user: ${userId}`);
            return response.data;
        } catch (error: any) {
            logger.error('Cancel order error', { error: error.message, userId, orderId });
            if (error.response?.status === 401) {
                throw ApiError.unauthorized('Your Tradier session has expired. Please reconnect your account.');
            }
            if (error.response?.status === 400) {
                const tradierError = error.response?.data?.errors?.error;
                throw ApiError.badRequest(tradierError || 'Unable to cancel order');
            }
            throw error instanceof ApiError ? error : ApiError.internal('Failed to cancel order');
        }
    }
}

export default TradingService;