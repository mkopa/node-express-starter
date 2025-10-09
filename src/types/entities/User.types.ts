/**
 * User Entity
 * Represents a user in the system
 * Maps 1:1 with users table in database
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
 * User with company information
 * Used when fetching user with related companies
 */
export interface UserWithCompanies extends User {
  companies: number[]; // Array of company IDs
}
