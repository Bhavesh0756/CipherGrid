-- Database Schema for Industrial SecureSim

CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    role TEXT NOT NULL,
    allowed_actions TEXT NOT NULL,
    ip_address TEXT DEFAULT '192.168.1.10',
    last_seen TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    default_permissions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    device_id TEXT,
    action TEXT,
    result TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT
);

CREATE TABLE IF NOT EXISTS simulation_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    device_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT NOT NULL,
    security_checks TEXT
);
