import sqlite3
import os
import json
from datetime import datetime, timezone

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(DB_DIR, "securesim.db")

def get_db_path():
    return os.environ.get("DATABASE_PATH", DEFAULT_DB_PATH)

def get_connection():
    db_path = get_db_path()
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    schema_path = os.path.join(DB_DIR, "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        cursor.executescript(f.read())
    conn.commit()

    # Seed roles if not present
    cursor.execute("SELECT COUNT(*) FROM roles")
    if cursor.fetchone()[0] == 0:
        seed_roles = [
            ("telemetry_node", "Field Sensor node capable only of reporting state and readings", json.dumps(["read_telemetry", "report_status"])),
            ("operator", "Control room operator capable of reading and adjusting basic setpoints", json.dumps(["read_telemetry", "report_status", "set_setpoint", "acknowledge_alarm"])),
            ("maintenance_supervisor", "Authorized engineer for calibration, diagnostic maintenance, and reboot", json.dumps(["read_telemetry", "report_status", "calibrate_sensor", "reboot_plc", "config_update"])),
            ("untrusted_sensor", "Unverified or rogue field transmitter strictly quarantined to telemetry read only", json.dumps(["read_telemetry"])),
            ("admin_controller", "Safety and operational admin with full actuation and emergency override capabilities", json.dumps(["read_telemetry", "report_status", "set_setpoint", "acknowledge_alarm", "calibrate_sensor", "reboot_plc", "config_update", "emergency_trip", "flash_firmware"]))
        ]
        cursor.executemany("INSERT INTO roles (name, description, default_permissions) VALUES (?, ?, ?)", seed_roles)
        conn.commit()

    # Seed sample devices if not present
    cursor.execute("SELECT COUNT(*) FROM devices")
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        sample_devices = [
            ("PLC-TURBINE-01", "Main Gas Turbine PLC", "PLC", "Authorized", "operator", json.dumps(["read_telemetry", "report_status", "set_setpoint", "acknowledge_alarm"]), "192.168.1.101", now, now),
            ("RTU-SUBSTATION-4", "Grid Intertie RTU", "RTU", "Authorized", "maintenance_supervisor", json.dumps(["read_telemetry", "report_status", "calibrate_sensor", "reboot_plc"]), "192.168.1.104", now, now),
            ("SENSOR-PRESSURE-99", "Boiler Steam Pressure Node", "Smart Sensor", "Authorized", "telemetry_node", json.dumps(["read_telemetry", "report_status"]), "192.168.1.109", now, now),
            ("ACTUATOR-VALVE-02", "Cooling Loop Bypass Actuator", "Actuator Controller", "Authorized", "operator", json.dumps(["read_telemetry", "report_status", "set_setpoint"]), "192.168.1.112", now, now),
            ("ROUGE-SENSOR-X", "Unregistered Field Probe", "Smart Sensor", "Unauthorized", "untrusted_sensor", json.dumps(["read_telemetry"]), "192.168.1.199", None, now),
            ("LEGACY-HMI-07", "Decommissioned HMI Console", "HMI Gateway", "Revoked", "operator", json.dumps([]), "192.168.1.150", None, now)
        ]
        cursor.executemany(
            "INSERT INTO devices (id, name, type, status, role, allowed_actions, ip_address, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            sample_devices
        )
        # Log initial event
        cursor.execute(
            "INSERT INTO security_events (timestamp, event_type, severity, device_id, action, result, message, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (now, "SYSTEM_INITIALIZED", "INFO", "SYSTEM", "INIT", "SUCCESS", "Industrial SecureSim database and security subsystem initialized.", json.dumps({"seeded_devices": 6, "seeded_roles": 5}))
        )
        conn.commit()

    conn.close()

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
