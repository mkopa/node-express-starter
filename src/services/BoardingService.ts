import { Service, Inject } from 'typedi';
import { PoolConnection } from 'mysql2/promise';
import { IUserRepository } from '../types/interfaces/IUserRepository';
import { ICompanyRepository } from '../types/interfaces/ICompanyRepository';
import { ITokenRepository } from '../types/interfaces/ITokenRepository';
import { BoardingDto } from '../types/dtos/boarding.dto';
import { BoardingResult, SetPasswordResult } from '../types/responses/boarding.response';
import {
  UserAlreadyExistsError,
  CompanyNotFoundError,
  InvalidTokenError,
  TokenExpiredError,
  WeakPasswordError,
} from '../types/errors/DomainErrors';
import { generateSecureToken, hashPassword, hashTokenForStorage } from '../utils/crypto';
import logger from '../utils/logger';
import { EventBus } from '../domain/EventBus';
import { UserOnboardedEvent } from '../domain/events/UserOnboardedEvent';

/**
 * Boarding Service
 * Implements user onboarding business logic
 * Uses repository interfaces for dependency inversion
 * Throws domain-specific errors for better error handling
 */
@Service()
export class BoardingService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ICompanyRepository') private readonly companyRepository: ICompanyRepository,
    @Inject('ITokenRepository') private readonly tokenRepository: ITokenRepository,
    @Inject('EventBus') private readonly eventBus: EventBus
  ) {
    logger.debug('BoardingService initialized with DI');
  }

  /**
   * Onboard a new user to the system
   *
   * Business flow:
   * 1. Validate company exists (throws CompanyNotFoundError)
   * 2. Check user doesn't already exist (throws UserAlreadyExistsError)
   * 3. Create user (inactive, no password)
   * 4. Attach user to company
   * 5. Generate secure one-time token
   * 6. Store hashed token in database
   * 7. Publishes UserOnboardedEvent to EventBus after successful commit.
   *
   * All operations are wrapped in a transaction for data consistency
   * On any error, transaction is rolled back automatically
   *
   * @param data - User boarding data (email, name, company_id)
   * @returns Password reset token (in production: send via email)
   * @throws {CompanyNotFoundError} If company doesn't exist
   * @throws {UserAlreadyExistsError} If user with email already exists
   * @throws {DatabaseError} If database operation fails
   */
  async onboardUser(data: BoardingDto): Promise<BoardingResult> {
    const conn: PoolConnection = await this.userRepository.getConnection();

    try {
      await conn.beginTransaction();
      logger.debug(`Starting boarding process for email: ${data.email}`);

      // 1. Validate company exists
      const company = await this.companyRepository.findById(data.company_id, conn);
      if (!company) {
        throw new CompanyNotFoundError(data.company_id);
      }
      logger.debug(`Company validated: ${company.name}`);

      // 2. Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email, conn);
      if (existingUser) {
        throw new UserAlreadyExistsError(data.email);
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

      // 7. Publish domain event AFTER successful commit
      // Event contains raw token so that handlers (email sender) can construct link.
      // In production the raw token should be sent via secure channels; we do not persist plain token.
      try {
        await this.eventBus.publish(
          new UserOnboardedEvent({
            userId,
            email: data.email,
            companyId: data.company_id,
            token,
          })
        );
        logger.debug('UserOnboardedEvent published to EventBus');
      } catch (eventErr) {
        // Publishing failure shouldn't break onboarding result; log and continue.
        logger.error('Failed to publish onboarding event:', eventErr);
      }

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
   *
   * Business flow:
   * 1. Hash incoming token and find in database
   * 2. Check if token exists and is unused (throws InvalidTokenError)
   * 3. Validate token is not expired (throws TokenExpiredError)
   * 4. Validate password meets requirements (throws WeakPasswordError)
   * 5. Hash password with Argon2
   * 6. Update user password and activate account
   * 7. Mark token as used (prevent reuse)
   *
   * @param token - One-time password reset token (plain text)
   * @param password - New password (min 12 characters)
   * @returns Success result
   * @throws {InvalidTokenError} If token is invalid or doesn't exist
   * @throws {TokenExpiredError} If token has expired (>12 hours old)
   * @throws {WeakPasswordError} If password doesn't meet requirements
   */
  async setPasswordFromToken(token: string, password: string): Promise<SetPasswordResult> {
    const conn: PoolConnection = await this.userRepository.getConnection();

    try {
      logger.debug('Starting password setup process');

      // 1. Hash token and find in database
      const tokenHash = hashTokenForStorage(token);
      const tokenRow = await this.tokenRepository.findUnusedByHash(tokenHash, conn);

      if (!tokenRow) {
        throw new InvalidTokenError();
      }

      // 2. Check if token is expired (default: 12 hours)
      const createdAt = new Date(tokenRow.created_at);
      const diffHours = (Date.now() - createdAt.getTime()) / 1000 / 3600;
      const expiryHours = Number(process.env.TOKEN_EXPIRY_HOURS) || 12;

      if (diffHours > expiryHours) {
        throw new TokenExpiredError();
      }
      logger.debug(`Token valid (${diffHours.toFixed(2)}h old, expires after ${expiryHours}h)`);

      // 3. Validate password length (additional validation in schema)
      if (password.length < 12) {
        throw new WeakPasswordError('Password must be at least 12 characters');
      }

      // 4. Hash password with Argon2 (OWASP recommended)
      const passwordHash = await hashPassword(password);
      logger.debug('Password hashed with Argon2');

      // Begin transaction: updating user password and marking token used should be atomic
      await conn.beginTransaction();

      try {
        // 5. Update user: set password, activate account
        await this.userRepository.setPassword(tokenRow.user_id, passwordHash, conn);
        logger.info(`Password set for user ${tokenRow.user_id}`);

        // 6. Mark token as used (prevent reuse)
        await this.tokenRepository.markAsUsed(tokenRow.id, conn);
        logger.debug(`Token ${tokenRow.id} marked as used`);

        await conn.commit();
      } catch (innerErr) {
        await conn.rollback();
        throw innerErr;
      }

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
