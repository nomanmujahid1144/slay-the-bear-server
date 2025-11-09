import express from 'express';
import type { Request, Response } from 'express';
import config from './config';
import { connectDatabase } from './db';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req: Request, res: Response, next) => {
  logger.request(req.method, req.path, req.ip || 'unknown');
  next();
});

// Test route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '🐻 Slay The Bear API',
    version: '1.0.0',
  });
});

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(config.PORT, () => {
      logger.info(`Server started on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();