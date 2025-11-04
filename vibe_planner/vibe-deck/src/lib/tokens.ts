import { randomBytes } from 'crypto';

// Base58 alphabet (no confusing characters like 0, O, I, l)
const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Generate a secure base58 token of specified length
 */
export function generateSecureToken(length: number = 12): string {
  const bytes = randomBytes(length);
  let result = '';

  for (let i = 0; i < bytes.length; i++) {
    result += BASE58_ALPHABET[bytes[i] % BASE58_ALPHABET.length];
  }

  return result;
}

/**
 * Generate a unique invite token for sessions
 */
export function generateInviteToken(): string {
  return generateSecureToken(12);
}
