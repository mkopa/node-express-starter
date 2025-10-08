import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * User entity interface
 */
export interface User {
  id: number;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  is_active: number;
  has_password: number;
  password_hash?: string;
  created_at: Date;
}

/**
 * Data Transfer Object for user creation
 */
export interface CreateUserDto {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
}

/**
 * User Repository - handles all user-related database operations
 * Follows Repository pattern with Dependency Injection
 */
@Service()
export class UserRepository {
  /**
   * Inject database pool from DI container
   * @param pool - MySQL connection pool registered in bootstrap
   */
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {}

  /**
   * Find user by email address
   * @param email - User email
   * @param conn - Optional connection (for transactions)
   * @returns User entity or null if not found
   */
  async findByEmail(email: string, conn?: PoolConnection): Promise<User | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [
      email,
    ]);
    return (rows[0] as User) || null;
  }

  /**
   * Find user by ID
   * @param userId - User ID
   * @param conn - Optional connection (for transactions)
   * @returns User entity or null if not found
   */
  async findById(userId: number, conn?: PoolConnection): Promise<User | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [
      userId,
    ]);
    return (rows[0] as User) || null;
  }

  /**
   * Create new user in database
   * User is created as inactive without password
   * @param data - User creation data
   * @param conn - Optional connection (for transactions)
   * @returns Newly created user ID
   */
  async create(data: CreateUserDto, conn?: PoolConnection): Promise<number> {
    const client = conn || this.pool;
    const [result] = await client.query<ResultSetHeader>(
      `INSERT INTO users (email, phone, first_name, last_name, is_active, has_password)
       VALUES (?, ?, ?, ?, 0, 0)`,
      [data.email, data.phone || null, data.first_name, data.last_name]
    );
    return result.insertId;
  }

  /**
   * Attach user to company (many-to-many relationship)
   * Uses INSERT IGNORE to prevent duplicate entries
   * @param userId - User ID
   * @param companyId - Company ID
   * @param conn - Optional connection (for transactions)
   */
  async attachToCompany(userId: number, companyId: number, conn?: PoolConnection): Promise<void> {
    const client = conn || this.pool;
    await client.query('INSERT IGNORE INTO user_companies (user_id, company_id) VALUES (?, ?)', [
      userId,
      companyId,
    ]);
  }

  /**
   * Set user password and activate account
   * @param userId - User ID
   * @param passwordHash - Hashed password (Argon2)
   * @param conn - Optional connection (for transactions)
   */
  async setPassword(userId: number, passwordHash: string, conn?: PoolConnection): Promise<void> {
    const client = conn || this.pool;
    await client.query(
      `UPDATE users 
       SET password_hash = ?, has_password = 1, is_active = 1 
       WHERE id = ?`,
      [passwordHash, userId]
    );
  }

  /**
   * Get connection from pool for manual transaction handling
   * Remember to release the connection after use!
   * @returns Database connection
   */
  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }
}
