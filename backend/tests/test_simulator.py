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

def test_pathfinder_case_insensitivity_and_name_matching():
    # Lowercase ID matching
    path_found, hops, latency, err = find_network_path("sensor-01", "scada-server")
    assert path_found is True
    assert hops == ["Sensor-01", "PLC-01", "Industrial-Switch", "SCADA-Server"]

    # Name matching
    path_found2, hops2, _, err2 = find_network_path("Temperature Sensor 01", "Supervisory SCADA Server")
    assert path_found2 is True
    assert hops2 == ["Sensor-01", "PLC-01", "Industrial-Switch", "SCADA-Server"]

def test_pathfinder_link_status_variations():
    # Update a connection to lowercase 'active'
    execute_db("UPDATE connections SET status = 'active' WHERE source_id = 'Sensor-01' AND target_id = 'PLC-01'")
    path_found, hops, _, err = find_network_path("Sensor-01", "SCADA-Server")
    assert path_found is True
    assert err is None
    # Restore
    execute_db("UPDATE connections SET status = 'Active' WHERE source_id = 'Sensor-01' AND target_id = 'PLC-01'")

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
    assert "devices_summary" in stats
    assert stats["devices_summary"]["online"] >= 1
    assert "security_pass_rate_pct" in stats

def test_api_lab_report(client):
    res = client.get("/api/reports/lab-report")
    assert res.status_code == 200
    report = res.get_json()["report"]
    assert "Secure Industrial Control System" in report["title"]
    assert len(report["cryptographic_mechanisms"]) == 5

def test_api_security_hash_and_verify(client):
    payload = "voltage=230.5;frequency=50.0"
    res = client.post("/api/security/hash", json={"payload": payload})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    digest = data["digest"]
    assert len(digest) == 64

    # Verify matching digest
    v_res = client.post("/api/security/hash/verify", json={"payload": payload, "expected_digest": digest})
    assert v_res.status_code == 200
    assert v_res.get_json()["valid"] is True

    # Tampered payload fails verification
    f_res = client.post("/api/security/hash/verify", json={"payload": payload + "!", "expected_digest": digest})
    assert f_res.status_code == 200
    assert f_res.get_json()["valid"] is False

def test_api_security_sign_and_verify(client):
    payload = "COMMAND=TRIP_BREAKER_4"
    res = client.post("/api/security/sign", json={"device_id": "PLC-01", "payload": payload})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    sig = data["signature_b64"]
    assert len(sig) > 60

    # Authentic signature passes
    v_res = client.post("/api/security/verify-signature", json={
        "device_id": "PLC-01",
        "payload": payload,
        "signature_b64": sig
    })
    assert v_res.status_code == 200
    assert v_res.get_json()["valid"] is True

    # Modified payload fails signature verification
    bad_v_res = client.post("/api/security/verify-signature", json={
        "device_id": "PLC-01",
        "payload": payload + "_MODIFIED",
        "signature_b64": sig
    })
    assert bad_v_res.status_code == 200
    assert bad_v_res.get_json()["valid"] is False

