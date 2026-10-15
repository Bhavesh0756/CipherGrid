"""Comprehensive Test Suite for Industrial SecureSim.

Covers Modules 1, 2, 3, and 4:
- Classical Cryptography (Caesar, Transposition)
- AES-256-GCM AEAD & Tampering Detection
- SHA-256 Hashing & Avalanche Effect
- RSA-2048 Asymmetric Keypair & Hybrid Envelope
- RSA-PSS Digital Signatures & Anti-Tamper Verification
- X.509 Digital Certificates & Local Hostname Validation
- Industrial RBAC & Authorization Rules
- End-to-End REST API Endpoints
"""
import pytest
import os
import json
import base64

# Set test database path before imports
os.environ["DATABASE_PATH"] = "backend/app/database/test_securesim.db"

from app import create_app
from app.database.db import init_db, execute_db
from app.security.classical import caesar_encrypt, caesar_decrypt, transposition_encrypt, transposition_decrypt
from app.security.symmetric import aes_gcm_encrypt, aes_gcm_decrypt, rotate_lab_key
from app.security.hash_util import sha256_hash, compare_hashes
from app.security.asymmetric import generate_new_keypair, hybrid_encrypt_payload, hybrid_decrypt_payload
from app.security.signatures import rsa_pss_sign, rsa_pss_verify
from app.security.certificates import generate_local_x509_certificate, validate_certificate_for_host
from app.security.rbac import evaluate_access
from app.services.device_service import simulate_message, get_device, create_device

@pytest.fixture(scope="session")
def client():
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client
    # Clean up test database if created
    test_db = os.environ.get("DATABASE_PATH")
    if test_db and os.path.exists(test_db):
        try:
            os.remove(test_db)
        except Exception:
            pass

# --- Module 1: Classical Cryptography Tests ---

def test_caesar_cipher():
    plain = "TURBINE_PRESSURE_CRITICAL_450_PSI"
    enc = caesar_encrypt(plain, shift=7)
    dec = caesar_decrypt(enc["ciphertext"], shift=7)
    assert dec["plaintext"] == plain
    assert enc["ciphertext"] != plain
    assert "EDUCATIONAL" in enc["security_note"]

def test_transposition_cipher():
    plain = "VALVE_STATE_OPEN_COOLING_CYCLE"
    enc = transposition_encrypt(plain, key="CYBERKEY")
    dec = transposition_decrypt(enc["ciphertext"], key="CYBERKEY")
    assert dec["plaintext"] == plain
    assert enc["ciphertext"] != plain

# --- Module 2: Modern Symmetric (AES-256-GCM) Tests ---

def test_aes_gcm_encryption_and_decryption():
    msg = "OPERATIONAL_SETPOINT: TEMP=82C, SPEED=3600RPM"
    aad = "device_id=PLC-TURBINE-01"
    enc = aes_gcm_encrypt(msg, associated_data=aad)
    
    assert enc["ciphertext_b64"] != msg
    assert len(enc["nonce_b64"]) > 0
    assert len(enc["tag_b64"]) > 0

    dec = aes_gcm_decrypt(
        ciphertext_b64=enc["ciphertext_b64"],
        nonce_b64=enc["nonce_b64"],
        tag_b64=enc["tag_b64"],
        associated_data=aad,
        custom_key_b64=enc["key_b64"]
    )
    assert dec["success"] is True
    assert dec["plaintext"] == msg
    assert dec["tampered"] is False

def test_aes_gcm_tampering_detection():
    msg = "AUTHORIZE_TURBINE_SHUTDOWN"
    enc = aes_gcm_encrypt(msg, associated_data="seq=101")
    
    # Tamper with ciphertext by altering a base64 character
    raw_ct = list(base64.b64decode(enc["ciphertext_b64"]))
    raw_ct[0] = (raw_ct[0] ^ 0xFF)  # Flip first byte
    tampered_ct_b64 = base64.b64encode(bytes(raw_ct)).decode('ascii')

    dec = aes_gcm_decrypt(
        ciphertext_b64=tampered_ct_b64,
        nonce_b64=enc["nonce_b64"],
        tag_b64=enc["tag_b64"],
        associated_data="seq=101",
        custom_key_b64=enc["key_b64"]
    )
    assert dec["success"] is False
    assert dec["tampered"] is True
    assert dec["error_type"] == "INTEGRITY_VERIFICATION_FAILED"

def test_aes_gcm_aad_tampering_detection():
    msg = "NORMAL_TELEMETRY"
    enc = aes_gcm_encrypt(msg, associated_data="device_id=PLC-TURBINE-01")

    # Decrypt with altered associated data
    dec = aes_gcm_decrypt(
        ciphertext_b64=enc["ciphertext_b64"],
        nonce_b64=enc["nonce_b64"],
        tag_b64=enc["tag_b64"],
        associated_data="device_id=ROUGE-DEVICE-X",
        custom_key_b64=enc["key_b64"]
    )
    assert dec["success"] is False
    assert dec["tampered"] is True

# --- Module 2: SHA-256 Hashing Tests ---

