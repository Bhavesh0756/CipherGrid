"""Access Control & RBAC Module (Module 3 - Network Security).

Implements Role-Based Access Control (RBAC) rules and conceptual IEEE 802.1X/EAP
port-based authentication modeling for virtual industrial control systems.
"""
import json
from typing import Tuple, Dict, Any

# Criticality ratings for industrial actions
ACTION_RISK_LEVELS = {
    "read_telemetry": {"risk": "LOW", "description": "Passive sensor polling (Temperature, Pressure, RPM)"},
    "report_status": {"risk": "LOW", "description": "Heartbeat and device operational telemetry"},
    "acknowledge_alarm": {"risk": "MEDIUM", "description": "Silencing or acknowledging an active industrial alarm"},
    "set_setpoint": {"risk": "HIGH", "description": "Altering operational parameters (e.g. pressure valve cutoff)"},
    "calibrate_sensor": {"risk": "HIGH", "description": "Modifying sensor zero-offset or scaling factors"},
    "reboot_plc": {"risk": "CRITICAL", "description": "Restarting programmable logic controller unit"},
    "config_update": {"risk": "CRITICAL", "description": "Overwriting industrial control logic configuration"},
    "emergency_trip": {"risk": "CRITICAL", "description": "Emergency breaker trip or reactor shutdown sequence"},
    "flash_firmware": {"risk": "CRITICAL", "description": "Flashing low-level embedded microcontroller firmware"}
}

def evaluate_access(device: Dict[str, Any], requested_action: str) -> Tuple[bool, str, Dict[str, Any]]:
    """Evaluates whether a device is authorized to perform the requested action.
    
    Returns: (is_allowed, reason, details)
    """
    device_id = device.get("id", "UNKNOWN")
    status = device.get("status", "Unauthorized")
    role = device.get("role", "untrusted_sensor")
    
    # 1. Device Lifecycle / Authorization Status Check
    if status == "Unauthorized":
        return False, f"DEVICE_UNAUTHORIZED: Device '{device_id}' is not authenticated in the SCADA device registry.", {
            "policy": "Device Admission Control",
            "device_status": status,
            "action": requested_action,
            "violation": "Unenrolled or rogue device attempted industrial bus operation."
        }
    
    if status == "Suspended":
        return False, f"DEVICE_SUSPENDED: Device '{device_id}' has been temporarily isolated for security review or active anomaly mitigation.", {
            "policy": "Quarantine / Suspension",
            "device_status": status,
            "action": requested_action,
            "violation": "Communication prohibited while device is in quarantined state."
        }

    if status == "Revoked":
        return False, f"CREDENTIAL_REVOKED: Device '{device_id}' credentials have been permanently revoked (e.g., suspected private key compromise or hardware decommissioning).", {
            "policy": "Revocation List (CRL/OCSP)",
            "device_status": status,
            "action": requested_action,
            "violation": "Cryptographic credentials invalid and blocked by SCADA controller."
        }

    if status != "Authorized":
        return False, f"STATUS_INVALID: Unknown device authorization state '{status}'.", {
            "device_status": status,
            "action": requested_action
        }

    # 2. Allowed Actions Check (Device-Specific or Role-Based)
    allowed_actions = device.get("allowed_actions", [])
    if isinstance(allowed_actions, str):
        try:
            allowed_actions = json.loads(allowed_actions)
        except Exception:
            allowed_actions = []

    if requested_action not in allowed_actions:
        risk_info = ACTION_RISK_LEVELS.get(requested_action, {"risk": "HIGH", "description": "Custom action"})
        return False, f"ROLE_PERMISSION_DENIED: Device '{device_id}' with role '{role}' is forbidden from executing '{requested_action}' ({risk_info['risk']} risk).", {
            "policy": "Principle of Least Privilege (PoLP)",
            "device_role": role,
            "requested_action": requested_action,
            "action_risk": risk_info["risk"],
            "allowed_actions": allowed_actions,
            "violation": f"Privilege escalation attempt: role '{role}' lacks '{requested_action}' permission."
        }

    # 3. Access Approved
    risk_info = ACTION_RISK_LEVELS.get(requested_action, {"risk": "LOW", "description": "Standard action"})
    return True, f"ACCESS_GRANTED: Device '{device_id}' successfully authorized for '{requested_action}'.", {
        "device_id": device_id,
        "device_role": role,
        "action": requested_action,
        "risk_level": risk_info["risk"],
        "policy": "RBAC Verification Passed"
    }

def get_ieee_802_1x_conceptual_workflow() -> dict:
    """Returns the conceptual IEEE 802.1X / EAP-TLS port-based authentication model."""
    return {
        "title": "IEEE 802.1X / EAP Network Access Control Simulation",
        "module": "Module 3 - Port-Based Network Access Control",
        "is_conceptual_simulation": True,
        "disclaimer": "This is a conceptual educational simulation. Physical IEEE 802.1X requires hardware port authorization (PAE), a managed switch/AP, and a dedicated RADIUS/EAP-TLS server.",
        "entities": [
            {
                "name": "Supplicant",
                "role": "Virtual Industrial Device (PLC / RTU / Smart Sensor)",
                "function": "Requests network bus access; holds device X.509 certificate and private key."
            },
            {
                "name": "Authenticator",
                "role": "ICS Managed Switch / Security Gateway (e.g., Hirschmann or Cisco IE)",
                "function": "Enforces port access state (Unauthorized vs Authorized). Relays EAP frames encapsulated in RADIUS packets."
            },
            {
                "name": "Authentication Server",
                "role": "Central RADIUS / EAP-TLS Server (e.g., FreeRADIUS)",
                "function": "Validates device certificate chain, revokes unauthorized devices, and returns RADIUS Access-Accept/Reject."
            }
        ],
        "steps": [
            {
                "step": 1,
                "name": "EAPOL-Start",
                "from": "Supplicant",
                "to": "Authenticator",
                "description": "Virtual device powers on and transmits an EAPOL (EAP over LAN) Start frame."
            },
            {
                "step": 2,
                "name": "EAP-Request / Identity",
                "from": "Authenticator",
                "to": "Supplicant",
                "description": "Switch responds with an Identity Request to identify the connected node."
            },
            {
                "step": 3,
                "name": "EAP-Response / Identity",
                "from": "Supplicant",
                "to": "Authenticator",
                "description": "Device responds with its identity (e.g., PLC-TURBINE-01@plant.local)."
            },
            {
                "step": 4,
                "name": "RADIUS Access-Request",
                "from": "Authenticator",
                "to": "Authentication Server",
                "description": "Switch encapsulates EAP response into a RADIUS packet sent to central auth server."
            },
            {
                "step": 5,
                "name": "EAP-TLS Mutual Handshake",
                "from": "Supplicant <-> Authentication Server",
                "to": "End-to-End Cryptographic Validation",
                "description": "Mutual verification of X.509 certificates and derivation of pairwise master keys (PMK)."
            },
            {
                "step": 6,
                "name": "RADIUS Access-Accept / Reject",
                "from": "Authentication Server",
                "to": "Authenticator",
                "description": "RADIUS server validates certificate against CRL/OCSP and signals port authorization decision."
            },
            {
                "step": 7,
                "name": "Port Transition to Authorized",
                "from": "Authenticator",
                "to": "Industrial Control Network",
                "description": "Switch transitions physical port from 'Unauthorized' (blocked) to 'Authorized' (forwarding operational SCADA traffic)."
            }
        ]
    }
