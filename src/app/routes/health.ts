import { Router, Request, Response } from 'express';
import { Container } from 'typedi';
import { Pool } from 'mysql2/promise';
import { HealthCheckResponse } from '../../types/responses/health.response';

/**
 * Health check router
 * Provides status information about the service and database connection
 * Uses DI container to get database pool
 * Returns typed response for consistency
 */
export function healthRouter(): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      // Get pool from DI container
      const pool = Container.get<Pool>('DB_POOL');

      // Check database connectivity
      await pool.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      res.status(200).json(response);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(503).json(response);
    }
  });

  return router;
}
