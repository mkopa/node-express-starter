import { Service } from 'typedi';
import { PoolConnection } from 'mysql2/promise';
import { UserRepository, CreateUserDto } from '../repositories/UserRepository';
import { CompanyRepository } from '../repositories/CompanyRepository';
import { TokenRepository } from '../repositories/TokenRepository';
import { generateSecureToken, hashPassword, hashTokenForStorage } from '../utils/crypto';
import logger from '../utils/logger';

/**
 * Business logic interface for user boarding
 */
export interface BoardingData extends CreateUserDto {
  company_id: number;
}

/**
 * Result of successful user boarding
 */
export interface BoardingResult {
  userId: number;
  token: string;
  message: string;
}

/**
 * Result of successful password setup
 */
export interface SetPasswordResult {
  success: true;
  message: string;
}

/**
 * Custom error with HTTP status code
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Boarding Service - handles user onboarding business logic
 * Orchestrates repositories and implements transactional operations
 * Follows Service pattern with Dependency Injection
 */
@Service()
export class BoardingService {
  /**
   * Constructor with automatic dependency injection
   * TypeDI will inject all required repositories
   */
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly tokenRepository: TokenRepository
  ) {
    logger.debug('BoardingService initialized with DI');
  }

  /**
   * Onboard a new user to the system
   * Creates user, assigns to company, and generates password reset token
   *
   * Flow:
   * 1. Validate company exists
   * 2. Check user doesn't already exist
   * 3. Create user (inactive, no password)
   * 4. Attach user to company
   * 5. Generate secure one-time token
   * 6. Store hashed token in database
   *
   * All operations are wrapped in a transaction for data consistency
   *
   * @param data - User boarding data (email, name, company_id)
   * @returns Password reset token (in production: send via email)
   * @throws AppError with status code if validation fails
   */
  async onboardUser(data: BoardingData): Promise<BoardingResult> {
    // Get database connection for transaction
    const conn: PoolConnection = await this.userRepository.getConnection();

    try {
      await conn.beginTransaction();
      logger.debug(`Starting boarding process for email: ${data.email}`);

      // 1. Validate company exists
      const company = await this.companyRepository.findById(data.company_id, conn);
      if (!company) {
        throw new AppError(404, `Company with id ${data.company_id} does not exist`);
      }
      logger.debug(`Company validated: ${company.name}`);

      // 2. Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email, conn);
      if (existingUser) {
        throw new AppError(409, 'User with this email already exists');
      }

      // 3. Create user (inactive, no password)
      const userId = await this.userRepository.create(
        {
          email: data.email,
          phone: data.phone,
          first_name: data.first_name,
          last_name: data.last_name,
        },
        conn
      );
      logger.info(`User created with ID: ${userId}`);

      // 4. Attach user to company (many-to-many relationship)
      await this.userRepository.attachToCompany(userId, data.company_id, conn);
      logger.debug(`User ${userId} attached to company ${data.company_id}`);

      // 5. Generate secure one-time token (256-bit)
      const token = generateSecureToken();
      const tokenHash = hashTokenForStorage(token);

      // 6. Store hashed token in database
      await this.tokenRepository.create(userId, tokenHash, conn);
      logger.debug(`Password token created for user ${userId}`);

      await conn.commit();
      logger.info(`✅ User boarding completed successfully for: ${data.email}`);

      // In production: send token via email
      // await emailService.sendPasswordSetupEmail(data.email, token);

      return {
        userId,
        token,
        message: 'User created successfully',
      };
    } catch (err) {
      await conn.rollback();
      logger.error('❌ Boarding failed, transaction rolled back:', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Set user password using one-time token
   * Validates token, checks expiry, and sets password
   *
   * Flow:
   * 1. Hash incoming token and find in database
   * 2. Check if token exists and is unused
   * 3. Validate token is not expired (configurable TTL)
   * 4. Validate password meets requirements
   * 5. Hash password with Argon2
   * 6. Update user password and activate account
   * 7. Mark token as used (prevent reuse)
   *
   * @param token - One-time password reset token (plain text)
   * @param password - New password (min 12 characters)
   * @returns Success result
   * @throws AppError with status code if validation fails
   */
  async setPasswordFromToken(token: string, password: string): Promise<SetPasswordResult> {
    const conn: PoolConnection = await this.userRepository.getConnection();

    try {
      logger.debug('Starting password setup process');

      // 1. Hash token and find in database
      const tokenHash = hashTokenForStorage(token);
      const tokenRow = await this.tokenRepository.findUnusedByHash(tokenHash, conn);

      if (!tokenRow) {
        throw new AppError(404, 'Invalid or expired token');
      }

      // 2. Check if token is expired (default: 12 hours)
      const createdAt = new Date(tokenRow.created_at);
      const diffHours = (Date.now() - createdAt.getTime()) / 1000 / 3600;
      const expiryHours = Number(process.env.TOKEN_EXPIRY_HOURS) || 12;

      if (diffHours > expiryHours) {
        throw new AppError(410, 'Token expired');
      }
      logger.debug(`Token valid (${diffHours.toFixed(2)}h old, expires after ${expiryHours}h)`);

      // 3. Validate password length (additional validation in schema)
      if (password.length < 12) {
        throw new AppError(400, 'Password must be at least 12 characters');
      }

      // 4. Hash password with Argon2 (OWASP recommended)
      const passwordHash = await hashPassword(password);
      logger.debug('Password hashed with Argon2');

      // 5. Update user: set password, activate account
      await this.userRepository.setPassword(tokenRow.user_id, passwordHash, conn);
      logger.info(`Password set for user ${tokenRow.user_id}`);

      // 6. Mark token as used (prevent reuse)
      await this.tokenRepository.markAsUsed(tokenRow.id, conn);
      logger.debug(`Token ${tokenRow.id} marked as used`);

      logger.info('✅ Password setup completed successfully');

      return {
        success: true,
        message: 'Password set successfully',
      };
    } finally {
      conn.release();
    }
  }
}
