"""Industrial Role-Based Access Control (RBAC) and Device Admission Engine."""
import json
from typing import Dict, Any, Tuple

# Risk classification for industrial message types
MESSAGE_RISK_LEVELS = {
    "Sensor Reading": {"risk": "LOW", "description": "Passive sensor polling (Temperature, Pressure, RPM)"},
    "Device Status": {"risk": "LOW", "description": "Heartbeat and operational status report"},
    "Alarm Notification": {"risk": "MEDIUM", "description": "Threshold or safety violation alarm"},
    "Controller Command": {"risk": "HIGH", "description": "Operational setpoint alteration or actuator override"}
}

# Standard RBAC role permissions
ROLE_PERMISSIONS = {
    "sensor": ["Sensor Reading"],
    "plc": ["Sensor Reading", "Device Status", "Controller Command", "Alarm Notification"],
    "scada": ["Sensor Reading", "Device Status", "Controller Command", "Alarm Notification"],
    "operator": ["Device Status", "Controller Command", "Alarm Notification"],
    "monitor": ["Device Status", "Alarm Notification"],
    "gateway": ["Sensor Reading", "Device Status", "Controller Command", "Alarm Notification"],
    "switch": [],
    "router": [],
    "untrusted": []
}

def evaluate_device_access(
    sender: Dict[str, Any],
    receiver: Dict[str, Any],
    message_type: str
) -> Tuple[bool, str, Dict[str, Any]]:
    """Evaluates whether the sender is authorized to transmit message_type to receiver.
    
    Returns (is_allowed, reason, details)
    """
    sender_id = sender.get("id", "UNKNOWN")
    receiver_id = receiver.get("id", "UNKNOWN")
    sender_trust = sender.get("trust_status", "Untrusted")
    sender_enabled = bool(sender.get("enabled", 1))
    receiver_enabled = bool(receiver.get("enabled", 1))
    sender_role = sender.get("role", "untrusted")
    
    risk_info = MESSAGE_RISK_LEVELS.get(message_type, {"risk": "HIGH", "description": "Custom action"})

    # 1. Device Lifecycle & Trust Verification
    if not sender_enabled:
        return False, f"DEVICE_DISABLED: Sender '{sender_id}' is administratively disabled.", {
            "policy": "Device Administrative State",
            "device_id": sender_id,
            "error_code": "SRC_DISABLED"
        }

    if not receiver_enabled:
        return False, f"DESTINATION_DISABLED: Target device '{receiver_id}' is offline or administratively disabled.", {
            "policy": "Destination Availability",
            "device_id": receiver_id,
            "error_code": "DST_DISABLED"
        }

    if sender_trust == "Untrusted":
        return False, f"UNAUTHORIZED_DEVICE: Device '{sender_id}' is unauthenticated in the OT registry (Trust Status: Untrusted).", {
            "policy": "Device Admission Control (IEEE 802.1AR / 802.1X)",
            "device_id": sender_id,
            "trust_status": sender_trust,
            "error_code": "UNAUTHORIZED_SENDER"
        }

    if sender_trust == "Quarantined":
        return False, f"DEVICE_QUARANTINED: Device '{sender_id}' is quarantined due to suspected compromise.", {
            "policy": "Security Quarantine & Isolation",
            "device_id": sender_id,
            "trust_status": sender_trust,
            "error_code": "QUARANTINED_SENDER"
        }

    # 2. Allowed Actions Check (Role Permissions)
    allowed_actions = sender.get("allowed_actions", [])
    if isinstance(allowed_actions, str):
        try:
            allowed_actions = json.loads(allowed_actions)
        except Exception:
            allowed_actions = []

    # Fallback to role-based defaults if not explicitly populated
    if not allowed_actions and sender_role in ROLE_PERMISSIONS:
        allowed_actions = ROLE_PERMISSIONS[sender_role]

    if message_type not in allowed_actions:
        return False, f"ROLE_PERMISSION_DENIED: Sender '{sender_id}' with role '{sender_role}' is not authorized to dispatch '{message_type}' ({risk_info['risk']} risk).", {
            "policy": "Principle of Least Privilege (PoLP)",
            "sender_id": sender_id,
            "sender_role": sender_role,
            "message_type": message_type,
            "action_risk": risk_info["risk"],
            "allowed_actions": allowed_actions,
            "error_code": "RBAC_VIOLATION"
        }

    # 3. Access Approved
    return True, f"ACCESS_GRANTED: Device '{sender_id}' authorized to dispatch '{message_type}'.", {
        "policy": "RBAC Verification Passed",
        "sender_id": sender_id,
        "sender_role": sender_role,
        "receiver_id": receiver_id,
        "message_type": message_type,
        "risk_level": risk_info["risk"]
    }
