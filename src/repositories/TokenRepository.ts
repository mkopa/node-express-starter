import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { BaseRepository } from './base/BaseRepository';
import { ITokenRepository } from '../types/interfaces/ITokenRepository';
import { PasswordToken } from '../types/entities/PasswordToken.types';

/**
 * Token Repository Implementation
 * Handles all password token related database operations
 * Implements ITokenRepository interface for dependency inversion
 */
@Service()
export class TokenRepository extends BaseRepository implements ITokenRepository {
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {
    super();
  }

  /**
   * Create new password reset token
   * Token is stored as hash for security
   */
  async create(userId: number, tokenHash: string, conn?: PoolConnection): Promise<number> {
    const client = conn || this.pool;
    const [result] = await client.query<ResultSetHeader>(
      'INSERT INTO password_tokens (user_id, token_hash, used) VALUES (?, ?, 0)',
      [userId, tokenHash]
    );
    return result.insertId;
  }

  /**
   * Find unused token by hash
   * Only returns tokens that haven't been used yet
   */
  async findUnusedByHash(tokenHash: string, conn?: PoolConnection): Promise<PasswordToken | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>(
      'SELECT * FROM password_tokens WHERE token_hash = ? AND used = 0',
      [tokenHash]
    );
    return (rows[0] as PasswordToken) || null;
  }

  /**
   * Mark token as used
   * Prevents token reuse (one-time tokens)
   */
  async markAsUsed(tokenId: number, conn?: PoolConnection): Promise<void> {
    const client = conn || this.pool;
    await client.query('UPDATE password_tokens SET used = 1 WHERE id = ?', [tokenId]);
  }

  /**
   * Delete expired tokens (cleanup job)
   * Should be run periodically (e.g., daily cron job)
   * @returns Number of deleted tokens
   */
  async deleteExpired(expiryHours: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `DELETE FROM password_tokens 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [expiryHours]
    );
    return result.affectedRows;
  }
}
