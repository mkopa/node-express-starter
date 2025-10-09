/**
 * DTO for creating a new user
 * Used when inserting user into database
 */
export interface CreateUserDto {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
}

/**
 * DTO for updating user password
 * Used in password reset flow
 */
export interface UpdateUserPasswordDto {
  userId: number;
  passwordHash: string;
}

/**
 * DTO for updating user profile
 * Used in user management
 */
export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
}
