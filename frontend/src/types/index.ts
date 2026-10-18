// TypeScript type definitions for Secure Industrial Control System Communication Simulator

export type DeviceType =
  | 'Sensor'
  | 'PLC'
  | 'SCADA Server'
  | 'Operator Workstation'
  | 'Industrial Gateway'
  | 'Ethernet Switch'
  | 'Router'
  | 'Monitoring Server'
  | 'Untrusted Device';

export type DeviceRole =
  | 'Sensor'
  | 'Controller'
  | 'SCADA'
  | 'Operator'
  | 'Gateway'
  | 'Switch'
  | 'Router'
  | 'Monitor'
  | 'Untrusted';

export type TrustStatus = 'Trusted' | 'Untrusted' | 'Quarantined';

export type PurdueLevel = 'Level 0' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 3.5' | 'Untrusted';

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  ip_address: string;
  mac_address: string;
  role: DeviceRole;
  trust_status: TrustStatus;
  purdue_level: PurdueLevel;
  is_enabled: boolean;
  allowed_actions: string[];
  public_key_pem?: string;
  position_x: number;
  position_y: number;
}

export interface Connection {
  id: string;
  source_id: string;
  target_id: string;
  source_port: string;
  target_port: string;
  connection_type: string;
  is_active: boolean;
  latency_ms: number;
}

export interface TopologyData {
  id?: string;
  name?: string;
  description?: string;
  devices: Device[];
  connections: Connection[];
}

export type MessageType =
  | 'Sensor Reading'
  | 'Device Status'
  | 'Controller Command'
  | 'Alarm Notification';

export type SecurityProfile =
  | 'Security Disabled'
  | 'Integrity Verified'
  | 'Authenticated Secure Communication';

export type PacketState =
  | 'Created'
  | 'Queued'
  | 'In transit'
  | 'Delivered'
  | 'Rejected'
  | 'Failed';

export interface SimulationEvent {
  id: string;
  session_id: string;
  message_id: string;
  event_time: string;
  source_id: string;
  destination_id: string;
  current_hop: string;
  message_type: MessageType;
  packet_state: PacketState;
  security_status: string;
  details: Record<string, any>;
  explanation: string;
}

export interface MessagePayload {
  message_id: string;
  session_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: MessageType;
  payload: string;
  security_profile: SecurityProfile;
  tamper_message?: boolean;
  tamper_signature?: boolean;
  tamper_tag?: boolean;
  replay_attack?: boolean;
}

export interface SimulationSession {
  id: string;
  session_name: string;
  created_at: string;
  status: string;
  source_device: string;
  destination_device: string;
  security_profile: SecurityProfile;
  total_events: number;
  delivered: boolean;
}

export interface SecurityScenarioResult {
  scenario_id: string;
  name: string;
  objective: string;
  expected_outcome: string;
  actual_outcome: string;
  pass_status: boolean;
  reason: string;
  checks_executed: string[];
  session_id?: string;
  message_id?: string;
  events?: SimulationEvent[];
  security_record?: Record<string, any>;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  session_id: string;
  event_type: string;
  source_id: string;
  destination_id: string;
  security_result: string;
  status: 'ACCEPTED' | 'REJECTED' | 'FAILED';
  rejection_reason?: string;
  details?: Record<string, any>;
}

export interface DashboardStats {
  total_devices: number;
  total_sessions: number;
  messages_delivered: number;
  messages_rejected: number;
  pass_rate: number;
  security_events: AuditLog[];
  devices_summary?: {
    trusted: number;
    untrusted: number;
    quarantined: number;
    online: number;
    offline: number;
  };
}

export interface LabReport {
  title: string;
  generated_at: string;
  simulation_session?: SimulationSession;
  topology_summary: {
    total_devices: number;
    total_connections: number;
    devices: { id: string; name: string; type: string; ip: string; role: string }[];
  };
  scenarios: SecurityScenarioResult[];
  security_summary: {
    total_tests: number;
    passed: number;
    failed: number;
    pass_rate: number;
  };
  conclusion: string;
}
