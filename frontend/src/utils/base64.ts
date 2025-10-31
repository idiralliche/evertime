// Portable, UTF-8 safe Base64 (browser + tests, no Buffer).

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  // Fast path (browser): build a binary string then btoa
  if (typeof btoa === 'function') {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  // Pure TS fallback (strict-TS safe)
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const b0 = bytes[i]!, b1 = bytes[i + 1]!, b2 = bytes[i + 2]!;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out +=
      B64_CHARS.charAt((n >> 18) & 63) +
      B64_CHARS.charAt((n >> 12) & 63) +
      B64_CHARS.charAt((n >> 6) & 63) +
      B64_CHARS.charAt(n & 63);
  }
  if (i < bytes.length) {
    const b0 = bytes[i]!;
    let n = (b0 << 16);
    let pad = '==';
    if (i + 1 < bytes.length) {
      const b1 = bytes[i + 1]!;
      n |= (b1 << 8);
      pad = '=';
    }
    out +=
      B64_CHARS.charAt((n >> 18) & 63) +
      B64_CHARS.charAt((n >> 12) & 63) +
      (i + 1 < bytes.length ? B64_CHARS.charAt((n >> 6) & 63) : '=') +
      pad;
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const clean = b64.replace(/[\r\n\s]/g, '');
  const bytes: number[] = [];
  let i = 0;
  const len = clean.length;
  const indexOf = (c: string): number => {
    if (c === '=') return 64;
    const idx = B64_CHARS.indexOf(c);
    if (idx === -1) throw new Error('Invalid base64 input');
    return idx;
  };
  while (i < len) {
    const c0 = indexOf(clean.charAt(i++));
    const c1 = indexOf(clean.charAt(i++));
    const c2 = i < len ? indexOf(clean.charAt(i++)) : 64;
    const c3 = i < len ? indexOf(clean.charAt(i++)) : 64;
    const n = (c0 << 18) | (c1 << 12) | ((c2 & 63) << 6) | (c3 & 63);
    bytes.push((n >> 16) & 255);
    if (c2 !== 64) bytes.push((n >> 8) & 255);
    if (c3 !== 64) bytes.push(n & 255);
  }
  return new Uint8Array(bytes);
}

export function encodeBase64(plain: string): string {
  const bytes = new TextEncoder().encode(plain); // UTF-8
  return bytesToBase64(bytes);
}

export function decodeBase64(b64: string): string {
  const bytes = base64ToBytes(b64);
  return new TextDecoder().decode(bytes);
}
