import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Password token entity interface
 */
export interface PasswordToken {
  id: number;
  user_id: number;
  token_hash: string;
  created_at: Date;
  used: number;
}

/**
 * Token Repository - handles password reset token operations
 * Follows Repository pattern with Dependency Injection
 */
@Service()
export class TokenRepository {
  /**
   * Inject database pool from DI container
   * @param pool - MySQL connection pool registered in bootstrap
   */
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {}

  /**
   * Create new password reset token
   * Token is stored as SHA-256 hash for security
   * @param userId - User ID
   * @param tokenHash - SHA-256 hash of the token
   * @param conn - Optional connection (for transactions)
   * @returns Created token ID
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
   * Find valid (unused) token by hash
   * Only returns tokens that haven't been used yet
   * @param tokenHash - SHA-256 hash of the token
   * @param conn - Optional connection (for transactions)
   * @returns Token entity or null if not found/already used
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
   * Mark token as used (prevents reuse)
   * @param tokenId - Token ID
   * @param conn - Optional connection (for transactions)
   */
  async markAsUsed(tokenId: number, conn?: PoolConnection): Promise<void> {
    const client = conn || this.pool;
    await client.query('UPDATE password_tokens SET used = 1 WHERE id = ?', [tokenId]);
  }

  /**
   * Delete expired tokens (cleanup job)
   * Removes tokens older than specified hours
   * @param expiryHours - Token expiry time in hours
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
