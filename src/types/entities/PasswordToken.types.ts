/**
 * Password Token Entity
 * Represents a one-time password reset token
 * Maps 1:1 with password_tokens table in database
 */
export interface PasswordToken {
  id: number;
  user_id: number;
  token_hash: string;
  created_at: Date;
  used: number;
}

/**
 * Token validation result
 * Used internally to check token validity
 */
export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isUsed: boolean;
  token?: PasswordToken;
}
