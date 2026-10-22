"""Simulation Engine for Industrial Control System Communication.
# Transmission Lifecycle States:
# 1. Created: Payload serialized by source PLC/HMI.
# 2. Queued: Ingress buffer admission and ACL policy validation.
# 3. In Transit: Cryptographic encapsulation, routing hop traversal, and anomaly detection.
# 4. Delivered / Rejected: Destination verification, MAC validation, and audit trail persistence.

Coordinates topology pathfinding, device admission, RBAC authorization,
cryptographic transformation, hop-by-hop packet events, and audit logging.
"""
import json
import uuid
import base64
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from ..database.db import query_db, execute_db, get_device_private_key
from .pathfinder import find_network_path
from ..security.crypto_engine import (
    canonicalize_payload,
    compute_sha256_digest,
    verify_sha256_digest,
    aes_gcm_encrypt_payload,
    aes_gcm_decrypt_payload,
    rsa_pss_sign_digest,
    rsa_pss_verify_signature,
    check_replay_attack
)
from ..security.access_control import evaluate_device_access

def create_simulation_session(name: str = "ICS Sim Session", topology_id: str = "starter-topology-01") -> Dict[str, Any]:
    """Initializes a new simulation session."""
    session_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    execute_db(
        """INSERT INTO simulation_sessions (id, name, topology_id, status, speed, created_at)
           VALUES (?, ?, ?, 'running', 1.0, ?)""",
        (session_id, name, topology_id, now)
    )
    return {
        "session_id": session_id,
        "name": name,
        "topology_id": topology_id,
        "status": "running",
        "created_at": now
    }

def get_or_create_active_session(topology_id: str = "starter-topology-01") -> str:
    """Returns the most recent active simulation session or creates one."""
    existing = query_db(
        "SELECT id FROM simulation_sessions WHERE status IN ('running', 'paused') ORDER BY created_at DESC LIMIT 1",
        one=True
    )
    if existing:
        return existing["id"]
    sess = create_simulation_session("Active Engineering Session", topology_id)
    return sess["session_id"]

