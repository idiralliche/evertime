// Generic codec for task plaintext <-> ciphertext.
// Today uses Base64 as a placeholder. Can be swapped to AES-GCM later without touching db/views.

import { encodeBase64, decodeBase64 } from '../utils/base64';

/** Encode any UI text to ciphertext (trim + Base64). */
export function encodeCiphertext(plain: string): string {
  return encodeBase64(plain.trim());
}

/** Decode required ciphertext. On corruption, return a visible placeholder. */
export function decodeCiphertext(ciphertext: string): string {
  try {
    return decodeBase64(ciphertext);
  } catch {
    return '(invalid)';
  }
}

/**
 * Decode optional ciphertext (nullable/undefined → empty string).
 * @deprecated Prefer normalizing at call site:
 *   const plain = ciphertext ? decodeCiphertext(ciphertext) : '';
 */
export function decodeOptionalCiphertext(
  ciphertext: string | null | undefined
): string {
  if (!ciphertext) return '';
  return decodeCiphertext(ciphertext);
}
