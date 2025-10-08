import validator from 'validator';

export function sanitizeEmail(email: string): string {
  return validator.normalizeEmail(email.trim().toLowerCase()) || '';
}

export function sanitizeString(str: string): string {
  return validator.escape(str.trim());
}
