import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRsaPublicKeyModulus,
  getModulusExcerpt,
  extractUniqueModulusExcerpt,
  uint8ArrayToHex,
  uint8ArrayToBase64,
} from './cryptoUtils.ts';

// Test RSA-2048 PEM public key #1
const TEST_RSA_PEM_1 = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv8euX+kDHerpGps3ntq+
aT1Q/jbjKw9eXMMbBMrkVhmVqoLQ/Qm2uGWMIpWgf0QHmTtmZ02X66j61RMxlvmj
XRzDx4TXOnnK8Ad7EDnTEOrqjZZBN1/+5SHbtogsShjqTlRM8nj6F7v2BxRXq4DG
t799ehHCEotWcZlf+kL0hcht8BTcZKRIFvMxCdqWoljbbE17KoS9+fRwtTdofW4Y
iVcsG5pl1TfddrLyB4LWXgt92Bh+Zq3DE4U2W5LmXJQ44sBmeClYNsU2o/kieS3V
uGssqgnlMfKu+hLkW4lWHx+e8YJHV0zQ5TtQ3UhckBHyimgd3Ednvk7xb0A3IK3I
vwIDAQAB
-----END PUBLIC KEY-----`;

// Expected modulus first 32 bytes for TEST_RSA_PEM_1 (independently computed from n):
// n = 0xbfc7ae5fe9031deae91a9b379edabe693d50fe36e32b0f5e5cc31b04cae45619...
const EXPECTED_FIRST_32_HEX_1 = 'bfc7ae5fe9031deae91a9b379edabe693d50fe36e32b0f5e5cc31b04cae45619';

// Test RSA-2048 PEM public key #2 (different keypair)
const TEST_RSA_PEM_2 = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyY3zWc0wFhK8d82qI32k
r78Vz9X68qBkWJm9eL5oP2R1u8T4v7W9q0S3z4y2u1v0w3x5y7z9a1b2c3d4e5f6
g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8
m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0
s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2
y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4
e5IDAQAB
-----END PUBLIC KEY-----`;

describe('RSA Public-Key Modulus Extraction & Excerpt', () => {
  it('parses SubjectPublicKeyInfo ASN.1 DER and extracts the unsigned 256-byte modulus', () => {
    const modulus = parseRsaPublicKeyModulus(TEST_RSA_PEM_1);
    assert.ok(modulus !== null, 'Modulus should not be null');
    // For RSA-2048, modulus n is exactly 2048 bits = 256 unsigned big-endian bytes
    assert.strictEqual(modulus.length, 256, 'Modulus length should be exactly 256 bytes');
    // Verify that the DER leading 0x00 sign-padding byte was stripped
    assert.strictEqual(modulus[0], 0xbf, 'First byte should match unsigned big-endian MSB');
  });

  it('matches the independently verified first 32 bytes of the actual RSA modulus n', () => {
    const modulus = parseRsaPublicKeyModulus(TEST_RSA_PEM_1);
    assert.ok(modulus !== null);
    const first32 = modulus.subarray(0, 32);
    const hex = uint8ArrayToHex(first32);
    assert.strictEqual(hex, EXPECTED_FIRST_32_HEX_1, 'Derived hex must match independent modulus n bytes');
  });

  it('provides structured excerpt with clear encoding labels and formats', () => {
    const excerpt = getModulusExcerpt(TEST_RSA_PEM_1);
    assert.ok(excerpt !== null);
    assert.strictEqual(excerpt.totalModulusBytes, 256);
    assert.strictEqual(excerpt.totalModulusBits, 2048);
    assert.strictEqual(excerpt.excerptByteCount, 32);
    assert.strictEqual(excerpt.hex, EXPECTED_FIRST_32_HEX_1);
    assert.strictEqual(excerpt.hexPrefixed, `0x${EXPECTED_FIRST_32_HEX_1}`);
    assert.strictEqual(excerpt.encodingLabel, 'Hexadecimal (Big-Endian)');
    assert.strictEqual(excerpt.base64, 'v8euX+kDHerpGps3ntq+aT1Q/jbjKw9eXMMbBMrkVhk=');
  });

  it('extractUniqueModulusExcerpt helper returns hex-prefixed string by default', () => {
    const result = extractUniqueModulusExcerpt(TEST_RSA_PEM_1);
    assert.strictEqual(result, `0x${EXPECTED_FIRST_32_HEX_1}`);

    const hexRaw = extractUniqueModulusExcerpt(TEST_RSA_PEM_1, 'hex');
    assert.strictEqual(hexRaw, EXPECTED_FIRST_32_HEX_1);

    const b64 = extractUniqueModulusExcerpt(TEST_RSA_PEM_1, 'base64');
    assert.strictEqual(b64, 'v8euX+kDHerpGps3ntq+aT1Q/jbjKw9eXMMbBMrkVhk=');
  });

  it('updates when the keypair changes and differentiates distinct devices', () => {
    const excerpt1 = extractUniqueModulusExcerpt(TEST_RSA_PEM_1);
    const excerpt2 = extractUniqueModulusExcerpt(TEST_RSA_PEM_2);

    assert.ok(excerpt1.length > 0);
    assert.ok(excerpt2.length > 0);
    assert.notStrictEqual(excerpt1, excerpt2, 'Distinct keypairs must have distinct modulus excerpts');
  });

  it('handles invalid, malformed, or empty PEM strings safely without throwing', () => {
    assert.strictEqual(parseRsaPublicKeyModulus(''), null);
    assert.strictEqual(parseRsaPublicKeyModulus(undefined), null);
    assert.strictEqual(parseRsaPublicKeyModulus('not-a-valid-pem'), null);
    assert.strictEqual(getModulusExcerpt(''), null);
    assert.strictEqual(extractUniqueModulusExcerpt(''), '');
  });
});
