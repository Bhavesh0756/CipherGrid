"""Repeatable Security Scenarios Suite for Industrial Control Systems.
# Pre-Configured Attack Scenarios:
# - Replay Attack: Re-injects captured telemetry frames to trick destination actuators.
# - Tamper / Bit-Flip: Corrupts ciphertext or Modbus function codes in-flight to test authentication tags.
# - Denial of Service (DoS): Floods L1 field bus to evaluate rate limiting and queue degradation.

Implements the 9 standard scenarios specified in Phase 9:
1. normal: Normal valid communication
2. tampering: Message tampering
3. bad_signature: Invalid digital signature
4. unauthorized_device: Unauthorized device
5. replay_attempt: Replay attempt
6. bad_auth_tag: Invalid AES-GCM authentication tag
7. missing_path: Missing network path
8. disabled_destination: Disabled destination device
9. recovery: Successful communication after a rejected attempt
"""
import json
from datetime import datetime, timezone
from typing import Dict, Any, List

from ..database.db import execute_db, query_db
from .engine import simulate_industrial_message, create_simulation_session
from ..security.crypto_engine import reset_replay_cache

SCENARIO_DEFINITIONS = [
    {
        "id": "normal",
        "name": "Normal Valid Communication",
        "objective": "Verify that authorized sensor telemetry is delivered when valid AES-256-GCM encryption, SHA-256 digest, and RSA-PSS digital signatures are applied.",
        "sender_id": "Sensor-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Sensor Reading",
        "payload": {"temperature_c": 42.5, "pressure_psi": 435.0, "status": "NOMINAL"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Delivered"
    },
    {
        "id": "tampering",
        "name": "Message Tampering Detection",
        "objective": "Demonstrate that modifying message payload in-transit causes an immediate integrity failure and frame rejection.",
        "sender_id": "Sensor-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Sensor Reading",
        "payload": {"temperature_c": 98.2, "status": "FORCED_OVERRIDE"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Rejected"
    },
    {
        "id": "bad_signature",
        "name": "Invalid Digital Signature Detection",
        "objective": "Demonstrate that an altered or forged digital signature fails RSA-PSS mathematical verification and prevents origin spoofing.",
        "sender_id": "PLC-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Device Status",
        "payload": {"status": "TURBINE_RUNNING", "rpm": 3600},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Rejected"
    },
    {
        "id": "unauthorized_device",
        "name": "Unauthorized Device Admission Rejection",
        "objective": "Verify that an unregistered or untrusted field probe attempting to inject controller commands is blocked by Admission Control & RBAC.",
        "sender_id": "Untrusted-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Controller Command",
        "payload": {"command": "EMERGENCY_SHUTDOWN", "target": "ALL_VALVES"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Rejected"
    },
    {
        "id": "replay_attempt",
        "name": "Replay Attack Prevention",
        "objective": "Demonstrate that retransmitting a previously captured authenticated message is blocked by sequence tracking and nonce freshness checks.",
        "sender_id": "Operator-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Controller Command",
        "payload": {"setpoint": "PRESSURE_LIMIT_450"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Rejected"
    },
    {
        "id": "bad_auth_tag",
        "name": "Invalid AES-GCM Authentication Tag Rejection",
        "objective": "Verify that corrupting the 128-bit GCM authentication tag causes an AEAD InvalidTag exception, preserving confidentiality and integrity.",
        "sender_id": "PLC-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Alarm Notification",
        "payload": {"alarm": "HIGH_TEMPERATURE_WARNING", "severity": "HIGH"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Rejected"
    },
    {
        "id": "missing_path",
        "name": "Missing Network Path Failure",
        "objective": "Demonstrate that when no physical link exists between devices, pathfinding fails gracefully without pretending delivery occurred.",
        "sender_id": "Sensor-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Sensor Reading",
        "payload": {"temp": 42.0},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Failed"
    },
    {
        "id": "disabled_destination",
        "name": "Disabled Destination Device Failure",
        "objective": "Verify that attempting to transmit to an administratively disabled device halts the packet at egress before network queuing.",
        "sender_id": "Operator-01",
        "receiver_id": "Untrusted-01", # We will temporarily disable target or check disabled status
        "message_type": "Controller Command",
        "payload": {"ping": "DIAGNOSTIC_QUERY"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Failed"
    },
    {
        "id": "recovery",
        "name": "Successful Communication After Rejected Attempt",
        "objective": "Demonstrate that after a security or path anomaly is cleared, authorized communication resumes with full cryptographic protection.",
        "sender_id": "Operator-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Controller Command",
        "payload": {"command": "RESUME_NORMAL_MONITORING", "authorized_by": "LEAD_ENGINEER"},
        "profile": "Authenticated Secure Communication",
        "expected_result": "Delivered"
    }
]

def list_security_scenarios() -> List[Dict[str, Any]]:
    """Returns metadata for all 9 repeatable security scenarios."""
    return SCENARIO_DEFINITIONS

def run_security_scenario(scenario_id: str, session_id: str = None) -> Dict[str, Any]:
    """Executes a specific security scenario, computing pass/fail dynamically from actual results."""
    scenario = next((s for s in SCENARIO_DEFINITIONS if s["id"] == scenario_id), None)
    if not scenario:
        raise ValueError(f"Unknown scenario ID '{scenario_id}'.")

    if not session_id:
        sess = create_simulation_session(f"Scenario Run: {scenario['name']}")
        session_id = sess["session_id"]

    now = datetime.now(timezone.utc).isoformat()

    # Pre-scenario state manipulation if required
    if scenario_id == "disabled_destination":
        # Temporarily disable destination
        execute_db("UPDATE devices SET enabled = 0 WHERE id = ?", (scenario["receiver_id"],))

    try:
        # Execute message simulation
        sim_result = simulate_industrial_message(
            sender_id=scenario["sender_id"],
            receiver_id=scenario["receiver_id"],
            message_type=scenario["message_type"],
            raw_payload=scenario["payload"],
            security_profile=scenario["profile"],
            scenario_id=scenario["id"],
            session_id=session_id
        )

        actual_result = sim_result["status"]
        expected_result = scenario["expected_result"]

        # Dynamic computation of Pass / Fail
        pass_fail = "PASS" if actual_result.lower() == expected_result.lower() else "FAIL"

        checks_executed = sim_result.get("security", {}).get("checks_passed", [])
        if sim_result["rejection_reason"]:
            checks_executed.append(f"Security Boundary Enforced: {sim_result['rejection_reason']}")

        # Persist test result in database
        execute_db(
            """INSERT INTO security_test_results 
               (session_id, scenario_id, scenario_name, test_objective, expected_result, actual_result, pass_fail, checks_executed, reason, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                session_id, scenario["id"], scenario["name"], scenario["objective"],
                expected_result, actual_result, pass_fail,
                json.dumps(checks_executed), sim_result.get("rejection_reason") or "Operation succeeded according to security policy.",
                now
            )
        )

        return {
            "scenario_id": scenario["id"],
            "scenario_name": scenario["name"],
            "session_id": session_id,
            "test_objective": scenario["objective"],
            "expected_result": expected_result,
            "actual_result": actual_result,
            "pass_fail": pass_fail,
            "checks_executed": checks_executed,
            "reason": sim_result.get("rejection_reason") or "All cryptographic and policy rules passed.",
            "simulation_result": sim_result,
            "timestamp": now
        }
    finally:
        # Clean up temporary state overrides
        if scenario_id == "disabled_destination":
            execute_db("UPDATE devices SET enabled = 1 WHERE id = ?", (scenario["receiver_id"],))
