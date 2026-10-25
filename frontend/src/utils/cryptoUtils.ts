/**
 * Cryptographic utility helpers for ICS/OT device public keys and signatures.
 * Includes a pure synchronous SHA-256 implementation matching standard RFC 6234,
 * ensuring instant cryptographic fingerprints without async delays in React render loops.
 */

function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // UTF-8 encode
  const utf8Bytes: number[] = [];
  for (let b = 0; b < ascii.length; b++) {
    let charcode = ascii.charCodeAt(b);
    if (charcode < 0x80) utf8Bytes.push(charcode);
    else if (charcode < 0x800) {
      utf8Bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8Bytes.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      b++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (ascii.charCodeAt(b) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const bitLength = utf8Bytes.length * 8;
  utf8Bytes.push(0x80);
  while ((utf8Bytes.length % 64) !== 56) {
    utf8Bytes.push(0);
  }

  for (let w = 0; w < utf8Bytes.length; w += 4) {
    words.push(
      (utf8Bytes[w] << 24) |
      (utf8Bytes[w + 1] << 16) |
      (utf8Bytes[w + 2] << 8) |
      utf8Bytes[w + 3]
    );
  }

  words.push(Math.floor(bitLength / maxWord));
  words.push(bitLength >>> 0);

  const w = new Array(64);
  for (j = 0; j < words.length;) {
    const wSub = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      let i2: number;
      if (i < 16) {
        w[i] = wSub[i];
      } else {
        const gamma0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const gamma1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + gamma0 + w[i - 7] + gamma1) | 0;
      }

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const sigma0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const sigma1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      const temp1 = (hash[7] + sigma1 + ch + k[i] + w[i]) | 0;
      const temp2 = (sigma0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

/**
 * Computes a standard SHA-256 cryptographic fingerprint from a PEM string.
 */
export function computeKeyFingerprint(pem?: string): string {
  if (!pem || typeof pem !== 'string') return '';
  return sha256(pem);
}

/**
 * Formats a raw hex string into standard colon-separated hex pairs (e.g. 1D:55:BA:...).
 */
export function formatColonFingerprint(hexStr: string): string {
  if (!hexStr) return '';
  const clean = hexStr.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const pairs: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    pairs.push(clean.slice(i, i + 2));
  }
  return pairs.join(':');
}

/**
 * Produces a concise fingerprint display string (e.g. "1d55ba70...d361").
 */
export function getShortFingerprint(pem?: string, cachedFingerprint?: string): string {
  const fp = cachedFingerprint || computeKeyFingerprint(pem);
  if (!fp) return 'N/A';
  if (fp.length <= 16) return fp;
  return `${fp.slice(0, 8)}...${fp.slice(-6)}`;
}

/**
 * Extracts the distinct prime modulus excerpt from an RSA PEM key by skipping the static ASN.1 header.
 * Standard RSA-2048 SubjectPublicKeyInfo header is 71 characters (including PEM label and ASN.1 OID prefix).
 */
export function extractUniqueModulusExcerpt(pem?: string): string {
  if (!pem) return '';
  // Strip PEM armor
  const stripped = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');

  // Skip the standard ASN.1 33-byte (44 base64 chars) header: MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
  const headerPrefix = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA';
  if (stripped.startsWith(headerPrefix)) {
    return stripped.slice(headerPrefix.length, headerPrefix.length + 32);
  }
  return stripped.slice(0, 32);
}
