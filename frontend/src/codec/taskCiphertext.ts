// Codec for task title <-> ciphertext.
// Today uses Base64 (placeholder). Can be swapped to AES-GCM later without touching db/views.

import { encodeBase64, decodeBase64 } from '../utils/base64';

export function encodeTitlePlainToCiphertext(title: string): string {
  return encodeBase64(title.trim());
}

export function decodeTitleCiphertextToPlain(ciphertext: string): string {
  try {
    return decodeBase64(ciphertext);
  } catch {
    return '(invalid)';
  }
}
