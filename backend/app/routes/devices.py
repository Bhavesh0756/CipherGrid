"""Device Management API Routes."""
from flask import Blueprint, request, jsonify
from ..services.device_service import (
    list_devices, get_device, create_device, update_device, delete_device, simulate_message
)
from ..security.rbac import ACTION_RISK_LEVELS, get_ieee_802_1x_conceptual_workflow
from ..database.db import query_db

devices_bp = Blueprint("devices", __name__, url_prefix="/api/devices")

@devices_bp.route("", methods=["GET"])
def get_all_devices():
    devices = list_devices()
    return jsonify({"success": True, "devices": devices, "total": len(devices)})

@devices_bp.route("/<device_id>", methods=["GET"])
def get_single_device(device_id):
    device = get_device(device_id)
    if not device:
        return jsonify({"success": False, "error": f"Device '{device_id}' not found."}), 404
    return jsonify({"success": True, "device": device})

@devices_bp.route("", methods=["POST"])
def register_new_device():
    data = request.get_json() or {}
    try:
        new_dev = create_device(data)
        return jsonify({"success": True, "device": new_dev, "message": "Device registered successfully."}), 201
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

@devices_bp.route("/<device_id>", methods=["PUT"])
def update_existing_device(device_id):
    data = request.get_json() or {}
    try:
        updated = update_device(device_id, data)
        return jsonify({"success": True, "device": updated, "message": "Device updated successfully."})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@devices_bp.route("/<device_id>", methods=["DELETE"])
def remove_device(device_id):
    try:
        delete_device(device_id)
        return jsonify({"success": True, "message": f"Device '{device_id}' deleted successfully."})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@devices_bp.route("/<device_id>/simulate", methods=["POST"])
def simulate_device_traffic(device_id):
    data = request.get_json() or {}
    action = data.get("action", "read_telemetry")
    payload = data.get("payload", {
        "temperature_c": 74.2,
        "pressure_psi": 412.5,
        "turbine_rpm": 3600,
        "status": "NOMINAL"
    })

    result = simulate_message(device_id, action, payload)
    status_code = 200 if result["status"] == "ACCEPTED" else 403
    return jsonify(result), status_code

@devices_bp.route("/meta/roles", methods=["GET"])
def get_roles_and_actions():
    roles = query_db("SELECT * FROM roles")
    return jsonify({
        "success": True,
        "roles": roles,
        "action_risk_levels": ACTION_RISK_LEVELS,
        "ieee_802_1x_workflow": get_ieee_802_1x_conceptual_workflow()
    })
