import type {
/**
 * CipherGrid Industrial Security Simulator API Service
 * Centralized REST client with auto-reconnecting fetch, base URL resolution, and typed error handling.
 */
  AuditLog,
  DashboardStats,
  Device,
  LabReport,
  SecurityScenarioResult,
  SimulationEvent,
  TopologyData,
} from '../types';

/**
 * Resolves the API base URL:
 * 1. If VITE_API_BASE_URL is provided, normalize trailing slashes and ensure it ends with '/api'.
 * 2. In production mode (e.g. deployed on Vercel), fall back to the live Render backend:
 *    https://aegisgrid-backend.onrender.com/api
 * 3. In local development without env, fall back to '/api' which routes through the local Vite dev proxy.
 */
function resolveBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    const sanitized = envUrl.replace(/\/+$/, '');
    return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
  }
  if (import.meta.env.PROD) {
    return 'https://aegisgrid-backend.onrender.com/api';
  }
  return '/api';
}

const BASE_URL = resolveBaseUrl();

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  async getHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  // Devices
  async getDevices(): Promise<{ success: boolean; devices: any[] }> {
    const res = await fetch(`${BASE_URL}/devices`);
    return handleResponse(res);
  },

  async getDevice(id: string): Promise<{ success: boolean; device: any }> {
    const res = await fetch(`${BASE_URL}/devices/${id}`);
    return handleResponse(res);
  },

  async createDevice(device: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device),
    });
    return handleResponse(res);
  },

  async updateDevice(id: string, updates: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteDevice(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/devices/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Topology
  async getTopology(): Promise<{
    success: boolean;
    topology_id: string;
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
  }> {
    const res = await fetch(`${BASE_URL}/topology`);
    return handleResponse(res);
  },

  async getConnections(): Promise<{ success: boolean; connections: any[]; total: number }> {
    const res = await fetch(`${BASE_URL}/topology/connections`);
    return handleResponse(res);
  },

  async saveTopology(data: {
    nodes: any[];
    edges: any[];
    name?: string;
    description?: string;
  }): Promise<{ success: boolean; message: string; topology_id: string }> {
    const res = await fetch(`${BASE_URL}/topology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async resetTopology(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/topology/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Messages & Simulation
  async simulateMessage(params: {
    sender_id: string;
    receiver_id: string;
    message_type: string;
    payload: string;
    security_profile: string;
    scenario_id?: string;
    session_id?: string;
  }): Promise<{
    success: boolean;
    session_id: string;
    message_id: string;
    delivered: boolean;
    status: string;
    reason: string;
    path: string[];
    events: any[];
    message_record: Record<string, any>;
    security_record: Record<string, any>;
  }> {
    const res = await fetch(`${BASE_URL}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getMessages(limit = 50): Promise<{ success: boolean; messages: any[] }> {
    const res = await fetch(`${BASE_URL}/messages?limit=${limit}`);
    return handleResponse(res);
  },

  // Security Scenarios
  async getScenarios(): Promise<{ success: boolean; scenarios: any[] }> {
    const res = await fetch(`${BASE_URL}/security/scenarios`);
    return handleResponse(res);
  },

  async runSecurityScenario(scenarioId: string): Promise<{ success: boolean; result: any }> {
    const res = await fetch(`${BASE_URL}/security/scenarios/${scenarioId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  // Dedicated Cryptographic Services (100% Backend-Driven)
  async computeHash(payload: string): Promise<{
    success: boolean;
    algorithm: string;
    canonical_payload: string;
    digest: string;
    input_length_bytes: number;
    timestamp: string;
  }> {
    const res = await fetch(`${BASE_URL}/security/hash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    return handleResponse(res);
  },

  async verifyHash(payload: string, expectedDigest: string): Promise<{
    success: boolean;
    valid: boolean;
    computed_digest: string;
    expected_digest: string;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/security/hash/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, expected_digest: expectedDigest }),
    });
    return handleResponse(res);
  },

  async signPayload(deviceId: string, payload: string): Promise<{
    success: boolean;
    device_id: string;
    algorithm: string;
    digest: string;
    signature_b64: string;
    public_key_pem?: string;
  }> {
    const res = await fetch(`${BASE_URL}/security/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, payload }),
    });
    return handleResponse(res);
  },

  async verifySignature(params: {
    deviceId?: string;
    payload: string;
    signatureB64: string;
    publicKeyPem?: string;
  }): Promise<{
    success: boolean;
    valid: boolean;
    message: string;
    algorithm: string;
    digest: string;
  }> {
    const res = await fetch(`${BASE_URL}/security/verify-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: params.deviceId,
        payload: params.payload,
        signature_b64: params.signatureB64,
        public_key_pem: params.publicKeyPem,
      }),
    });
    return handleResponse(res);
  },

  async verifyCryptoWorkbench(params: {
    payload: string;
    device_id?: string;
    tamper_payload?: boolean;
    tamper_ciphertext?: boolean;
    tamper_tag?: boolean;
    tamper_signature?: boolean;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/security/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getDevicePublicKey(deviceId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/devices/${deviceId}/public-key`);
    return handleResponse(res);
  },

  async rotateDeviceKeys(deviceId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/devices/${deviceId}/rotate-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async getNotifications(limit = 15): Promise<{ success: boolean; notifications: any[] }> {
    const res = await fetch(`${BASE_URL}/events/notifications?limit=${limit}`);
    return handleResponse(res);
  },

  // Dedicated Cryptographic Packet Forensics Verification
  async verifyPacketForensics(params: {
    message_id?: string;
    payload?: string;
    sender_id?: string;
    receiver_id?: string;
    security_profile?: string;
    digest?: string;
    signature?: string;
    ciphertext?: string;
    nonce?: string;
    tag?: string;
    associated_data?: string;
    message_type?: string;
    packet_state?: string;
    hops?: string[];
    tamper_options?: {
      active?: boolean;
      tamper_payload?: boolean;
      tampered_payload_text?: string;
      tamper_ciphertext?: boolean;
      tamper_tag?: boolean;
      tamper_signature?: boolean;
    };
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/security/verify-packet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Events & Audit
  async getPacketEvents(params?: {
    limit?: number;
    state?: string;
    search?: string;
    message_id?: string;
  } | number): Promise<{ success: boolean; events: any[] }> {
    const query = new URLSearchParams();
    if (typeof params === 'number') {
      query.set('limit', params.toString());
    } else if (params) {
      if (params.limit) query.set('limit', params.limit.toString());
      if (params.state && params.state !== 'all') query.set('state', params.state);
      if (params.search) query.set('search', params.search);
      if (params.message_id) query.set('message_id', params.message_id);
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${BASE_URL}/events/packet-stream${queryString}`);
    return handleResponse(res);
  },

  async getAuditLogs(params?: {
    limit?: number;
    offset?: number;
    event_type?: string;
    decision?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    total: number;
    limit: number;
    offset: number;
    logs: any[];
  }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.event_type) query.set('event_type', params.event_type);
    if (params?.decision) query.set('decision', params.decision);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${BASE_URL}/events?${query.toString()}`);
    return handleResponse(res);
  },

  // Dashboard Metrics
  async getDashboardStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    return handleResponse(res);
  },

  // Lab Report
  async getLabReport(regenerate?: boolean): Promise<{ success: boolean; report: any }> {
    const res = await fetch(`${BASE_URL}/reports/lab-report${regenerate ? '?regenerate=true' : ''}`, {
      method: regenerate ? 'POST' : 'GET',
    });
    return handleResponse(res);
  },

  getExportEventsUrl(): string {
    return `${BASE_URL}/events/export`;
  },

  getExportScenariosUrl(): string {
    return `${BASE_URL}/reports/scenarios/export`;
  },
};
