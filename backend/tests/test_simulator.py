"""Comprehensive Automated Test Suite for Secure ICS Simulator."""
import pytest
import os
import json
import base64
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Use a test database
os.environ["DATABASE_PATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "database", "test_ics_sim.db"))

from app import create_app
from app.database.db import get_connection, query_db, execute_db, get_device_private_key, init_db
from app.simulation.pathfinder import find_network_path, build_network_graph
from app.simulation.engine import simulate_industrial_message, create_simulation_session
from app.simulation.scenarios import run_security_scenario, list_security_scenarios
from app.security.crypto_engine import (
    compute_sha256_digest,
    verify_sha256_digest,
    aes_gcm_encrypt_payload,
    aes_gcm_decrypt_payload,
    rsa_pss_sign_digest,
    rsa_pss_verify_signature,
    check_replay_attack,
    reset_replay_cache
)
from app.security.access_control import evaluate_device_access

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    init_db()
    yield
    test_db = os.environ.get("DATABASE_PATH")
    if test_db and os.path.exists(test_db):
        try:
            os.remove(test_db)
        except Exception:
            pass

@pytest.fixture(scope="session")
def client(setup_test_environment):
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

# 1. Pathfinding and Graph Traversal Tests
def test_valid_network_path():
    path_found, hops, latency, err = find_network_path("Sensor-01", "SCADA-Server")
    assert path_found is True
    assert err is None
    assert hops == ["Sensor-01", "PLC-01", "Industrial-Switch", "SCADA-Server"]
    assert latency > 0.0

def test_missing_or_invalid_route():
    # Attempt routing from a non-existent node
    path_found, hops, latency, err = find_network_path("NONEXISTENT_NODE", "SCADA-Server")
    assert path_found is False
    assert "does not exist" in err

def test_disabled_device_path():
    execute_db("UPDATE devices SET enabled = 0 WHERE id = 'Monitoring-Server'")
    path_found, hops, latency, err = find_network_path("Operator-01", "Monitoring-Server")
    assert path_found is False
    assert "disabled" in err.lower()
    # Restore
    execute_db("UPDATE devices SET enabled = 1 WHERE id = 'Monitoring-Server'")

# 2. Cryptographic Security Tests
def test_aes_gcm_encryption_and_tampering():
    key_hex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    plaintext = "SETPOINT: TURBINE_SPEED=3600_RPM"
    aad = "channel=L2_CONTROL"

    enc = aes_gcm_encrypt_payload(plaintext, key_hex, associated_data=aad)
    assert enc["algorithm"] == "AES-256-GCM"
    assert len(enc["nonce_b64"]) > 0
    assert len(enc["tag_b64"]) > 0
    assert enc["ciphertext_b64"] != plaintext

    # Successful decryption
    ok, dec_pt, msg = aes_gcm_decrypt_payload(enc["ciphertext_b64"], enc["nonce_b64"], enc["tag_b64"], key_hex, aad)
    assert ok is True
    assert dec_pt == plaintext

    # Tampering test (tampering with 1 byte of ciphertext)
    raw_ct = list(base64.b64decode(enc["ciphertext_b64"]))
    raw_ct[0] ^= 0xFF
    tampered_ct = base64.b64encode(bytes(raw_ct)).decode('ascii')

    tamper_ok, _, tamper_msg = aes_gcm_decrypt_payload(tampered_ct, enc["nonce_b64"], enc["tag_b64"], key_hex, aad)
    assert tamper_ok is False
    assert "mismatch" in tamper_msg.lower() or "tampered" in tamper_msg.lower()

def test_sha256_digest_verification():
    content = "STATUS_REPORT: VALVE=OPEN, FLOW=155.0"
    digest = compute_sha256_digest(content)
    assert len(digest) == 64

    ok, msg = verify_sha256_digest(content, digest)
    assert ok is True

    # Tampered content fails
    tamper_ok, _ = verify_sha256_digest(content + "!", digest)
    assert tamper_ok is False

def test_rsa_pss_signature_verification():
    dev = query_db("SELECT * FROM devices WHERE id = 'PLC-01'", one=True)
    priv_key = get_device_private_key("PLC-01")
    digest = compute_sha256_digest("PAYLOAD: ALARM_CRITICAL_OVERPRESSURE")

    sig_b64 = rsa_pss_sign_digest(digest, priv_key)
    assert len(sig_b64) > 50

    # Verification passes
    ok, msg = rsa_pss_verify_signature(digest, sig_b64, dev["public_key_pem"])
    assert ok is True

    # Tampered digest fails
    fake_digest = compute_sha256_digest("MODIFIED_PAYLOAD")
    fail_ok, _ = rsa_pss_verify_signature(fake_digest, sig_b64, dev["public_key_pem"])
    assert fail_ok is False

# 3. Access Control and RBAC Tests
def test_rbac_authorization():
    sensor = query_db("SELECT * FROM devices WHERE id = 'Sensor-01'", one=True)
    scada = query_db("SELECT * FROM devices WHERE id = 'SCADA-Server'", one=True)
    untrusted = query_db("SELECT * FROM devices WHERE id = 'Untrusted-01'", one=True)

    # Sensor allowed to send Sensor Reading
    ok, _, _ = evaluate_device_access(sensor, scada, "Sensor Reading")
    assert ok is True

    # Sensor forbidden from sending Controller Command
    denied, reason, _ = evaluate_device_access(sensor, scada, "Controller Command")
    assert denied is False
    assert "PERMISSION_DENIED" in reason

    # Untrusted device denied
    untrusted_ok, untrusted_reason, _ = evaluate_device_access(untrusted, scada, "Sensor Reading")
    assert untrusted_ok is False
    assert "UNAUTHORIZED" in untrusted_reason

# 4. Replay Attack Rejection
def test_replay_attack_detection():
    reset_replay_cache()
    msg_id = "MSG-TEST-REPLAY-1001"

    is_replay, _ = check_replay_attack(msg_id)
    assert is_replay is False

    # Second submission is rejected
    is_replay_2, reason = check_replay_attack(msg_id)
    assert is_replay_2 is True
    assert "Replay attack detected" in reason

# 5. Full Simulation Workflow Tests
def test_end_to_end_normal_message_simulation():
    res = simulate_industrial_message(
        sender_id="Sensor-01",
        receiver_id="SCADA-Server",
        message_type="Sensor Reading",
        raw_payload={"temperature": 45.2},
        security_profile="Authenticated Secure Communication",
        scenario_id="normal"
    )

    assert res["success"] is True
    assert res["status"] == "Delivered"
    assert len(res["hops"]) == 4
    assert len(res["events"]) >= 5
    assert len(res["security"]["checks_passed"]) >= 2

def test_end_to_end_tampering_scenario():
    res = run_security_scenario("tampering")
    assert res["pass_fail"] == "PASS"
    assert res["actual_result"] == "Rejected"
    assert "tamper" in res["reason"].lower() or "mismatch" in res["reason"].lower()

def test_end_to_end_unauthorized_scenario():
    res = run_security_scenario("unauthorized_device")
    assert res["pass_fail"] == "PASS"
    assert res["actual_result"] == "Rejected"
    assert "unauthorized" in res["reason"].lower()

# 6. REST API Endpoints Tests
def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ONLINE"

def test_api_devices(client):
    res = client.get("/api/devices")
    assert res.status_code == 200
    assert res.get_json()["total"] >= 6

def test_api_topology(client):
    res = client.get("/api/topology")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["nodes"]) >= 6
    assert len(data["edges"]) >= 5

def test_api_dashboard_stats(client):
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    stats = res.get_json()
    assert stats["total_devices"] >= 6
    assert "security_pass_rate_pct" in stats

def test_api_lab_report(client):
    res = client.get("/api/reports/lab-report")
    assert res.status_code == 200
    report = res.get_json()["report"]
    assert "Secure Industrial Control System" in report["title"]
    assert len(report["cryptographic_mechanisms"]) == 5
