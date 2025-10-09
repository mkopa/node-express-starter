import { PoolConnection } from 'mysql2/promise';
import { Company } from '../entities/Company.types';

/**
 * Company Repository Interface
 * Defines contract for company data access operations
 */
export interface ICompanyRepository {
  /**
   * Find company by ID
   * @param companyId - Company ID
   * @param conn - Optional database connection for transactions
   * @returns Company if found, null otherwise
   */
  findById(companyId: number, conn?: PoolConnection): Promise<Company | null>;

  /**
   * Find all companies
   * @param conn - Optional database connection for transactions
   * @returns Array of all companies
   */
  findAll(conn?: PoolConnection): Promise<Company[]>;

  /**
   * Check if company exists
   * @param companyId - Company ID
   * @param conn - Optional database connection for transactions
   * @returns true if company exists, false otherwise
   */
  exists(companyId: number, conn?: PoolConnection): Promise<boolean>;
}
