import mysql, { Pool } from 'mysql2/promise';
import logger from '../utils/logger';

export async function createDbPool(): Promise<Pool> {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'boarding',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await pool.query('SELECT 1');
  logger.info('✅ Connected to MySQL');
  return pool;
}
