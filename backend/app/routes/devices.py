"""Virtual Device Management API Routes."""
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..database.db import query_db, execute_db, generate_device_keys

devices_bp = Blueprint("devices", __name__, url_prefix="/api/devices")

@devices_bp.route("", methods=["GET"])
def get_all_devices():
    """Lists all registered virtual industrial devices."""
    devices = query_db("SELECT id, name, type, ip_address, mac_address, role, trust_status, enabled, allowed_actions, public_key_pem, x_pos, y_pos, created_at, updated_at FROM devices ORDER BY id ASC")
    for d in devices:
        if isinstance(d.get("allowed_actions"), str):
            try:
                d["allowed_actions"] = json.loads(d["allowed_actions"])
            except Exception:
                d["allowed_actions"] = []
    return jsonify({"success": True, "devices": devices, "total": len(devices)})

@devices_bp.route("/<device_id>", methods=["GET"])
def get_device(device_id):
    """Retrieves a single virtual device."""
    device = query_db(
        "SELECT id, name, type, ip_address, mac_address, role, trust_status, enabled, allowed_actions, public_key_pem, x_pos, y_pos, created_at, updated_at FROM devices WHERE id = ?",
        (device_id,),
        one=True
    )
    if not device:
        return jsonify({"success": False, "error": f"Device '{device_id}' not found."}), 404

    if isinstance(device.get("allowed_actions"), str):
        try:
            device["allowed_actions"] = json.loads(device["allowed_actions"])
        except Exception:
            device["allowed_actions"] = []

    return jsonify({"success": True, "device": device})

@devices_bp.route("", methods=["POST"])
def register_device():
    """Enrolls a new virtual device into the industrial simulator."""
    data = request.get_json() or {}
    dev_id = data.get("id", "").strip()
    if not dev_id:
        return jsonify({"success": False, "error": "Device ID is required."}), 400

    existing = query_db("SELECT id FROM devices WHERE id = ?", (dev_id,), one=True)
    if existing:
        return jsonify({"success": False, "error": f"Device '{dev_id}' already exists."}), 409

    name = data.get("name") or dev_id
    dev_type = data.get("type", "Sensor")
    ip_address = data.get("ip_address", "192.168.1.150")
    mac_address = data.get("mac_address", f"00:1A:2B:3C:4D:{int(datetime.now().timestamp()) % 100:02d}")
    role = data.get("role", "sensor")
    trust_status = data.get("trust_status", "Trusted")
    enabled = 1 if data.get("enabled", True) else 0
    allowed_actions = data.get("allowed_actions", ["Sensor Reading"])
    x_pos = float(data.get("x_pos", 200))
    y_pos = float(data.get("y_pos", 200))

    now = datetime.now(timezone.utc).isoformat()
    pub_pem, priv_pem, aes_key_hex = generate_device_keys(dev_id)

    execute_db(
        """INSERT INTO devices 
           (id, name, type, ip_address, mac_address, role, trust_status, enabled, allowed_actions, public_key_pem, private_key_pem, aes_key_hex, x_pos, y_pos, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            dev_id, name, dev_type, ip_address, mac_address, role, trust_status, enabled,
            json.dumps(allowed_actions), pub_pem, priv_pem, aes_key_hex, x_pos, y_pos, now, now
        )
    )

    # Audit log
    execute_db(
        """INSERT INTO audit_logs (timestamp, source_device, event_type, security_result, decision, details_json)
           VALUES (?, ?, 'DEVICE_ENROLLED', 'SUCCESS', 'INFO', ?)""",
        (now, dev_id, json.dumps({"name": name, "type": dev_type, "role": role, "trust_status": trust_status}))
    )

    return jsonify({"success": True, "message": f"Device '{dev_id}' registered successfully."}), 201

@devices_bp.route("/<device_id>", methods=["PUT"])
def update_device(device_id):
    """Updates device network and access configuration."""
    existing = query_db("SELECT * FROM devices WHERE id = ?", (device_id,), one=True)
    if not existing:
        return jsonify({"success": False, "error": f"Device '{device_id}' not found."}), 404

    data = request.get_json() or {}
    name = data.get("name", existing["name"])
    dev_type = data.get("type", existing["type"])
    ip_address = data.get("ip_address", existing["ip_address"])
    mac_address = data.get("mac_address", existing["mac_address"])
    role = data.get("role", existing["role"])
    trust_status = data.get("trust_status", existing["trust_status"])
    enabled = 1 if data.get("enabled", bool(existing["enabled"])) else 0
    
    if "allowed_actions" in data:
        allowed_actions = json.dumps(data["allowed_actions"])
    else:
        allowed_actions = existing["allowed_actions"]

    x_pos = float(data.get("x_pos", existing["x_pos"]))
    y_pos = float(data.get("y_pos", existing["y_pos"]))
    now = datetime.now(timezone.utc).isoformat()

    execute_db(
        """UPDATE devices 
           SET name = ?, type = ?, ip_address = ?, mac_address = ?, role = ?, trust_status = ?, enabled = ?, allowed_actions = ?, x_pos = ?, y_pos = ?, updated_at = ?
           WHERE id = ?""",
        (name, dev_type, ip_address, mac_address, role, trust_status, enabled, allowed_actions, x_pos, y_pos, now, device_id)
    )

    return jsonify({"success": True, "message": f"Device '{device_id}' updated successfully."})

@devices_bp.route("/<device_id>", methods=["DELETE"])
def delete_device(device_id):
    """Decommissions a virtual device from the simulator."""
    existing = query_db("SELECT id FROM devices WHERE id = ?", (device_id,), one=True)
    if not existing:
        return jsonify({"success": False, "error": f"Device '{device_id}' not found."}), 404

    execute_db("DELETE FROM connections WHERE source_id = ? OR target_id = ?", (device_id, device_id))
    execute_db("DELETE FROM devices WHERE id = ?", (device_id,))
    
    now = datetime.now(timezone.utc).isoformat()
    execute_db(
        """INSERT INTO audit_logs (timestamp, source_device, event_type, security_result, decision, details_json)
           VALUES (?, ?, 'DEVICE_DECOMMISSIONED', 'SUCCESS', 'INFO', ?)""",
        (now, device_id, json.dumps({"deleted_device": device_id}))
    )

    return jsonify({"success": True, "message": f"Device '{device_id}' removed from active registry."})
