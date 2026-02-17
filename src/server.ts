import app from './app';
import config from './config';
import { connectDatabase } from './db';
import { logger } from './utils/logger';

/**
 * Start Server
 */
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start Express server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server started successfully!`);
      logger.info(`📡 Port: ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`🐻 Slay The Bear API is running`);
      logger.info(`📝 API Docs: http://localhost:${config.PORT}/api/health`);
    });

    server.timeout = 300000; // 5 min timeout for long portfolio requests

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();