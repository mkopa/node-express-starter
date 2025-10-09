import { Service, Inject } from 'typedi';
import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from './base/BaseRepository';

export interface Company {
  id: number;
  name: string;
  created_at: Date;
}

@Service()
export class CompanyRepository extends BaseRepository {
  constructor(@Inject('DB_POOL') private readonly pool: Pool) {
    super();
  }

  async findById(companyId: number, conn?: PoolConnection): Promise<Company | null> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>('SELECT * FROM companies WHERE id = ?', [
      companyId,
    ]);
    return (rows[0] as Company) || null;
  }

  async findAll(conn?: PoolConnection): Promise<Company[]> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>(
      'SELECT id, name, created_at FROM companies ORDER BY name'
    );
    return rows as Company[];
  }

  async exists(companyId: number, conn?: PoolConnection): Promise<boolean> {
    const client = conn || this.pool;
    const [rows] = await client.query<RowDataPacket[]>(
      'SELECT 1 FROM companies WHERE id = ? LIMIT 1',
      [companyId]
    );
    return rows.length > 0;
  }
}
