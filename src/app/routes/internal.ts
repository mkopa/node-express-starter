import { Router } from 'express';
import { Container } from 'typedi';
import { validateSchema } from '../middlewares/ajvValidator';
import boardingSchema from '../../validation/schemas/boarding.schema.json';
import setPasswordSchema from '../../validation/schemas/setPassword.schema.json';
import { BoardingController } from '../../controllers/BoardingController';

/**
 * Internal endpoints router
 * Protected by Basic Auth middleware (applied in app.ts)
 * Uses Dependency Injection to get controller instance
 */
export function internalRouter(): Router {
  const router = Router();

  // Get controller instance from DI container
  // TypeDI will automatically inject all dependencies
  const controller = Container.get(BoardingController);

  /**
   * POST /internal/boarding
   * Create new user and generate password setup token
   *
   * Middleware chain:
   * 1. validateSchema - AJV validation
   * 2. controller.createUser - Business logic
   *
   * The controller method is bound to maintain 'this' context
   */
  router.post('/boarding', validateSchema(boardingSchema), controller.createUser.bind(controller));

  /**
   * POST /internal/set-password/:token
   * Set user password using one-time token
   *
   * Middleware chain:
   * 1. validateSchema - AJV validation for password
   * 2. controller.setPassword - Business logic
   *
   * The controller method is bound to maintain 'this' context
   */
  router.post(
    '/set-password/:token',
    validateSchema(setPasswordSchema),
    controller.setPassword.bind(controller)
  );

  return router;
}