def test_api_security_interactive_workbench(client):
    res = client.post("/api/security/verify", json={
        "device_id": "Sensor-01",
        "payload": "temp=38.2",
        "tamper_ciphertext": False
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["pipeline_verdict"]["intact"] is True
    assert data["encryption"]["decryption_success"] is True

    # With ciphertext tampering, decryption fails authentic verification
    t_res = client.post("/api/security/verify", json={
        "device_id": "Sensor-01",
        "payload": "temp=38.2",
        "tamper_ciphertext": True
    })
    assert t_res.status_code == 200
    t_data = t_res.get_json()
    assert t_data["encryption"]["decryption_success"] is False
    assert t_data["pipeline_verdict"]["intact"] is False

def test_api_device_public_key_isolated(client):
    res = client.get("/api/devices/Sensor-01/public-key")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "public_key_pem" in data
    assert "key_fingerprint_sha256" in data
    # Ensure private key is NEVER leaked in public key endpoint
    assert "private_key_pem" not in data

def test_api_notifications_from_audit_logs(client):
    res = client.get("/api/events/notifications")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["notifications"], list)

def test_api_device_key_rotation(client):
    """Verifies backend key rotation produces new RSA keypair and isolates private key."""
    # 1. Fetch initial public key
    orig_res = client.get("/api/devices/Sensor-01/public-key")
    assert orig_res.status_code == 200
    orig_fp = orig_res.get_json()["key_fingerprint_sha256"]

    # 2. Rotate keys
    rot_res = client.post("/api/devices/Sensor-01/rotate-keys")
    assert rot_res.status_code == 200
    rot_data = rot_res.get_json()
    assert rot_data["success"] is True
    new_fp = rot_data["fingerprint"]
    assert new_fp != orig_fp
    assert "private_key_pem" not in rot_data

    # 3. Verify newly signed payload verifies with new rotated public key
    payload = "test_rotation_payload"
    sign_res = client.post("/api/security/sign", json={"device_id": "Sensor-01", "payload": payload})
    assert sign_res.status_code == 200
    sig = sign_res.get_json()["signature_b64"]

    v_res = client.post("/api/security/verify-signature", json={
        "device_id": "Sensor-01",
        "payload": payload,
        "signature_b64": sig
    })
    assert v_res.status_code == 200
    assert v_res.get_json()["valid"] is True

def test_devices_have_distinct_keys(client):
    """Verifies that all registered devices have unique, non-shared public keys and fingerprints."""
    res = client.get("/api/devices")
    assert res.status_code == 200
    devices = res.get_json()["devices"]
    assert len(devices) >= 5

    fingerprints = set()
    public_keys = set()
    for d in devices:
        fp = d.get("key_fingerprint")
        pk = d.get("public_key_pem")
        assert fp is not None, f"Device {d['id']} missing key_fingerprint"
        assert pk is not None, f"Device {d['id']} missing public_key_pem"
        assert "PRIVATE KEY" not in pk, f"Private key leaked in device record for {d['id']}"
        fingerprints.add(fp)
        public_keys.add(pk)

    assert len(fingerprints) == len(devices), "Duplicate device key fingerprints detected!"
    assert len(public_keys) == len(devices), "Duplicate device public keys detected!"

def test_api_security_error_handling(client):
    """Tests invalid inputs, non-existent devices, and missing records."""
    # Non-existent device for public key
    bad_dev_res = client.get("/api/devices/NON_EXISTENT_999/public-key")
    assert bad_dev_res.status_code == 404

    # Non-existent device for signing
    bad_sign_res = client.post("/api/security/sign", json={"device_id": "NON_EXISTENT_999", "payload": "xyz"})
    assert bad_sign_res.status_code == 404

    # Invalid signature format for verification
    bad_sig_res = client.post("/api/security/verify-signature", json={
        "device_id": "Sensor-01",
        "payload": "test",
        "signature_b64": "NOT_A_VALID_BASE64_SIGNATURE"
    })
    assert bad_sig_res.status_code == 200
    assert bad_sig_res.get_json()["valid"] is False

def test_packet_forensics_verification(client):
    """Verifies that the /api/security/verify-packet endpoint performs real SHA-256, RSA-PSS, and AES-GCM checks."""
    # 1. Simulate a real secure message
    sim_res = client.post("/api/messages/send", json={
        "sender_id": "Sensor-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Sensor Reading",
        "payload": {"temperature": 85.4, "pressure": 12.1},
        "security_profile": "Authenticated Secure Communication"
    })
    assert sim_res.status_code == 200
    data = sim_res.get_json()
    msg_id = data["message_id"]

    # 2. Verify forensics on the authentic packet
    forensics_res = client.post("/api/security/verify-packet", json={"message_id": msg_id})
    assert forensics_res.status_code == 200
    f_data = forensics_res.get_json()
    assert f_data["success"] is True
    assert f_data["overall_valid"] is True
    assert f_data["integrity"]["matches"] is True
    assert f_data["signature"]["valid"] is True
    assert f_data["authentication"]["valid"] is True
    assert f_data["authorization"]["status"] == "AUTHORIZED"
    assert f_data["rejection_details"]["reason_code"] == "OK_DELIVERED"

    # 3. Safe non-destructive tamper simulation on cloned packet
    tamper_res = client.post("/api/security/verify-packet", json={
        "message_id": msg_id,
        "tamper_options": {
            "active": True,
            "tamper_payload": True,
            "tampered_payload_text": "MALICIOUS_INJECTED_SETPOINT"
        }
    })
    assert tamper_res.status_code == 200
    t_data = tamper_res.get_json()
    assert t_data["overall_valid"] is False
    assert t_data["tamper_simulation"]["detected"] is True
    assert t_data["integrity"]["matches"] is False
    assert "MISMATCH" in t_data["integrity"]["status"]


def test_rsa_modulus_derivation_and_excerpt(client):
    """Verifies that the RSA modulus n is correctly parsed from SubjectPublicKeyInfo DER
    and the 32-byte unsigned big-endian excerpt matches the actual device public key modulus."""
    from cryptography.hazmat.primitives import serialization

    # 1. Fetch public key for a device
    res = client.get("/api/devices/Sensor-01/public-key")
    assert res.status_code == 200
    pem_str = res.get_json()["public_key_pem"]

    # 2. Extract actual modulus n via cryptography library
    pub_key = serialization.load_pem_public_key(pem_str.encode("utf-8"))
    n = pub_key.public_numbers().n
    n_bytes = n.to_bytes((n.bit_length() + 7) // 8, "big")
    assert len(n_bytes) == 256  # 2048-bit RSA key
    expected_first_32_hex = n_bytes[:32].hex()
    expected_first_32_b64 = base64.b64encode(n_bytes[:32]).decode("utf-8")

    # 3. Independently parse ASN.1 DER SubjectPublicKeyInfo to extract modulus n
    clean_b64 = "".join(line for line in pem_str.splitlines() if not line.startswith("-----"))
    der_bytes = base64.b64decode(clean_b64)

    # ASN.1 DER length decoder
    def read_der_len(buf, offset):
        first = buf[offset]
        offset += 1
        if first < 0x80:
            return first, offset
        num_octets = first & 0x7F
        length = 0
        for _ in range(num_octets):
            length = (length << 8) | buf[offset]
            offset += 1
        return length, offset

    pos = 0
    assert der_bytes[pos] == 0x30  # Outer SEQUENCE
    pos += 1
    _, pos = read_der_len(der_bytes, pos)

    assert der_bytes[pos] == 0x30  # AlgorithmIdentifier SEQUENCE
    pos += 1
    alg_len, pos = read_der_len(der_bytes, pos)
    pos += alg_len

    assert der_bytes[pos] == 0x03  # BIT STRING
    pos += 1
    _, pos = read_der_len(der_bytes, pos)
    unused_bits = der_bytes[pos]
    assert unused_bits == 0
    pos += 1

    assert der_bytes[pos] == 0x30  # RSAPublicKey SEQUENCE
    pos += 1
    _, pos = read_der_len(der_bytes, pos)

    assert der_bytes[pos] == 0x02  # INTEGER modulus
    pos += 1
    mod_len, pos = read_der_len(der_bytes, pos)
    parsed_mod_raw = der_bytes[pos:pos + mod_len]

    # Convert to unsigned big-endian byte representation (strip leading 0x00 if present)
    if parsed_mod_raw[0] == 0x00 and len(parsed_mod_raw) > 1:
        parsed_mod = parsed_mod_raw[1:]
    else:
        parsed_mod = parsed_mod_raw

    # Modulus must match actual key modulus exactly
    assert parsed_mod == n_bytes
    assert parsed_mod[:32].hex() == expected_first_32_hex
    assert base64.b64encode(parsed_mod[:32]).decode("utf-8") == expected_first_32_b64

    # 4. Verify rotation updates the modulus and yields a distinct excerpt
    rot_res = client.post("/api/devices/Sensor-01/rotate-keys")
    assert rot_res.status_code == 200
    new_pem_str = rot_res.get_json()["public_key_pem"]
    assert new_pem_str != pem_str

    new_pub_key = serialization.load_pem_public_key(new_pem_str.encode("utf-8"))
    new_n = new_pub_key.public_numbers().n
    new_n_bytes = new_n.to_bytes((new_n.bit_length() + 7) // 8, "big")
    assert new_n_bytes != n_bytes
    assert new_n_bytes[:32].hex() != expected_first_32_hex

def test_plaintext_tampering_simulation_shows_mutated_received_ingress():
    """Verify that tampering during Plaintext (Security Disabled) simulation delivers

    to the receiver, but the received ingress payload accurately reflects the forged value.
    """
    from app.simulation.engine import simulate_industrial_message

    sent_payload = '{"source": "Sensor-01", "temperature": 55.0, "status": "normal"}'
    res = simulate_industrial_message(
        sender_id="Sensor-01",
        receiver_id="PLC-01",
        message_type="Sensor Reading",
        raw_payload=sent_payload,
        security_profile="Security Disabled",
        scenario_id="tampering"
    )

    # Insecure plaintext has no HMAC or digital signatures, so receiver accepts the packet
    assert res["status"] == "Delivered"
    assert res["success"] is True

    # The payload diff must report TAMPERED with distinct mutated ingress payload
    diff = res["payload_diff"]
    assert diff["diff_status"] == "TAMPERED"
    assert diff["is_modified"] is True
    assert diff["decision"] == "Delivered"
    assert "VULNERABILITY EXPLOITED" in diff["reason"]

    # Source sent 55.0, but destination received 60.0
    assert "55.0" in diff["sent"]["payload"]
    assert "60.0" in diff["received"]["payload"]
    assert diff["sent"]["payload"] != diff["received"]["payload"]

    # Tamper differential details
    t_diff = diff["tamper_diff"]
    assert t_diff is not None
    assert t_diff["field"] == "temperature"
    assert t_diff["original_value"] == "55.0"
    assert t_diff["tampered_value"] == "60.0"
    assert t_diff["delta"] == "+5.0"

    # Destination delivery event wire details must also reflect the tampered payload
    dest_ev = res["events"][-1]
    assert dest_ev["packet_state"] == "Delivered"
    assert "60.0" in dest_ev["wire_details"]["raw_payload"]
    assert "Tampered" in dest_ev["security_status"]


# ─── Tests for All 4 Supported Cryptographic Profiles & Forensics ───

def test_profile_plaintext_transmission(client):
    """Verifies that Plaintext Transmission generates no cryptographic metadata,
    and forensics reports all mechanisms as NOT_APPLICABLE.
    """
    sim_res = client.post("/api/messages/send", json={
        "sender_id": "Sensor-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Sensor Reading",
        "payload": {"temp": 24.5, "pressure": 101.3},
        "security_profile": "Plaintext Transmission"
    })
    assert sim_res.status_code == 200
    msg = sim_res.get_json()
    msg_id = msg["message_id"]

    ev = msg["events"][0]["wire_details"]
    assert ev.get("security_profile") == "Plaintext Transmission"
    assert ev.get("nonce") is None
    assert ev.get("tag") is None
    assert ev.get("digest") is None
    assert ev.get("signature") is None
    assert ev.get("ciphertext") is None

    # Verify endpoint
    v_res = client.post("/api/security/verify-packet", json={"message_id": msg_id})
    assert v_res.status_code == 200
    v = v_res.get_json()
    assert v["success"] is True
    assert v["overall_valid"] is True
    assert v["integrity"]["status"] == "NOT_APPLICABLE"
    assert v["signature"]["status"] == "NOT_APPLICABLE"
    assert v["authentication"]["status"] == "NOT_APPLICABLE"


def test_profile_sha256_digest_only(client):
    """Verifies that SHA-256 Digest Only calculates a real digest from canonical plaintext,
    leaves nonce/tag/signature as None (N/A), and independently verifies the hash.
    """
    payload_data = {"sensor": "temp-01", "reading": 42.8}
    sim_res = client.post("/api/messages/send", json={
        "sender_id": "Sensor-01",
        "receiver_id": "PLC-01",
        "message_type": "Sensor Reading",
        "payload": payload_data,
        "security_profile": "SHA-256 Digest Only"
    })
    assert sim_res.status_code == 200
    msg = sim_res.get_json()
    msg_id = msg["message_id"]

    ev = msg["events"][0]["wire_details"]
    assert ev.get("security_profile") == "SHA-256 Digest Only"
    assert ev.get("nonce") is None
    assert ev.get("tag") is None
    assert ev.get("signature") is None
    assert ev.get("ciphertext") is None

    # Independent SHA-256 calculation
    import hashlib
    import json
    canonical_pt = json.dumps(payload_data, sort_keys=True, separators=(',', ':'))
    expected_hash = hashlib.sha256(canonical_pt.encode('utf-8')).hexdigest()
    assert ev.get("digest") == expected_hash

    # Verify endpoint
    v_res = client.post("/api/security/verify-packet", json={"message_id": msg_id})
    assert v_res.status_code == 200
    v = v_res.get_json()
    assert v["success"] is True
    assert v["overall_valid"] is True
    assert v["integrity"]["status"] == "VERIFIED"
    assert v["integrity"]["matches"] is True
    assert v["signature"]["status"] == "NOT_APPLICABLE"
    assert v["authentication"]["status"] == "NOT_APPLICABLE"


def test_profile_aes_256_gcm(client):
    """Verifies that AES-256-GCM generates a real 96-bit nonce, 128-bit auth tag,
    and ciphertext, while digest and signature remain None (N/A).
    Also performs independent AESGCM decryption using the sender's registered key.
    """
    import base64
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from app.database.db import query_db

    payload_data = {"valve_state": "OPEN", "flow_rate": 120.5}
    sim_res = client.post("/api/messages/send", json={
        "sender_id": "PLC-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Device Status",
        "payload": payload_data,
        "security_profile": "AES-256-GCM"
    })
    assert sim_res.status_code == 200
    msg = sim_res.get_json()
    msg_id = msg["message_id"]

    ev = msg["events"][0]["wire_details"]
    assert ev.get("security_profile") == "AES-256-GCM"
    assert ev.get("digest") is None
    assert ev.get("signature") is None

    nonce_b64 = ev.get("nonce")
    tag_b64 = ev.get("tag")
    ct_b64 = ev.get("ciphertext")
    assert nonce_b64 is not None
    assert tag_b64 is not None
    assert ct_b64 is not None

    # Nonce is 96-bit (12 bytes)
    nonce_bytes = base64.b64decode(nonce_b64)
    assert len(nonce_bytes) == 12

    # Tag is 128-bit MAC (16 bytes)
    tag_bytes = base64.b64decode(tag_b64)
    assert len(tag_bytes) == 16

    # Independent AES-GCM Decryption verification
    sender = query_db("SELECT aes_key_hex FROM devices WHERE id = 'PLC-01'", one=True)
    key_bytes = bytes.fromhex(sender["aes_key_hex"])
    aesgcm = AESGCM(key_bytes)
    aad_bytes = ev.get("associated_data", "").encode('utf-8')
    raw_ct = base64.b64decode(ct_b64)
    decrypted_bytes = aesgcm.decrypt(nonce_bytes, raw_ct + tag_bytes, aad_bytes)
    assert "OPEN" in decrypted_bytes.decode('utf-8')

    # Verify endpoint
    v_res = client.post("/api/security/verify-packet", json={"message_id": msg_id})
    assert v_res.status_code == 200
    v = v_res.get_json()
    assert v["success"] is True
    assert v["overall_valid"] is True
    assert v["integrity"]["status"] == "NOT_APPLICABLE"
    assert v["signature"]["status"] == "NOT_APPLICABLE"
    assert v["authentication"]["status"] == "AUTHENTICATED"
    assert v["authentication"]["valid"] is True


def test_profile_full_security_all_four_fields_generated(client):
    """Verifies that AES-256-GCM + RSA-PSS + SHA-256 generates real values for all 4 fields:
    GCM Nonce, Auth Tag, SHA-256 Digest, and RSA-PSS Signature.
    Independently verifies digest, signature, and decryption.
    """
    import base64
    from cryptography.hazmat.primitives import serialization
    from app.database.db import query_db
    from app.security.crypto_engine import rsa_pss_verify_signature

    payload_data = {"cmd": "SETPOINT_UPDATE", "target_psi": 350.0}
    sim_res = client.post("/api/messages/send", json={
        "sender_id": "Sensor-01",
        "receiver_id": "SCADA-Server",
        "message_type": "Sensor Reading",
        "payload": payload_data,
        "security_profile": "AES-256-GCM + RSA-PSS + SHA-256"
    })
    assert sim_res.status_code == 200
    msg = sim_res.get_json()
    msg_id = msg["message_id"]

    ev = msg["events"][0]["wire_details"]
    assert ev.get("security_profile") == "AES-256-GCM + RSA-PSS + SHA-256"

    # All 4 fields must be populated with authentic cryptographic values
    assert ev.get("nonce") is not None
    assert ev.get("tag") is not None
    assert ev.get("digest") is not None
    assert ev.get("signature") is not None
    assert ev.get("ciphertext") is not None

    # Independent RSA-PSS Signature Verification
    sender = query_db("SELECT public_key_pem FROM devices WHERE id = 'Sensor-01'", one=True)
    sig_ok, sig_msg = rsa_pss_verify_signature(ev["digest"], ev["signature"], sender["public_key_pem"])
    assert sig_ok is True, sig_msg

    # Verify endpoint
    v_res = client.post("/api/security/verify-packet", json={"message_id": msg_id})
    assert v_res.status_code == 200
    v = v_res.get_json()
    assert v["success"] is True
    assert v["overall_valid"] is True
    assert v["integrity"]["status"] == "VERIFIED"
    assert v["signature"]["status"] == "VALID"
    assert v["authentication"]["status"] == "AUTHENTICATED"


def test_missing_data_reporting_when_mechanisms_expected(client):
    """Verifies that when a mechanism is enabled in the profile but its data is missing,
    the forensics engine clearly reports MISSING_DATA rather than silently treating it as not applicable.
    """
    # 1. SHA-256 expected, but digest omitted
    res_sha = client.post("/api/security/verify-packet", json={
        "payload": "temperature=50",
        "sender_id": "Sensor-01",
        "receiver_id": "PLC-01",
        "security_profile": "SHA-256 Digest Only",
        "digest": None
    })
    assert res_sha.status_code == 200
    d_sha = res_sha.get_json()
    assert d_sha["overall_valid"] is False
    assert d_sha["integrity"]["status"] == "MISSING_DATA"
    assert d_sha["rejection_details"]["reason_code"] == "ERR_MISSING_DIGEST"

    # 2. AES-GCM expected, but nonce & tag omitted
    res_gcm = client.post("/api/security/verify-packet", json={
        "payload": "speed=3600",
        "sender_id": "Sensor-01",
        "receiver_id": "PLC-01",
        "security_profile": "AES-256-GCM",
        "ciphertext": "some_ciphertext",
        "nonce": None,
        "tag": None
    })
    assert res_gcm.status_code == 200
    d_gcm = res_gcm.get_json()
    assert d_gcm["overall_valid"] is False
    assert d_gcm["authentication"]["status"] == "MISSING_DATA"
    assert d_gcm["rejection_details"]["reason_code"] == "ERR_MISSING_AEAD_DATA"

    # 3. RSA-PSS expected, but signature omitted
    res_rsa = client.post("/api/security/verify-packet", json={
        "payload": "status=NOMINAL",
        "sender_id": "Sensor-01",
        "receiver_id": "PLC-01",
        "security_profile": "AES-256-GCM + RSA-PSS + SHA-256",
        "digest": "abc",
        "ciphertext": "def",
        "nonce": "123",
        "tag": "456",
        "signature": None
    })
    assert res_rsa.status_code == 200
    d_rsa = res_rsa.get_json()
    assert d_rsa["overall_valid"] is False
    assert d_rsa["signature"]["status"] == "MISSING_DATA"
    assert d_rsa["rejection_details"]["reason_code"] == "ERR_MISSING_SIGNATURE"


