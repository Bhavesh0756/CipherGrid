"""Device Management and Industrial Message Simulation Service."""
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..database.db import query_db, execute_db
from ..security.rbac import evaluate_access
from ..security.symmetric import aes_gcm_encrypt
from ..security.signatures import rsa_pss_sign
from ..security.hash_util import sha256_hash
from .log_service import record_event

def list_devices() -> List[Dict[str, Any]]:
    """Returns all registered virtual devices."""
    devices = query_db("SELECT * FROM devices ORDER BY id ASC")
    for d in devices:
        if isinstance(d.get("allowed_actions"), str):
            try:
                d["allowed_actions"] = json.loads(d["allowed_actions"])
            except Exception:
                d["allowed_actions"] = []
    return devices

def get_device(device_id: str) -> Optional[Dict[str, Any]]:
    """Returns a single device by its identifier."""
    device = query_db("SELECT * FROM devices WHERE id = ?", (device_id,), one=True)
    if device and isinstance(device.get("allowed_actions"), str):
        try:
            device["allowed_actions"] = json.loads(device["allowed_actions"])
        except Exception:
            device["allowed_actions"] = []
    return device

def create_device(data: Dict[str, Any]) -> Dict[str, Any]:
    """Registers a new virtual industrial device."""
    device_id = data.get("id", "").strip().upper()
    if not device_id:
        raise ValueError("Device ID cannot be empty.")
    
    existing = get_device(device_id)
    if existing:
        raise ValueError(f"Device with ID '{device_id}' already exists.")

    name = data.get("name", "Industrial Device")
    dev_type = data.get("type", "PLC")
    status = data.get("status", "Authorized")
    role = data.get("role", "operator")
    
    allowed_actions = data.get("allowed_actions", [])
    if isinstance(allowed_actions, list):
        allowed_actions_str = json.dumps(allowed_actions)
    else:
        allowed_actions_str = json.dumps(["read_telemetry", "report_status"])

    ip_address = data.get("ip_address", "192.168.1.150")
    now = datetime.now(timezone.utc).isoformat()

    query = """
        INSERT INTO devices (id, name, type, status, role, allowed_actions, ip_address, last_seen, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    execute_db(query, (device_id, name, dev_type, status, role, allowed_actions_str, ip_address, None, now))

    record_event(
        event_type="DEVICE_REGISTERED",
        severity="INFO",
        device_id=device_id,
        action="REGISTER",
        result="SUCCESS",
        message=f"Virtual device '{device_id}' ({name}) enrolled in SCADA directory.",
        details={"type": dev_type, "role": role, "status": status}
    )

    return get_device(device_id)

def update_device(device_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates device status, role, or allowed actions."""
    existing = get_device(device_id)
    if not existing:
        raise ValueError(f"Device '{device_id}' not found.")

    name = data.get("name", existing["name"])
    dev_type = data.get("type", existing["type"])
    status = data.get("status", existing["status"])
    role = data.get("role", existing["role"])
    
    allowed_actions = data.get("allowed_actions", existing["allowed_actions"])
    if isinstance(allowed_actions, list):
        allowed_actions_str = json.dumps(allowed_actions)
    else:
        allowed_actions_str = json.dumps(existing["allowed_actions"])

    ip_address = data.get("ip_address", existing["ip_address"])

    query = """
        UPDATE devices
        SET name = ?, type = ?, status = ?, role = ?, allowed_actions = ?, ip_address = ?
        WHERE id = ?
    """
    execute_db(query, (name, dev_type, status, role, allowed_actions_str, ip_address, device_id))

    record_event(
        event_type="DEVICE_POLICY_UPDATED",
        severity="WARNING" if status != "Authorized" else "INFO",
        device_id=device_id,
        action="UPDATE_CONFIG",
        result="SUCCESS",
        message=f"Device '{device_id}' configuration updated. Status: {status}, Role: {role}.",
        details={"status": status, "role": role}
    )

    return get_device(device_id)

def delete_device(device_id: str) -> bool:
    """Removes a device from the database."""
    existing = get_device(device_id)
    if not existing:
        raise ValueError(f"Device '{device_id}' not found.")

    execute_db("DELETE FROM devices WHERE id = ?", (device_id,))
    record_event(
        event_type="DEVICE_DEREGISTERED",
        severity="WARNING",
        device_id=device_id,
        action="DEREGISTER",
        result="SUCCESS",
        message=f"Device '{device_id}' removed from active registry.",
        details={"id": device_id}
    )
    return True

