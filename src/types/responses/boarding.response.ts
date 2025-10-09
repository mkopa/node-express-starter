/**
 * Response for successful user boarding
 * Returns token for password setup (in production: send via email)
 */
export interface BoardingSuccessResponse {
  message: string;
  token: string; // TODO: Remove from response in production, send via email
  userId?: number; // Optional: for internal tracking
}

/**
 * Response for successful password setup
 * Confirms user activation
 */
export interface SetPasswordSuccessResponse {
  success: true;
  message: string;
}

/**
 * Internal result for boarding operation
 * Used between service and controller
 */
export interface BoardingResult {
  userId: number;
  token: string;
  message: string;
}

/**
 * Internal result for password setup operation
 * Used between service and controller
 */
export interface SetPasswordResult {
  success: true;
  message: string;
}
