/**
 * Company Entity
 * Represents a company in the system
 * Maps 1:1 with companies table in database
 */
export interface Company {
  id: number;
  name: string;
  created_at: Date;
}

/**
 * Company with user count
 * Used for analytics/reporting
 */
export interface CompanyWithUserCount extends Company {
  user_count: number;
}
