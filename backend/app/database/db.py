import sqlite3
import os
import json
import secrets
from datetime import datetime, timezone
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(DB_DIR, "secure_ics_sim.db")

# In-memory storage for private keys (NEVER exposed to frontend, kept for signing verification)
_DEVICE_PRIVATE_KEYS = {}

def get_db_path():
    return os.environ.get("DATABASE_PATH", DEFAULT_DB_PATH)

def get_connection():
    db_path = get_db_path()
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def query_db(query, args=(), one=False):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, args)
    rows = cursor.fetchall()
    conn.close()
    if one:
        return dict(rows[0]) if rows else None
    return [dict(r) for r in rows]

def execute_db(query, args=(), commit=True):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, args)
    last_id = cursor.lastrowid
    row_count = cursor.rowcount
    if commit:
        conn.commit()
    conn.close()
    return last_id, row_count

def generate_device_keys(device_id: str):
    """Generates an RSA-2048 keypair and an AES-256 symmetric key for a virtual device."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    
    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_key = private_key.public_key()
    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    aes_key_hex = secrets.token_hex(32) # 256-bit AES key
    return pub_pem, priv_pem, aes_key_hex

def get_device_private_key(device_id: str):
    """Loads RSA private key from database for signing operations."""
    row = query_db("SELECT private_key_pem FROM devices WHERE id = ?", (device_id,), one=True)
    if row and row.get("private_key_pem"):
        return serialization.load_pem_private_key(row["private_key_pem"].encode('utf-8'), password=None)
    
    # If missing, generate and persist
    pub_pem, priv_pem, aes_key_hex = generate_device_keys(device_id)
    execute_db("UPDATE devices SET public_key_pem = ?, private_key_pem = ? WHERE id = ?", (pub_pem, priv_pem, device_id))
    return serialization.load_pem_private_key(priv_pem.encode('utf-8'), password=None)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    schema_path = os.path.join(DB_DIR, "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        cursor.executescript(f.read())
    conn.commit()
    conn.close()
    seed_default_topology()

def seed_default_topology():
    """Seeds the default starter topology if no devices exist."""
    devices_count = query_db("SELECT COUNT(*) as cnt FROM devices", one=True)
    if devices_count and devices_count["cnt"] > 0:
        return

    now = datetime.now(timezone.utc).isoformat()
    
    sample_devices = [
        {
            "id": "Sensor-01",
            "name": "Temperature Sensor 01",
            "type": "Sensor",
            "ip_address": "192.168.1.101",
            "mac_address": "00:1A:2B:3C:4D:01",
            "role": "sensor",
            "trust_status": "Trusted",
            "allowed_actions": ["Sensor Reading"],
            "x_pos": 80,
            "y_pos": 200
        },
        {
            "id": "PLC-01",
            "name": "Turbine Loop Controller PLC",
            "type": "PLC",
            "ip_address": "192.168.1.10",
            "mac_address": "00:1A:2B:3C:4D:10",
            "role": "plc",
            "trust_status": "Trusted",
            "allowed_actions": ["Sensor Reading", "Device Status", "Controller Command", "Alarm Notification"],
            "x_pos": 80,
            "y_pos": 50
        },
        {
            "id": "Industrial-Switch",
            "name": "Core OT Ethernet Switch",
            "type": "Ethernet Switch",
            "ip_address": "192.168.1.2",
            "mac_address": "00:1A:2B:3C:4D:02",
            "role": "switch",
            "trust_status": "Trusted",
            "allowed_actions": [],
            "x_pos": 400,
            "y_pos": 200
        },
        {
            "id": "SCADA-Server",
            "name": "Supervisory SCADA Server",
            "type": "SCADA Server",
            "ip_address": "192.168.1.5",
            "mac_address": "00:1A:2B:3C:4D:05",
            "role": "scada",
            "trust_status": "Trusted",
            "allowed_actions": ["Sensor Reading", "Device Status", "Controller Command", "Alarm Notification"],
            "x_pos": 720,
            "y_pos": 50
        },
        {
            "id": "Operator-01",
            "name": "Engineering Workstation 01",
            "type": "Operator Workstation",
            "ip_address": "192.168.1.50",
            "mac_address": "00:1A:2B:3C:4D:50",
            "role": "operator",
            "trust_status": "Trusted",
            "allowed_actions": ["Device Status", "Controller Command", "Alarm Notification"],
            "x_pos": 720,
            "y_pos": 200
        },
        {
            "id": "Monitoring-Server",
            "name": "OT Network Security Monitor",
            "type": "Monitoring Server",
            "ip_address": "192.168.1.80",
            "mac_address": "00:1A:2B:3C:4D:80",
            "role": "monitor",
            "trust_status": "Trusted",
            "allowed_actions": ["Device Status", "Alarm Notification"],
            "x_pos": 400,
            "y_pos": 350
        },
        {
            "id": "Untrusted-01",
            "name": "Unregistered Rogue Tap",
            "type": "Untrusted Device",
            "ip_address": "192.168.1.199",
            "mac_address": "DE:AD:BE:EF:00:99",
            "role": "untrusted",
            "trust_status": "Untrusted",
            "allowed_actions": [],
            "x_pos": 80,
            "y_pos": 350
        }
    ]

    for dev in sample_devices:
        pub_pem, priv_pem, aes_key_hex = generate_device_keys(dev["id"])
        execute_db(
            """INSERT INTO devices 
               (id, name, type, ip_address, mac_address, role, trust_status, enabled, allowed_actions, public_key_pem, private_key_pem, aes_key_hex, x_pos, y_pos, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                dev["id"], dev["name"], dev["type"], dev["ip_address"], dev["mac_address"],
                dev["role"], dev["trust_status"], 1, json.dumps(dev["allowed_actions"]),
                pub_pem, priv_pem, aes_key_hex, dev["x_pos"], dev["y_pos"], now, now
            )
        )

    # Preload Default Topology
    topology_id = "starter-topology-01"
    
    # Define connections
    starter_connections = [
        {"id": "conn-1", "source_id": "Sensor-01", "target_id": "PLC-01", "source_port": "eth0", "target_port": "eth0", "latency_ms": 1.5},
        {"id": "conn-2", "source_id": "PLC-01", "target_id": "Industrial-Switch", "source_port": "eth1", "target_port": "port1", "latency_ms": 2.0},
        {"id": "conn-3", "source_id": "Industrial-Switch", "target_id": "SCADA-Server", "source_port": "port2", "target_port": "eth0", "latency_ms": 2.5},
        {"id": "conn-4", "source_id": "Operator-01", "target_id": "Industrial-Switch", "source_port": "eth0", "target_port": "port3", "latency_ms": 2.0},
        {"id": "conn-5", "source_id": "Monitoring-Server", "target_id": "Industrial-Switch", "source_port": "eth0", "target_port": "port4", "latency_ms": 2.0},
        {"id": "conn-6", "source_id": "Untrusted-01", "target_id": "PLC-01", "source_port": "tap0", "target_port": "eth2", "latency_ms": 5.0}
    ]

    # Convert to React Flow format
    rf_nodes = []
    for dev in sample_devices:
        rf_nodes.append({
            "id": dev["id"],
            "type": "customDevice",
            "position": {"x": dev["x_pos"], "y": dev["y_pos"]},
            "data": {
                "id": dev["id"],
                "name": dev["name"],
                "type": dev["type"],
                "ip_address": dev["ip_address"],
                "role": dev["role"],
                "trust_status": dev["trust_status"],
                "enabled": True
            }
        })

    rf_edges = []
    for conn in starter_connections:
        rf_edges.append({
            "id": conn["id"],
            "source": conn["source_id"],
            "target": conn["target_id"],
            "sourceHandle": "right",
            "targetHandle": "left",
            "type": "smoothstep",
            "animated": False,
            "data": {
                "latency_ms": conn["latency_ms"],
                "link_type": "Ethernet",
                "status": "Active"
            }
        })

    topology_payload = {
        "nodes": rf_nodes,
        "edges": rf_edges
    }

    execute_db(
        """INSERT INTO topologies (id, name, description, data_json, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            topology_id,
            "Standard Industrial Plant Topology",
            "Starter topology with field sensor, PLC controller, industrial switch, SCADA server, and engineering workstation.",
            json.dumps(topology_payload),
            1,
            now,
            now
        )
    )

    for conn in starter_connections:
        execute_db(
            """INSERT INTO connections (id, topology_id, source_id, target_id, source_port, target_port, link_type, status, latency_ms)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                conn["id"], topology_id, conn["source_id"], conn["target_id"],
                conn["source_port"], conn["target_port"], "Ethernet", "Active", conn["latency_ms"]
            )
        )

    # Initial audit log
    execute_db(
        """INSERT INTO audit_logs (timestamp, session_id, message_id, source_device, destination_device, event_type, security_result, decision, details_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            now, "SYSTEM_INIT", None, "SYSTEM", "SYSTEM",
            "DATABASE_INITIALIZED", "SUCCESS", "INFO",
            json.dumps({"seeded_devices": len(sample_devices), "seeded_connections": len(starter_connections)})
        )
    )
