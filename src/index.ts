import 'reflect-metadata';
import 'dotenv/config';
import { Container } from 'typedi';
import { createApp } from './app/app';
import { createDbPool } from './db/mysql';
import { UserRepository } from './repositories/UserRepository';
import { CompanyRepository } from './repositories/CompanyRepository';
import { TokenRepository } from './repositories/TokenRepository';
import logger from './utils/logger';
import { EventBus } from './domain/EventBus';
// Importing event handlers registers them with EventBus (see handler file)
import './services/EventHandlers/SendPasswordEmailHandler';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

/**
 * Bootstrap application with DI container setup
 * Registers all dependencies before starting the server
 *
 * Dependency Injection Setup:
 * 1. Create database pool
 * 2. Register pool in DI container
 * 3. Register repository implementations as interfaces
 * 4. Create Express app (will use DI container internally)
 * 5. Start HTTP server
 *
 * This allows for:
 * - Easy mocking in tests (inject mock implementations)
 * - Alternative implementations (e.g., InMemoryRepository)
 * - True dependency inversion (depend on abstractions)
 */
async function bootstrap() {
  try {
    logger.info('🚀 Starting Boarding Service...');

    // 1. Create database pool
    const pool = await createDbPool();
    logger.info('✅ Database pool created');

    // 2. Register Pool as singleton in DI container
    Container.set('DB_POOL', pool);
    logger.info('✅ Database pool registered in DI container');

    // 3. Register repository implementations as interfaces
    Container.set('IUserRepository', Container.get(UserRepository));
    Container.set('ICompanyRepository', Container.get(CompanyRepository));
    Container.set('ITokenRepository', Container.get(TokenRepository));
    logger.info('✅ Repository implementations registered as interfaces');

    // 4. Create Express app (will use DI container internally)
    const app = createApp();
    logger.info('✅ Express app configured');

    // 5. Start HTTP server
    app.listen(port, () => {
      logger.info(`✅ Server running on port ${port}`);
      logger.info(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://localhost:${port}/api/v1/health`);
    });

    // 6. Graceful shutdown handlers
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
