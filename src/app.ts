import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { logger } from './utils/logger';
import { WebhookController } from './controllers/webhook.controller';

const app: Application = express();

/**
 * Security Middleware
 */
app.use(helmet()); // Security headers

/**
 * CORS Configuration
 */
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);


// Webhook call before Body Parser

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  WebhookController.handleStripe
);


// Body Parser Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

/**
 * HTTP Request Logger
 */
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Detailed logging in development
} else {
  app.use(morgan('combined')); // Standard Apache combined log in production
}

/**
 * Custom Request Logger
 */
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

/**
 * Root Route
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '🐻 Welcome to Slay The Bear API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * 404 Handler (must be after all routes)
 */
app.use(notFoundHandler);

/**
 * Global Error Handler (must be last)
 */
app.use(errorHandler);

export default app;