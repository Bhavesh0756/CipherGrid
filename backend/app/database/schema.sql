-- Secure Industrial Control System Communication Simulator Database Schema

CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    mac_address TEXT NOT NULL,
    role TEXT NOT NULL,
    trust_status TEXT NOT NULL DEFAULT 'Trusted',
    enabled INTEGER NOT NULL DEFAULT 1,
    allowed_actions TEXT NOT NULL DEFAULT '[]',
    public_key_pem TEXT,
    private_key_pem TEXT,
    aes_key_hex TEXT,
    x_pos REAL DEFAULT 0,
    y_pos REAL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topologies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    data_json TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    source_port TEXT DEFAULT 'eth0',
    target_port TEXT DEFAULT 'eth0',
    link_type TEXT DEFAULT 'Ethernet',
    status TEXT DEFAULT 'Active',
    latency_ms REAL DEFAULT 2.0,
    packet_loss_pct REAL DEFAULT 0.0,
    FOREIGN KEY (topology_id) REFERENCES topologies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS simulation_sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    topology_id TEXT,
    status TEXT NOT NULL DEFAULT 'idle',
    speed REAL DEFAULT 1.0,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    raw_payload TEXT NOT NULL,
    security_profile TEXT NOT NULL,
    scenario_id TEXT DEFAULT 'normal',
    sequence_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Created',
    rejection_reason TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS simulation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    source_device TEXT NOT NULL,
    destination_device TEXT NOT NULL,
    current_hop TEXT NOT NULL,
    next_hop TEXT,
    protocol TEXT NOT NULL,
    packet_state TEXT NOT NULL,
    security_status TEXT NOT NULL,
    explanation TEXT NOT NULL,
    wire_details_json TEXT,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS security_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    scenario_id TEXT NOT NULL,
    scenario_name TEXT NOT NULL,
    test_objective TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result TEXT NOT NULL,
    pass_fail TEXT NOT NULL,
    checks_executed TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    session_id TEXT,
    message_id TEXT,
    source_device TEXT,
    destination_device TEXT,
    event_type TEXT NOT NULL,
    security_result TEXT NOT NULL,
    decision TEXT NOT NULL,
    rejection_reason TEXT,
    details_json TEXT
);
