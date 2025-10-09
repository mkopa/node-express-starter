import { PoolConnection } from 'mysql2/promise';
import { User } from '../entities/User.types';
import { CreateUserDto } from '../dtos/user.dto';

/**
 * User Repository Interface
 * Defines contract for user data access operations
 * Allows for easy mocking in tests and alternative implementations
 */
export interface IUserRepository {
  /**
   * Find user by email address
   * @param email - User email
   * @param conn - Optional database connection for transactions
   * @returns User if found, null otherwise
   */
  findByEmail(email: string, conn?: PoolConnection): Promise<User | null>;

  /**
   * Find user by ID
   * @param userId - User ID
   * @param conn - Optional database connection for transactions
   * @returns User if found, null otherwise
   */
  findById(userId: number, conn?: PoolConnection): Promise<User | null>;

  /**
   * Create new user
   * @param data - User data
   * @param conn - Optional database connection for transactions
   * @returns ID of created user
   */
  create(data: CreateUserDto, conn?: PoolConnection): Promise<number>;

  /**
   * Attach user to company (many-to-many relationship)
   * @param userId - User ID
   * @param companyId - Company ID
   * @param conn - Optional database connection for transactions
   */
  attachToCompany(userId: number, companyId: number, conn?: PoolConnection): Promise<void>;

  /**
   * Set user password and activate account
   * @param userId - User ID
   * @param passwordHash - Hashed password
   * @param conn - Optional database connection for transactions
   */
  setPassword(userId: number, passwordHash: string, conn?: PoolConnection): Promise<void>;

  /**
   * Get database connection for transaction management
   * @returns Database connection
   */
  getConnection(): Promise<PoolConnection>;
}
