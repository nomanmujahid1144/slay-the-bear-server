// src/services/websocket.service.ts
// FINAL VERSION - Correct Tradier WebSocket implementation

import { WebSocket as WSClient, WebSocketServer } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config';

interface Client {
    ws: WSClient;
    subscribedSymbols: Set<string>;
}

interface SubscriptionMessage {
    type: 'subscribe' | 'unsubscribe';
    symbols: string[];
}

interface TradierSession {
    url: string;
    sessionid: string;
}

export class WebSocketService {
    private wss: WebSocketServer | null = null;
    private clients: Map<WSClient, Client> = new Map();
    private tradierWs: WSClient | null = null;
    private allSubscribedSymbols: Set<string> = new Set();
    private currentSessionId: string | null = null;
    
    private readonly RECONNECT_DELAY = 5000; // 5 seconds
    private readonly SESSION_REFRESH_INTERVAL = 240000; // 4 minutes (session expires in 5)

    /**
     * Initialize WebSocket server
     */
    initialize(server: Server) {
        this.wss = new WebSocketServer({ 
            server,
            path: '/ws/markets'
        });

        this.wss.on('connection', (ws: WSClient) => {
            this.handleConnection(ws);
        });

        logger.info('🔌 WebSocket server initialized on /ws/markets');
    }

    /**
     * Handle new client connection
     */
    private handleConnection(ws: WSClient) {
        logger.info('📡 New WebSocket client connected');

        const client: Client = {
            ws,
            subscribedSymbols: new Set()
        };

        this.clients.set(ws, client);

        // Handle messages from client
        ws.on('message', (message: string) => {
            this.handleMessage(client, message);
        });

        // Handle disconnection
        ws.on('close', () => {
            this.handleDisconnection(client);
        });

        // Handle errors
        ws.on('error', (error) => {
            logger.error('WebSocket client error:', error);
        });

        // Send welcome message
        this.send(ws, {
            type: 'connected',
            message: 'Connected to Slay The Bear real-time market data'
        });
    }

    /**
     * Handle incoming messages from clients
     */
    private handleMessage(client: Client, message: string) {
        try {
            const data: SubscriptionMessage = JSON.parse(message);

            if (data.type === 'subscribe') {
                this.subscribe(client, data.symbols);
            } else if (data.type === 'unsubscribe') {
                this.unsubscribe(client, data.symbols);
            }
        } catch (error) {
            logger.error('Error parsing WebSocket message:', error);
            this.send(client.ws, {
                type: 'error',
                message: 'Invalid message format'
            });
        }
    }

    /**
     * Subscribe client to symbols
     */
    private subscribe(client: Client, symbols: string[]) {
        symbols.forEach(symbol => {
            client.subscribedSymbols.add(symbol);
            this.allSubscribedSymbols.add(symbol);
        });

        logger.info(`Client subscribed to: ${symbols.join(', ')}`);

        // Update Tradier subscription
        this.updateTradierSubscription();

        // Send confirmation
        this.send(client.ws, {
            type: 'subscribed',
            symbols
        });
    }

    /**
     * Unsubscribe client from symbols
     */
    private unsubscribe(client: Client, symbols: string[]) {
        symbols.forEach(symbol => {
            client.subscribedSymbols.delete(symbol);
        });

        logger.info(`Client unsubscribed from: ${symbols.join(', ')}`);

        // Recalculate subscriptions
        this.recalculateSubscriptions();

        // Send confirmation
        this.send(client.ws, {
            type: 'unsubscribed',
            symbols
        });
    }

    /**
     * Handle client disconnection
     */
    private handleDisconnection(client: Client) {
        logger.info('📴 WebSocket client disconnected');
        this.clients.delete(client.ws);

        // Recalculate subscriptions
        this.recalculateSubscriptions();
    }

    /**
     * Recalculate all subscribed symbols across all clients
     */
    private recalculateSubscriptions() {
        this.allSubscribedSymbols.clear();

        this.clients.forEach(client => {
            client.subscribedSymbols.forEach(symbol => {
                this.allSubscribedSymbols.add(symbol);
            });
        });

        // Update Tradier subscription
        this.updateTradierSubscription();
    }

