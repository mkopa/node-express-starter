/**
 * DTO for user boarding request
 * Combines user data with company assignment
 */
export interface BoardingDto {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  company_id: number;
}

/**
 * DTO for password setup request
 * Contains password from request body
 */
export interface SetPasswordDto {
  password: string;
}

/**
 * Internal DTO for token creation
 * Used when generating password reset tokens
 */
export interface CreateTokenDto {
  userId: number;
  tokenHash: string;
}
