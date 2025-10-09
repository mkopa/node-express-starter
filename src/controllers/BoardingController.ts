import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { BoardingService } from '../services/BoardingService';
import { BoardingDto } from '../types/dtos/boarding.dto';
import {
  BoardingSuccessResponse,
  SetPasswordSuccessResponse,
} from '../types/responses/boarding.response';
import logger from '../utils/logger';

/**
 * Boarding Controller
 * Handles HTTP requests for user onboarding
 * Separates HTTP layer from business logic
 * Uses typed DTOs and responses for type safety
 */
@Service()
export class BoardingController {
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
   * - 404: Company not found (CompanyNotFoundError)
   * - 409: User already exists (UserAlreadyExistsError)
   * - 500: Internal server error
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Boarding request received for email: ${req.body.email}`);

      const data: BoardingDto = req.body;
      const result = await this.boardingService.onboardUser(data);

      const response: BoardingSuccessResponse = {
        message: result.message,
        token: result.token,
      };

      res.status(201).json(response);
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
   * - 400: Invalid password (WeakPasswordError)
   * - 404: Invalid token (InvalidTokenError)
   * - 410: Token expired (TokenExpiredError)
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

      const response: SetPasswordSuccessResponse = result;

      res.status(200).json(response);
      logger.info('✅ Password setup successful');
    } catch (err) {
      logger.error('❌ Set password controller error:', err);
      next(err);
    }
  }
}
