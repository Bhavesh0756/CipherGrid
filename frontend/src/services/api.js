/**
 * Industrial SecureSim API Service Layer.
 * Connects React frontend to Flask REST API endpoints.
 */

/**
 * Resolves the API base URL:
 * - If VITE_API_URL is configured (e.g. in Vercel), normalizes it and ensures /api prefix exactly once.
 *   Examples handled:
 *     "https://app.onrender.com"     -> "https://app.onrender.com/api"
 *     "https://app.onrender.com/"    -> "https://app.onrender.com/api"
 *     "https://app.onrender.com/api" -> "https://app.onrender.com/api"
 *     "https://app.onrender.com/api/"-> "https://app.onrender.com/api"
 * - If VITE_API_URL is unset/empty, falls back to '/api' for Vite local dev proxy.
 */
function resolveBaseUrl() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) {
    return '/api';
  }
  const stripped = envUrl.replace(/\/+$/, '');
  return stripped.endsWith('/api') ? stripped : `${stripped}/api`;
}

export const BASE_URL = resolveBaseUrl();

async function fetchJson(url, options = {}) {
  const endpoint = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const contentType = res.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = { error: 'Failed to parse JSON response from server' };
      }
    } else {
      const text = await res.text();
      // Detect Render / Cloud Gateway cold-start and downtime HTML pages
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        data = {
          error: `Backend instance is starting up on Render (HTTP ${res.status}). Free tier instances spin down after inactivity — please allow ~30-50s for wakeup.`,
          isColdStart: true,
          status: res.status
        };
      } else {
        data = {
          error: text.length > 200 ? `Server returned HTTP ${res.status}` : text || `HTTP ${res.status}`,
          status: res.status
        };
      }
    }

    return { ok: res.ok, status: res.status, data: data || {} };
  } catch (err) {
    console.error(`API Error on ${fullUrl}:`, err);
    const isNetwork = err.name === 'TypeError' || err.message?.includes('Failed to fetch');
    return {
      ok: false,
      status: 0,
      data: {
        error: isNetwork
          ? 'Cannot reach backend server. The Render service might be spinning up from sleep mode (~30-50s) or blocked by CORS.'
          : err.message || 'Network connection failed',
        isNetworkError: isNetwork
      }
    };
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
