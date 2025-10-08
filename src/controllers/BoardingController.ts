import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { BoardingService, BoardingData } from '../services/BoardingService';
import logger from '../utils/logger';

/**
 * Boarding Controller - handles HTTP requests for user onboarding
 * Separates HTTP layer from business logic
 * Follows Controller pattern with Dependency Injection
 */
@Service()
export class BoardingController {
  /**
   * Constructor with automatic dependency injection
   * @param boardingService - Business logic service injected by TypeDI
   */
  constructor(private readonly boardingService: BoardingService) {
    logger.debug('BoardingController initialized with DI');
  }

  /**
   * POST /internal/boarding
   * Create new user and generate password setup token
   *
   * Request body (validated by AJV middleware):
   * - email: string (required, valid email)
   * - phone: string (optional)
   * - first_name: string (required)
   * - last_name: string (required)
   * - company_id: number (required, must exist)
   *
   * Success (201):
   * { message: "User created successfully", token: "..." }
   *
   * Errors:
   * - 400: Validation error
   * - 404: Company not found
   * - 409: User already exists
   * - 500: Internal server error
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Boarding request received for email: ${req.body.email}`);

      const data: BoardingData = req.body;
      const result = await this.boardingService.onboardUser(data);

      res.status(201).json({
        message: result.message,
        token: result.token,
      });

      logger.info(`✅ User boarding successful: ${data.email}`);
    } catch (err) {
      logger.error('❌ Boarding controller error:', err);
      next(err); // Pass to error handler middleware
    }
  }

  /**
   * POST /internal/set-password/:token
   * Set user password using one-time token
   *
   * URL params:
   * - token: string (64-char hex, from boarding response)
   *
   * Request body:
   * - password: string (min 12 characters)
   *
   * Success (200):
   * { success: true, message: "Password set successfully" }
   *
   * Errors:
   * - 400: Invalid password
   * - 404: Invalid token
   * - 410: Token expired
   * - 500: Internal server error
   */
  async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Basic validation (additional validation in schema)
      if (!password || typeof password !== 'string') {
        res.status(400).json({
          error: 'Password is required and must be a string',
        });
        return;
      }

      logger.info('Password setup request received');

      const result = await this.boardingService.setPasswordFromToken(token, password);

      res.status(200).json(result);
      logger.info('✅ Password setup successful');
    } catch (err) {
      logger.error('❌ Set password controller error:', err);
      next(err);
    }
  }
}
