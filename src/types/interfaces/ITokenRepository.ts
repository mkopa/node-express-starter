import { PoolConnection } from 'mysql2/promise';
import { PasswordToken } from '../entities/PasswordToken.types';

/**
 * Token Repository Interface
 * Defines contract for password token data access operations
 */
export interface ITokenRepository {
  /**
   * Create new password reset token
   * @param userId - User ID
   * @param tokenHash - Hashed token
   * @param conn - Optional database connection for transactions
   * @returns ID of created token
   */
  create(userId: number, tokenHash: string, conn?: PoolConnection): Promise<number>;

  /**
   * Find unused token by hash
   * @param tokenHash - Hashed token
   * @param conn - Optional database connection for transactions
   * @returns Token if found and unused, null otherwise
   */
  findUnusedByHash(tokenHash: string, conn?: PoolConnection): Promise<PasswordToken | null>;

  /**
   * Mark token as used
   * @param tokenId - Token ID
   * @param conn - Optional database connection for transactions
   */
  markAsUsed(tokenId: number, conn?: PoolConnection): Promise<void>;

  /**
   * Delete expired tokens (cleanup job)
   * @param expiryHours - Hours after which tokens are considered expired
   * @returns Number of deleted tokens
   */
  deleteExpired(expiryHours: number): Promise<number>;
}