def test_sha256_avalanche_effect():
    msg1 = "SCADA_COMMAND_TRIP_BREAKER_A"
    msg2 = "SCADA_COMMAND_TRIP_BREAKER_B"  # 1 character difference
    
    res = compare_hashes(msg1, msg2)
    assert res["are_identical"] is False
    # Cryptographic hash should flip approximately 30-70% of the 256 bits
    assert 60 <= res["differing_bits"] <= 200
    assert res["avalanche_percentage"] > 25.0

# --- Module 2: RSA & Signatures Tests ---

def test_rsa_keygen_and_hybrid():
    keygen = generate_new_keypair(key_size=2048)
    assert "BEGIN PUBLIC KEY" in keygen["public_key_pem"]

    plain = "CONFIDENTIAL_REACTOR_CORE_TELEMETRY"
    wrapped = hybrid_encrypt_payload(plain)
    assert wrapped["encrypted_session_key_b64"] != ""
    assert wrapped["encrypted_payload_b64"] != ""

    unwrapped = hybrid_decrypt_payload(
        encrypted_session_key_b64=wrapped["encrypted_session_key_b64"],
        nonce_b64=wrapped["nonce_b64"],
        encrypted_payload_b64=wrapped["encrypted_payload_b64"]
    )
    assert unwrapped["success"] is True
    assert unwrapped["decrypted_plaintext"] == plain

def test_rsa_pss_signature_and_tampering():
    msg = "SAFETY_SYSTEM_ACTUATE_EMERGENCY_VENT"
    sig_res = rsa_pss_sign(msg)
    assert sig_res["signature_b64"] != ""

    # Verify original
    verify_res = rsa_pss_verify(msg, sig_res["signature_b64"])
    assert verify_res["valid"] is True
    assert verify_res["tampered"] is False

    # Verify tampered message
    tampered_msg = "SAFETY_SYSTEM_DISABLE_EMERGENCY_VENT"
    tampered_verify = rsa_pss_verify(tampered_msg, sig_res["signature_b64"])
    assert tampered_verify["valid"] is False
    assert tampered_verify["tampered"] is True

# --- Module 2: Digital Certificates Tests ---

def test_x509_certificate():
    cert_res = generate_local_x509_certificate(common_name="localhost")
    assert cert_res["common_name"] == "localhost"
    assert cert_res["is_self_signed"] is True
    assert "BEGIN CERTIFICATE" in cert_res["cert_pem"]

    val_res = validate_certificate_for_host("localhost")
    assert val_res["date_check_passed"] is True
    assert val_res["hostname_check_passed"] is True
    assert val_res["overall_status"] == "VALID_FOR_LOCAL_TLS"

# --- Module 3: Access Control & Industrial RBAC Tests ---

def test_rbac_authorized_permitted_action():
    device = {
        "id": "PLC-TEST-01",
        "status": "Authorized",
        "role": "operator",
        "allowed_actions": ["read_telemetry", "report_status", "set_setpoint"]
    }
    allowed, reason, details = evaluate_access(device, "set_setpoint")
    assert allowed is True
    assert "ACCESS_GRANTED" in reason

def test_rbac_unauthorized_device_rejection():
    device = {
        "id": "ROUGE-DEV-01",
        "status": "Unauthorized",
        "role": "untrusted_sensor",
        "allowed_actions": ["read_telemetry"]
    }
    allowed, reason, details = evaluate_access(device, "read_telemetry")
    assert allowed is False
    assert "DEVICE_UNAUTHORIZED" in reason

def test_rbac_forbidden_privilege_escalation():
    device = {
        "id": "SENSOR-TEMP-01",
        "status": "Authorized",
        "role": "telemetry_node",
        "allowed_actions": ["read_telemetry", "report_status"]
    }
    # Attempting dangerous action not in allowed list
    allowed, reason, details = evaluate_access(device, "emergency_trip")
    assert allowed is False
    assert "ROLE_PERMISSION_DENIED" in reason
    assert details["action_risk"] == "CRITICAL"

# --- Module 4 & Full REST API Integration Tests ---

def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "ONLINE"

def test_api_dashboard_stats(client):
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "total_devices" in data
    assert "messages_processed" in data

def test_api_device_simulation(client):
    # Test valid message simulation
    payload = {"temperature_c": 75.0, "status": "NOMINAL"}
    res = client.post("/api/devices/PLC-TURBINE-01/simulate", json={
        "action": "report_status",
        "payload": payload
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "ACCEPTED"
    assert "security_pipeline" in data
    assert data["security_pipeline"]["symmetric_encryption"]["algorithm"] == "AES-256-GCM"

    # Test rejected privilege escalation
    res2 = client.post("/api/devices/SENSOR-PRESSURE-99/simulate", json={
        "action": "emergency_trip",
        "payload": payload
    })
    assert res2.status_code == 403
    data2 = res2.get_json()
    assert data2["status"] == "REJECTED"

def test_api_live_tls_test(client):
    res = client.post("/api/tls/run-test")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "results" in data
    assert data["results"]["server_handshake"] is True
    assert data["results"]["client_handshake"] is True
    assert data["results"]["tls_version"] in ("TLSv1.3", "TLSv1.2")