def simulate_industrial_message(
    sender_id: str,
    receiver_id: str,
    message_type: str,
    raw_payload: Any,
    security_profile: str = "Authenticated Secure Communication",
    scenario_id: str = "normal",
    session_id: Optional[str] = None,
    topology_id: Optional[str] = None
) -> Dict[str, Any]:
    """Simulates the full transmission and security validation lifecycle of an industrial message."""
    if not topology_id or topology_id == "starter-topology-01":
        active_topo = query_db("SELECT id FROM topologies WHERE is_default = 1 LIMIT 1", one=True)
        if active_topo:
            topology_id = active_topo["id"]
        else:
            topology_id = "starter-topology-01"

    if not session_id:
        session_id = get_or_create_active_session(topology_id)

    now = datetime.now(timezone.utc).isoformat()
    msg_num = query_db("SELECT COUNT(*) as cnt FROM messages", one=True)["cnt"] + 1
    message_id = f"MSG-{now[:10].replace('-', '')}-{msg_num:04d}"

    # Fetch devices from DB (with flexible ID, case-insensitive, or Name lookup)
    sender = query_db("SELECT * FROM devices WHERE id = ?", (sender_id,), one=True)
    if not sender:
        sender = query_db("SELECT * FROM devices WHERE LOWER(id) = LOWER(?) OR LOWER(name) = LOWER(?)", (sender_id, sender_id), one=True)

    receiver = query_db("SELECT * FROM devices WHERE id = ?", (receiver_id,), one=True)
    if not receiver:
        receiver = query_db("SELECT * FROM devices WHERE LOWER(id) = LOWER(?) OR LOWER(name) = LOWER(?)", (receiver_id, receiver_id), one=True)

    if not sender:
        raise ValueError(f"Sender device '{sender_id}' not found in registry.")
    if not receiver:
        raise ValueError(f"Receiver device '{receiver_id}' not found in registry.")

    # Canonical device IDs
    sender_id = sender["id"]
    receiver_id = receiver["id"]

    # Canonical string representation
    canonical_data = canonicalize_payload(raw_payload)

    # 1. Pre-Transmission Validation: Pathfinding
    path_found, hops, total_latency, route_error = find_network_path(sender_id, receiver_id, topology_id)

    # Allow scenario injection override for missing path
    if scenario_id == "missing_path":
        path_found = False
        hops = [sender_id]
        route_error = f"SCENARIO_INJECTED_FAILURE: Physical conduit between '{sender_id}' and '{receiver_id}' severed."

    # 2. Access Control & Admission Evaluation
    rbac_allowed, rbac_reason, rbac_details = evaluate_device_access(sender, receiver, message_type)
    if scenario_id == "unauthorized_device":
        rbac_allowed = False
        rbac_reason = f"UNAUTHORIZED_DEVICE: Device '{sender_id}' blocked by Admission Control (Unregistered MAC/Identity)."
        rbac_details["error_code"] = "UNAUTHORIZED_SENDER"

    # 3. Cryptographic Operations
    security_metadata: Dict[str, Any] = {
        "profile": security_profile,
        "digest": None,
        "signature": None,
        "encryption": None,
        "checks_passed": []
    }

    crypto_failed = False
    crypto_failure_reason = None
    crypto_status_label = "Plaintext"

    if security_profile == "Security Disabled":
        security_status_label = "Plaintext Transmission (Insecure)"
    elif security_profile == "Integrity Verified":
        # SHA-256 Digest
        digest = compute_sha256_digest(canonical_data)
        security_metadata["digest"] = {
            "algorithm": "SHA-256",
            "hash_hex": digest
        }
        
        # Scenario tampering test
        test_payload = canonical_data
        if scenario_id == "tampering":
            test_payload = canonical_data + " [TAMPERED_BYTE_0xAA]"

        is_intact, integrity_msg = verify_sha256_digest(test_payload, digest)
        if not is_intact:
            crypto_failed = True
            crypto_failure_reason = integrity_msg
            crypto_status_label = "Tamper Detected"
        else:
            security_metadata["checks_passed"].append("SHA-256 Integrity Verified")
            crypto_status_label = "Integrity Verified"

    elif security_profile == "Authenticated Secure Communication":
        # SHA-256 Digest
        digest = compute_sha256_digest(canonical_data)
        security_metadata["digest"] = {
            "algorithm": "SHA-256",
            "hash_hex": digest
        }

        # RSA-PSS Digital Signature
        priv_key = get_device_private_key(sender_id)
        sig_b64 = rsa_pss_sign_digest(digest, priv_key)
        security_metadata["signature"] = {
            "algorithm": "RSA-PSS (2048-bit, SHA-256)",
            "signature_b64": sig_b64,
            "signature_sample": sig_b64[:24] + "..."
        }

        # Replay Attack Check
        is_replay, replay_msg = check_replay_attack(message_id)
        if scenario_id == "replay_attempt":
            is_replay = True
            replay_msg = f"REPLAY_ATTACK_DETECTED: Stale sequence or duplicate message ID '{message_id}' re-transmitted."

        if is_replay:
            crypto_failed = True
            crypto_failure_reason = replay_msg
            crypto_status_label = "Replay Attack Detected"

        # AES-256-GCM AEAD Encryption
        aes_key = sender["aes_key_hex"]
        aad = f"id={message_id};src={sender_id};dst={receiver_id};type={message_type};ts={now}"
        enc_res = aes_gcm_encrypt_payload(canonical_data, aes_key, associated_data=aad)
        
        security_metadata["encryption"] = {
            "algorithm": "AES-256-GCM",
            "ciphertext_b64": enc_res["ciphertext_b64"],
            "nonce_b64": enc_res["nonce_b64"],
            "tag_b64": enc_res["tag_b64"],
            "associated_data": aad
        }

        # Decryption and Verification at Receiver
        decrypt_ct = enc_res["ciphertext_b64"]
        decrypt_tag = enc_res["tag_b64"]
        decrypt_sig = sig_b64

        if scenario_id == "tampering":
            # Tamper with ciphertext by flipping bits in raw ciphertext bytes
            raw_ct = list(base64.b64decode(decrypt_ct))
            raw_ct[0] ^= 0xFF
            decrypt_ct = base64.b64encode(bytes(raw_ct)).decode('ascii')
        elif scenario_id == "bad_auth_tag":
            # Corrupt authentication tag by flipping bits in tag bytes
            raw_tag = list(base64.b64decode(decrypt_tag))
            raw_tag[0] ^= 0xFF
            decrypt_tag = base64.b64encode(bytes(raw_tag)).decode('ascii')
        elif scenario_id == "bad_signature":
            # Corrupt digital signature bytes
            raw_sig = list(base64.b64decode(decrypt_sig))
            raw_sig[0] ^= 0xFF
            decrypt_sig = base64.b64encode(bytes(raw_sig)).decode('ascii')

        if not crypto_failed:
            # 1. AES-GCM Decrypt
            dec_ok, dec_pt, dec_msg = aes_gcm_decrypt_payload(
                decrypt_ct, enc_res["nonce_b64"], decrypt_tag, aes_key, associated_data=aad
            )
            if not dec_ok:
                crypto_failed = True
                crypto_failure_reason = dec_msg
                crypto_status_label = "AEAD Tag Mismatch (Tampered)"
            else:
                security_metadata["checks_passed"].append("AES-256-GCM Decrypted & Authenticated")

                # 2. RSA-PSS Signature Verification
                sig_ok, sig_msg = rsa_pss_verify_signature(digest, decrypt_sig, sender["public_key_pem"])
                if not sig_ok:
                    crypto_failed = True
                    crypto_failure_reason = sig_msg
                    crypto_status_label = "Invalid Digital Signature"
                else:
                    security_metadata["checks_passed"].append("RSA-PSS Origin Signature Verified")
                    crypto_status_label = "Authenticated & Encrypted (Verified)"

    # 4. Final Delivery Decision
    final_status = "Delivered"
    rejection_reason = None

    if not path_found:
        final_status = "Failed"
        rejection_reason = route_error
    elif not rbac_allowed:
        final_status = "Rejected"
        rejection_reason = rbac_reason
    elif crypto_failed:
        final_status = "Rejected"
        rejection_reason = crypto_failure_reason

    # 5. Record Message in Database
    execute_db(
        """INSERT INTO messages 
           (id, session_id, sender_id, receiver_id, message_type, raw_payload, security_profile, scenario_id, sequence_number, status, rejection_reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            message_id, session_id, sender_id, receiver_id, message_type, canonical_data,
            security_profile, scenario_id, msg_num, final_status, rejection_reason, now
        )
    )

    # 6. Generate Granular Hop-by-Hop Simulation Events
    events: List[Dict[str, Any]] = []

    # Step 0: Created
    step_0 = {
        "session_id": session_id,
        "message_id": message_id,
        "step_index": 0,
        "source_device": sender_id,
        "destination_device": receiver_id,
        "current_hop": sender_id,
        "next_hop": hops[1] if len(hops) > 1 else None,
        "protocol": "Application / Serializer",
        "packet_state": "Created",
        "security_status": crypto_status_label,
        "explanation": f"Message '{message_id}' formulated by {sender_id}. Payload serialized: {canonical_data[:60]}...",
        "wire_details": {"raw_payload": canonical_data, "profile": security_profile},
        "timestamp": now
    }
    events.append(step_0)

    # Step 1: Queued
    step_1 = {
        "session_id": session_id,
        "message_id": message_id,
        "step_index": 1,
        "source_device": sender_id,
        "destination_device": receiver_id,
        "current_hop": sender_id,
        "next_hop": hops[1] if len(hops) > 1 else None,
        "protocol": "TCP / IP Egress",
        "packet_state": "Queued",
        "security_status": crypto_status_label,
        "explanation": f"Egress buffer queued frame on interface eth0. Path resolution: {' -> '.join(hops)}.",
        "wire_details": {"route": hops, "total_latency_ms": total_latency},
        "timestamp": now
    }
    events.append(step_1)

    # If route failed, record failure event at source
    if not path_found:
        fail_ev = {
            "session_id": session_id,
            "message_id": message_id,
            "step_index": 2,
            "source_device": sender_id,
            "destination_device": receiver_id,
            "current_hop": sender_id,
            "next_hop": None,
            "protocol": "Routing Engine",
            "packet_state": "Failed",
            "security_status": "Path Unavailable",
            "explanation": f"Routing failure: {route_error}",
            "wire_details": {"error": route_error},
            "timestamp": now
        }
        events.append(fail_ev)

    # If RBAC failed, record rejection at admission step
    elif not rbac_allowed:
        rbac_ev = {
            "session_id": session_id,
            "message_id": message_id,
            "step_index": 2,
            "source_device": sender_id,
            "destination_device": receiver_id,
            "current_hop": sender_id,
            "next_hop": None,
            "protocol": "Admission Control / RBAC",
            "packet_state": "Rejected",
            "security_status": "Access Violation",
            "explanation": f"Authorization policy denial: {rbac_reason}",
            "wire_details": rbac_details,
            "timestamp": now
        }
        events.append(rbac_ev)

    else:
        # Route hop-by-hop
        for i in range(1, len(hops) - 1):
            hop_dev = hops[i]
            in_transit_ev = {
                "session_id": session_id,
                "message_id": message_id,
                "step_index": i + 1,
                "source_device": sender_id,
                "destination_device": receiver_id,
                "current_hop": hop_dev,
                "next_hop": hops[i + 1],
                "protocol": "Ethernet / L2 Forwarding",
                "packet_state": "In transit",
                "security_status": crypto_status_label,
                "explanation": f"Intermediate node '{hop_dev}' switched frame toward '{hops[i+1]}'.",
                "wire_details": {"hop_device": hop_dev, "next_hop": hops[i + 1]},
                "timestamp": now
            }
            events.append(in_transit_ev)

        # Destination Inspection Hop
        dest_step_index = len(hops) + 1
        if crypto_failed:
            crypto_ev = {
                "session_id": session_id,
                "message_id": message_id,
                "step_index": dest_step_index,
                "source_device": sender_id,
                "destination_device": receiver_id,
                "current_hop": receiver_id,
                "next_hop": None,
                "protocol": "Security Layer / Verification",
                "packet_state": "Rejected",
                "security_status": crypto_status_label,
                "explanation": f"Security verification failed at {receiver_id}: {crypto_failure_reason}",
                "wire_details": {"failure_reason": crypto_failure_reason, "checks_passed": security_metadata["checks_passed"]},
                "timestamp": now
            }
            events.append(crypto_ev)
        else:
            deliver_ev = {
                "session_id": session_id,
                "message_id": message_id,
                "step_index": dest_step_index,
                "source_device": sender_id,
                "destination_device": receiver_id,
                "current_hop": receiver_id,
                "next_hop": None,
                "protocol": "Application Ingress",
                "packet_state": "Delivered",
                "security_status": crypto_status_label,
                "explanation": f"Frame safely accepted by '{receiver_id}'. All security profiles and RBAC policies verified.",
                "wire_details": {"checks_passed": security_metadata["checks_passed"]},
                "timestamp": now
            }
            events.append(deliver_ev)

    # Persist all events to database
    for ev in events:
        execute_db(
            """INSERT INTO simulation_events 
               (session_id, message_id, step_index, source_device, destination_device, current_hop, next_hop, protocol, packet_state, security_status, explanation, wire_details_json, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                ev["session_id"], ev["message_id"], ev["step_index"], ev["source_device"],
                ev["destination_device"], ev["current_hop"], ev["next_hop"], ev["protocol"],
                ev["packet_state"], ev["security_status"], ev["explanation"],
                json.dumps(ev.get("wire_details", {})), ev["timestamp"]
            )
        )

    # 7. Persist to Audit Log
    execute_db(
        """INSERT INTO audit_logs 
           (timestamp, session_id, message_id, source_device, destination_device, event_type, security_result, decision, rejection_reason, details_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            now, session_id, message_id, sender_id, receiver_id,
            f"MESSAGE_{final_status.upper()}",
            crypto_status_label,
            "ACCEPTED" if final_status == "Delivered" else "REJECTED",
            rejection_reason,
            json.dumps({
                "message_type": message_type,
                "security_profile": security_profile,
                "scenario_id": scenario_id,
                "hops": hops,
                "checks_passed": security_metadata["checks_passed"],
                "rejection_reason": rejection_reason
            })
        )
    )

    return {
        "success": final_status == "Delivered",
        "message_id": message_id,
        "session_id": session_id,
        "status": final_status,
        "rejection_reason": rejection_reason,
        "hops": hops,
        "latency_ms": total_latency,
        "security": security_metadata,
        "events": events
    }