    /**
     * Create Tradier streaming session
     */
    private async createTradierSession(): Promise<TradierSession | null> {
        try {

            const sessionUrl = `${config.TRADIER_API_URL}/markets/events/session`;

            const response = await axios.post(
                sessionUrl,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${config.TRADIER_ACCESS_TOKEN}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.data && response.data.stream) {
                logger.info('✅ Tradier session created');
                return response.data.stream;
            }

            return null;
        } catch (error: any) {
            logger.error('Error creating Tradier session:', error.message);
            return null;
        }
    }

    /**
     * Update Tradier WebSocket subscription
     */
    private async updateTradierSubscription() {
        // If no symbols, close existing connection
        if (this.allSubscribedSymbols.size === 0) {
            if (this.tradierWs) {
                this.tradierWs.close();
                this.tradierWs = null;
                this.currentSessionId = null;
            }
            logger.info('No symbols subscribed, WebSocket closed');
            return;
        }

        const symbols = Array.from(this.allSubscribedSymbols);

        // If already connected, just update symbols
        if (this.tradierWs && this.tradierWs.readyState === WSClient.OPEN && this.currentSessionId) {
            const payload = {
                symbols: symbols,
                sessionid: this.currentSessionId,
                filter: ['trade', 'quote'],
                linebreak: true
            };

            this.tradierWs.send(JSON.stringify(payload));
            logger.info(`📊 Updated Tradier stream with ${symbols.length} symbols`);
            return;
        }

        // Create new session
        const session = await this.createTradierSession();
        if (!session) {
            logger.error('Failed to create Tradier session, retrying...');
            setTimeout(() => this.updateTradierSubscription(), this.RECONNECT_DELAY);
            return;
        }

        this.currentSessionId = session.sessionid;

        // Connect to Tradier WebSocket
        try {
            // Use sandbox WebSocket for sandbox accounts
            const wsUrl = config.TRADIER_API_URL.includes('sandbox')
                ? 'wss://sandbox-ws.tradier.com/v1/markets/events'
                : 'wss://ws.tradier.com/v1/markets/events';

            this.tradierWs = new WSClient(wsUrl);

            this.tradierWs.on('open', () => {
                logger.info('📡 Connected to Tradier WebSocket');

                // Send subscription payload
                const payload = {
                    symbols: symbols,
                    sessionid: this.currentSessionId,
                    filter: ['trade', 'quote'],
                    linebreak: true
                };

                this.tradierWs!.send(JSON.stringify(payload));
                logger.info(`📊 Subscribed to ${symbols.length} symbols via Tradier WebSocket`);
            });

            this.tradierWs.on('message', (data: string) => {
                try {
                    const message = JSON.parse(data);
                    this.broadcastMarketData(message);
                } catch (error) {
                    // Ignore parse errors
                }
            });

            this.tradierWs.on('error', (error) => {
                logger.error('Tradier WebSocket error:', error.message);
            });

            this.tradierWs.on('close', () => {
                logger.info('Tradier WebSocket closed, reconnecting...');
                this.tradierWs = null;
                this.currentSessionId = null;
                setTimeout(() => this.updateTradierSubscription(), this.RECONNECT_DELAY);
            });

        } catch (error: any) {
            logger.error('Error connecting to Tradier WebSocket:', error.message);
            setTimeout(() => this.updateTradierSubscription(), this.RECONNECT_DELAY);
        }
    }

    /**
     * Broadcast market data to subscribed clients
     */
    private broadcastMarketData(data: any) {
        if (!data || !data.symbol) return;

        const symbol = data.symbol;

        // Broadcast to subscribed clients
        this.clients.forEach(client => {
            if (client.subscribedSymbols.has(symbol)) {
                this.send(client.ws, {
                    type: 'quote',
                    data
                });
            }
        });
    }

    /**
     * Send message to client
     */
    private send(ws: WSClient, data: any) {
        if (ws.readyState === WSClient.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    /**
     * Broadcast to all connected clients
     */
    broadcast(data: any) {
        this.clients.forEach(client => {
            this.send(client.ws, data);
        });
    }

    /**
     * Get connected client count
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Close WebSocket server
     */
    close() {
        if (this.tradierWs) {
            this.tradierWs.close();
        }

        if (this.wss) {
            this.wss.close(() => {
                logger.info('🔌 WebSocket server closed');
            });
        }
    }
}

// Export singleton instance
export const websocketService = new WebSocketService();