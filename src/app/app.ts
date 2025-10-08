import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { internalRouter } from './routes/internal';
import { healthRouter } from './routes/health';
import { basicAuth } from './middlewares/basicAuth';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import logger from '../utils/logger';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

/**
 * Creates and configures the Express application
 * Uses Dependency Injection - no direct dependencies passed
 * All dependencies are resolved from TypeDI container
 *
 * @returns Configured Express app ready to listen
 */
export function createApp(): Application {
  const app = express();

  // ==========================================
  // Security & Parsing Middleware
  // ==========================================

  // Helmet - sets secure HTTP headers
  app.use(helmet());

  // Morgan - HTTP request logger
  app.use(morgan('dev'));

  app.use(cors(corsOptions));

  // Body parser - JSON and URL-encoded
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // Trust proxy - for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // ==========================================
  // API Routes
  // ==========================================

  const API_VERSION = '/api/v1';

  // Public endpoints (no auth required)
  app.use(`${API_VERSION}/health`, healthRouter());

  // Protected internal endpoints
  // Middleware chain: basicAuth -> rateLimiter -> internalRouter
  app.use(
    `${API_VERSION}/internal`,
    basicAuth, // Basic Auth authentication
    rateLimiter, // Rate limiting (10 req/min per IP)
    internalRouter() // Business logic routes
  );

  // ==========================================
  // Error Handlers
  // ==========================================

  // 404 handler - must be after all routes
  app.use((req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized error handler - must be last
  app.use(errorHandler);

  logger.info('✅ Express application configured');
  return app;
}
