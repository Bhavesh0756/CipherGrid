/**
 * Industrial SecureSim API Service Layer.
 * Connects React frontend to Flask REST API endpoints.
 */

const BASE_URL = '/api';

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    return { ok: false, status: 0, data: { error: err.message || 'Network connection failed' } };
  }
}

export const api = {
  // System Health
  getHealth: () => fetchJson('/health'),

  // Dashboard
  getDashboardStats: () => fetchJson('/dashboard/stats'),

  // Devices & Message Simulation
  getDevices: () => fetchJson('/devices'),
  getDevice: (id) => fetchJson(`/devices/${id}`),
  createDevice: (payload) => fetchJson('/devices', { method: 'POST', body: JSON.stringify(payload) }),
  updateDevice: (id, payload) => fetchJson(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDevice: (id) => fetchJson(`/devices/${id}`, { method: 'DELETE' }),
  simulateDeviceMessage: (id, payload) => fetchJson(`/devices/${id}/simulate`, { method: 'POST', body: JSON.stringify(payload) }),
  getRolesMeta: () => fetchJson('/devices/meta/roles'),

  // Cryptography Lab
  // Classical
  runCaesar: (text, shift, decrypt = false) => fetchJson('/crypto/classical/caesar', { method: 'POST', body: JSON.stringify({ text, shift, decrypt }) }),
  runTransposition: (text, key, decrypt = false) => fetchJson('/crypto/classical/transposition', { method: 'POST', body: JSON.stringify({ text, key, decrypt }) }),

  // Symmetric (AES-GCM)
  aesEncrypt: (plaintext, associated_data = '') => fetchJson('/crypto/aes/encrypt', { method: 'POST', body: JSON.stringify({ plaintext, associated_data }) }),
  aesDecrypt: (ciphertext_b64, nonce_b64, tag_b64 = '', associated_data = '', key_b64 = null) => 
    fetchJson('/crypto/aes/decrypt', { method: 'POST', body: JSON.stringify({ ciphertext_b64, nonce_b64, tag_b64, associated_data, key_b64 }) }),
  rotateAesKey: () => fetchJson('/crypto/aes/rotate-key', { method: 'POST' }),

  // Hashing (SHA-256)
  hashSha256: (message) => fetchJson('/crypto/hash/sha256', { method: 'POST', body: JSON.stringify({ message }) }),
  compareSha256: (message_a, message_b) => fetchJson('/crypto/hash/compare', { method: 'POST', body: JSON.stringify({ message_a, message_b }) }),

  // Asymmetric (RSA)
  generateRsaKeypair: (key_size = 2048) => fetchJson('/crypto/rsa/keygen', { method: 'POST', body: JSON.stringify({ key_size }) }),
  getRsaPublicKey: () => fetchJson('/crypto/rsa/public-key'),
  hybridEncrypt: (plaintext) => fetchJson('/crypto/rsa/hybrid-encrypt', { method: 'POST', body: JSON.stringify({ plaintext }) }),
  hybridDecrypt: (payload) => fetchJson('/crypto/rsa/hybrid-decrypt', { method: 'POST', body: JSON.stringify(payload) }),

  // Digital Signatures (RSA-PSS)
  signMessage: (message) => fetchJson('/crypto/signatures/sign', { method: 'POST', body: JSON.stringify({ message }) }),
  verifySignature: (message, signature_b64) => fetchJson('/crypto/signatures/verify', { method: 'POST', body: JSON.stringify({ message, signature_b64 }) }),

  // Digital Certificates (X.509)
  generateCertificate: (common_name, organization) => fetchJson('/crypto/certificates/generate', { method: 'POST', body: JSON.stringify({ common_name, organization }) }),
  inspectCertificate: () => fetchJson('/crypto/certificates/inspect'),
  validateCertificate: (hostname = 'localhost') => fetchJson('/crypto/certificates/validate', { method: 'POST', body: JSON.stringify({ hostname }) }),

  // Logs
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/logs${query ? `?${query}` : ''}`);
  },
  clearLogs: () => fetchJson('/logs/clear', { method: 'POST' }),

  // TLS & Secure Communication
  getTlsStatus: () => fetchJson('/tls/status'),
  runLiveTlsTest: () => fetchJson('/tls/run-test', { method: 'POST' }),
  getIpsecSpec: () => fetchJson('/tls/ipsec-spec'),
  getWiresharkGuide: () => fetchJson('/tls/wireshark-guide'),
};
