/**
 * Health check response
 * Provides system status information
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
  uptime: number;
  responseTime: string;
  environment: string;
  version: string;
  error?: string;
}