def simulate_message(device_id: str, action: str, raw_payload: Any) -> Dict[str, Any]:
    """Simulates an industrial communication message through the security pipeline:
    
    1. Retrieve device from database.
    2. RBAC Policy check (Device Status + Action Privilege).
    3. If Rejected: Record violation event in SQLite, save rejected record, return 403.
    4. If Allowed:
       - Encapsulate payload using AES-GCM (Confidentiality & Authenticity).
       - Compute SHA-256 Digest (Integrity verification).
       - Sign with RSA-PSS (Non-repudiation & Origin Authentication).
       - Record success event and simulation record in SQLite.
       - Update device last_seen.
    """
    device = get_device(device_id)
    if not device:
        reason = f"UNKNOWN_DEVICE: Device ID '{device_id}' is not in database registry."
        record_event("ACCESS_CONTROL_VIOLATION", "CRITICAL", device_id, action, "DENY", reason)
        return {
            "status": "REJECTED",
            "device_id": device_id,
            "action": action,
            "reason": reason,
            "security_flow": {
                "step_1_admission": "FAILED - Unregistered Hardware ID",
                "step_2_rbac": "BLOCKED",
                "step_3_encryption": "ABORTED"
            }
        }

    # Ensure payload is string
    if isinstance(raw_payload, dict):
        payload_str = json.dumps(raw_payload)
    else:
        payload_str = str(raw_payload)

    is_allowed, reason, details = evaluate_access(device, action)
    now = datetime.now(timezone.utc).isoformat()

    if not is_allowed:
        severity = "CRITICAL" if details.get("action_risk") == "CRITICAL" else "WARNING"
        record_event(
            event_type="ACCESS_CONTROL_VIOLATION",
            severity=severity,
            device_id=device_id,
            action=action,
            result="DENY",
            message=reason,
            details=details
        )
        execute_db(
            "INSERT INTO simulation_records (timestamp, device_id, action, payload, status, reason, security_checks) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (now, device_id, action, payload_str[:200], "REJECTED", reason, json.dumps(details))
        )
        return {
            "status": "REJECTED",
            "device_id": device_id,
            "action": action,
            "reason": reason,
            "details": details,
            "security_flow": {
                "step_1_admission": "PASSED" if device["status"] == "Authorized" else f"FAILED ({device['status']})",
                "step_2_rbac": "FAILED - Permission Denied",
                "step_3_crypto_pipeline": "ABORTED"
            }
        }

    # If allowed, execute full cryptographic pipeline
    # 1. AES-GCM Encryption
    aes_result = aes_gcm_encrypt(
        plaintext=payload_str,
        associated_data=f"device_id={device_id};action={action};time={now}"
    )

    # 2. SHA-256 Digest
    hash_result = sha256_hash(payload_str)

    # 3. RSA-PSS Digital Signature of the hash digest
    sig_result = rsa_pss_sign(hash_result["hash_hex"])

    # Update last_seen
    execute_db("UPDATE devices SET last_seen = ? WHERE id = ?", (now, device_id))

    # Persist simulation record
    security_metadata = {
        "aes_nonce": aes_result["nonce_b64"],
        "aes_tag": aes_result["tag_b64"],
        "sha256": hash_result["hash_hex"],
        "rsa_signature_sample": sig_result["signature_b64"][:20] + "...",
        "risk_level": details.get("risk_level", "LOW")
    }
    execute_db(
        "INSERT INTO simulation_records (timestamp, device_id, action, payload, status, reason, security_checks) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (now, device_id, action, payload_str[:200], "ACCEPTED", "Authorized and Cryptographically Secured", json.dumps(security_metadata))
    )

    record_event(
        event_type="DEVICE_AUTH_SUCCESS",
        severity="INFO",
        device_id=device_id,
        action=action,
        result="ALLOW",
        message=f"Message from '{device_id}' accepted, encrypted via AES-GCM, and signed with RSA-PSS.",
        details=security_metadata
    )

    return {
        "status": "ACCEPTED",
        "device_id": device_id,
        "action": action,
        "reason": reason,
        "timestamp": now,
        "raw_payload": raw_payload,
        "security_pipeline": {
            "symmetric_encryption": {
                "algorithm": "AES-256-GCM",
                "ciphertext_b64": aes_result["ciphertext_b64"],
                "nonce_b64": aes_result["nonce_b64"],
                "tag_b64": aes_result["tag_b64"],
                "associated_data": aes_result["associated_data"]
            },
            "integrity_digest": {
                "algorithm": "SHA-256",
                "hash_hex": hash_result["hash_hex"]
            },
            "digital_signature": {
                "algorithm": "RSA-PSS (SHA-256, MGF1)",
                "signature_b64": sig_result["signature_b64"]
            }
        },
        "security_flow": {
            "step_1_admission": "PASSED (Device Authorized)",
            "step_2_rbac": "PASSED (Action Allowed by Role)",
            "step_3_encryption": "PASSED (AES-GCM Authenticated Encryption)",
            "step_4_signature": "PASSED (RSA-PSS Origin Signature Generated)"
        }
    }
