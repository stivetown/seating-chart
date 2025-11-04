import { randomBytes } from 'crypto';

// Base58 alphabet (excludes 0, O, I, l for readability)
const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Generates a secure random base58 token of specified length
 * @param length - Length of the token (default: 12)
 * @returns Base58 encoded token
 */
export function generateSecureToken(length: number = 12): string {
  // Generate cryptographically secure random bytes
  const bytes = randomBytes(length);

  // Convert to base58
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += BASE58_ALPHABET[bytes[i] % BASE58_ALPHABET.length];
  }

  return result;
}

/**
 * Validates that a token is exactly 12 characters and contains only base58 characters
 * @param token - Token to validate
 * @returns True if valid, false otherwise
 */
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  if (token.length !== 12) {
    return false;
  }

  // Check that all characters are in the base58 alphabet
  for (const char of token) {
    if (!BASE58_ALPHABET.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Generates a unique invite token for sessions
 * @returns 12-character base58 token
 */
export function generateInviteToken(): string {
  return generateSecureToken(12);
}
