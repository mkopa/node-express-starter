import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { BaseRepository } from './base/BaseRepository';
import { IUserRepository } from '../types/interfaces/IUserRepository';
import { User } from '../types/entities/User.types';
import { CreateUserDto } from '../types/dtos/user.dto';

// Export User type for use in other files
export { User };

/**
 * User Repository Implementation
 * Handles all user-related database operations
 * Implements IUserRepository interface for dependency inversion
 */
@Service()
export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {
    super();
  }

  /**
   * Find user by email address
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
   */
  async findById(userId: number, conn?: PoolConnection): Promise<User | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [
      userId,
    ]);
    return (rows[0] as User) || null;
  }

  /**
   * Create new user
   * User is created as inactive without password
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
   * Marks user as active and sets has_password flag
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
   * Get database connection for transaction management
   */
  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }
}
