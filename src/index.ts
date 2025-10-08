import 'reflect-metadata';
import 'dotenv/config';
import { Container } from 'typedi';
import { createApp } from './app/app';
import { createDbPool } from './db/mysql';
import logger from './utils/logger';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

/**
 * Bootstrap application with DI container setup
 * Registers all dependencies before starting the server
 */
async function bootstrap() {
  try {
    logger.info('🚀 Starting Boarding Service...');

    // 1. Create database pool
    const pool = await createDbPool();
    logger.info('✅ Database pool created');

    // 2. Register Pool as singleton in DI container
    // This makes it available for injection in all services/repositories
    Container.set('DB_POOL', pool);
    // Container.set(Pool, pool); // Also register as Pool type
    logger.info('✅ Dependencies registered in DI container');

    // 3. Create Express app (will use DI container internally)
    const app = createApp();
    logger.info('✅ Express app configured');

    // 4. Start HTTP server
    app.listen(port, () => {
      logger.info(`✅ Server running on port ${port}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${port}/api/v1/health`);
    });

    // 5. Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing server...');
      await pool.end();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, closing server...');
      await pool.end();
      process.exit(0);
    });
  } catch (err) {
    logger.error('❌ Failed to start application:', err);
    process.exit(1);
  }
}

bootstrap();
