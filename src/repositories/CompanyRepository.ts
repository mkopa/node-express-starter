import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

/**
 * Company entity interface
 */
export interface Company {
  id: number;
  name: string;
  created_at: Date;
}

/**
 * Company Repository - handles all company-related database operations
 * Follows Repository pattern with Dependency Injection
 */
@Service()
export class CompanyRepository {
  /**
   * Inject database pool from DI container
   * @param pool - MySQL connection pool registered in bootstrap
   */
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {}

  /**
   * Find company by ID
   * @param companyId - Company ID
   * @param conn - Optional connection (for transactions)
   * @returns Company entity or null if not found
   */
  async findById(companyId: number, conn?: PoolConnection): Promise<Company | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>('SELECT * FROM companies WHERE id = ?', [
      companyId,
    ]);
    return (rows[0] as Company) || null;
  }

  /**
   * Get all companies ordered by name
   * @param conn - Optional connection (for transactions)
   * @returns Array of company entities
   */
  async findAll(conn?: PoolConnection): Promise<Company[]> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>(
      'SELECT id, name, created_at FROM companies ORDER BY name'
    );
    return rows as Company[];
  }

  /**
   * Check if company exists
   * More efficient than findById when you only need to check existence
   * @param companyId - Company ID
   * @param conn - Optional connection (for transactions)
   * @returns True if company exists, false otherwise
   */
  async exists(companyId: number, conn?: PoolConnection): Promise<boolean> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>(
      'SELECT 1 FROM companies WHERE id = ? LIMIT 1',
      [companyId]
    );
    return rows.length > 0;
  }
}
