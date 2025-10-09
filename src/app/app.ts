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
import { sanitizeInput } from './middlewares/sanitizeInput';
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

export function createApp(): Application {
  const app = express();

  // ==========================================
  // Security & Parsing Middleware
  // ==========================================

  app.use(helmet());
  app.use(morgan('dev'));
  app.use(cors(corsOptions));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(sanitizeInput);

  app.set('trust proxy', 1);

  // ==========================================
  // API Routes
  // ==========================================

  const API_VERSION = '/api/v1';
  app.use(`${API_VERSION}/health`, healthRouter());
  app.use(
    `${API_VERSION}/internal`,
    basicAuth,
    rateLimiter,
    internalRouter()
  );

  // ==========================================
  // Error Handlers
  // ==========================================

  app.use((req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(errorHandler);

  logger.info('✅ Express application configured');
  return app;
}
