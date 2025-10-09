import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { BaseRepository } from './base/BaseRepository';

export interface PasswordToken {
  id: number;
  user_id: number;
  token_hash: string;
  created_at: Date;
  used: number;
}

@Service()
export class TokenRepository extends BaseRepository {
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {
    super();
  }

  async create(userId: number, tokenHash: string, conn?: PoolConnection): Promise<number> {
    const client = conn || this.pool;
    const [result] = await client.query<ResultSetHeader>(
      'INSERT INTO password_tokens (user_id, token_hash, used) VALUES (?, ?, 0)',
      [userId, tokenHash]
    );
    return result.insertId;
  }

  async findUnusedByHash(tokenHash: string, conn?: PoolConnection): Promise<PasswordToken | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>(
      'SELECT * FROM password_tokens WHERE token_hash = ? AND used = 0',
      [tokenHash]
    );
    return (rows[0] as PasswordToken) || null;
  }

  async markAsUsed(tokenId: number, conn?: PoolConnection): Promise<void> {
    const client = conn || this.pool;
    await client.query('UPDATE password_tokens SET used = 1 WHERE id = ?', [tokenId]);
  }

  async deleteExpired(expiryHours: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `DELETE FROM password_tokens 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [expiryHours]
    );
    return result.affectedRows;
  }
}
