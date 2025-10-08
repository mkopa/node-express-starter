import crypto from 'crypto';
import argon2 from 'argon2';

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 256-bit
}

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id, // Recommended variant
    memoryCost: 65536, // 64 MB
    timeCost: 3, // Iterations
    parallelism: 4, // Threads
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function hashTokenForStorage(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyToken(token: string, hashedToken: string): boolean {
  return hashTokenForStorage(token) === hashedToken;
}

// Password strength validator
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special characters');
  }

  // Check against common passwords
  const commonPasswords = ['password123', 'admin123', '12345678'];
  if (commonPasswords.some((cp) => password.toLowerCase().includes(cp))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
