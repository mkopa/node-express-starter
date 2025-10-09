/**
 * AuditRepository
 *
 * Simple repository to persist audit/log entries to `audit_logs` table.
 * Used by event handlers to store an auditable record (password email sent, etc).
 *
 * Uses same pattern as other repositories: accepts optional PoolConnection for transactions.
 */

import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise';

@Service()
export class AuditRepository {
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {}

  /**
   * Insert audit log. Message should be concise; metadata can be JSON.
   */
  async insert(
    userId: number | null,
    action: string,
    message: string,
    metadata: Record<string, unknown> | null = null,
    conn?: PoolConnection
  ): Promise<number> {
    const client = conn || this.pool;
    const [result] = await client.query<ResultSetHeader>(
      `INSERT INTO audit_logs (user_id, action, message, metadata) VALUES (?, ?, ?, ?)`,
      [userId, action, message, metadata ? JSON.stringify(metadata) : null]
    );
    return result.insertId;
  }
}
