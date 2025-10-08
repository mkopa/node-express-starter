import { Pool } from 'mysql2';

export async function logAudit(pool: Pool, action: string, userId: number, metadata: any) {
  await pool.query(
    `INSERT INTO audit_logs (action, user_id, metadata, ip_address, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [action, userId, JSON.stringify(metadata), metadata.ip]
  );
}
