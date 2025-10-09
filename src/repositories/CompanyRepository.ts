import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from './base/BaseRepository';
import { ICompanyRepository } from '../types/interfaces/ICompanyRepository';
import { Company } from '../types/entities/Company.types';

/**
 * Company Repository Implementation
 * Handles all company-related database operations
 * Implements ICompanyRepository interface for dependency inversion
 */
@Service()
export class CompanyRepository extends BaseRepository implements ICompanyRepository {
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {
    super();
  }

  /**
   * Find company by ID
   */
  async findById(companyId: number, conn?: PoolConnection): Promise<Company | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>('SELECT * FROM companies WHERE id = ?', [
      companyId,
    ]);
    return (rows[0] as Company) || null;
  }

  /**
   * Find all companies
   * Sorted alphabetically by name
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
   * Optimized query - only checks existence without fetching data
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
