"""Cybersecurity Engine and Scenario Runner API Routes."""
import json
from flask import Blueprint, request, jsonify
from ..simulation.scenarios import list_security_scenarios, run_security_scenario
from ..database.db import query_db, get_device_private_key
from ..security.crypto_engine import (
    compute_sha256_digest,
    verify_sha256_digest,
    aes_gcm_encrypt_payload,
    aes_gcm_decrypt_payload,
    rsa_pss_sign_digest,
    rsa_pss_verify_signature
)

security_bp = Blueprint("security", __name__, url_prefix="/api/security")

@security_bp.route("/scenarios", methods=["GET"])
def get_scenarios():
    """Returns the list of 9 repeatable security test scenarios."""
    scenarios = list_security_scenarios()
    return jsonify({"success": True, "scenarios": scenarios})

@security_bp.route("/scenarios/<scenario_id>/run", methods=["POST"])
def run_scenario(scenario_id):
    """Executes a repeatable security scenario and returns computed Pass/Fail result."""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    try:
        result = run_security_scenario(scenario_id, session_id=session_id)
        return jsonify({"success": True, "result": result})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": f"Scenario execution failed: {str(e)}"}), 500

@security_bp.route("/results", methods=["GET"])
def get_test_results():
    """Retrieves historical security test execution results."""
    limit = int(request.args.get("limit", 20))
    results = query_db("SELECT * FROM security_test_results ORDER BY timestamp DESC LIMIT ?", (limit,))
    for r in results:
        if r.get("checks_executed"):
            try:
                r["checks_executed"] = json.loads(r["checks_executed"])
            except Exception:
                r["checks_executed"] = []
    return jsonify({"success": True, "results": results})

@security_bp.route("/verify", methods=["POST"])
def verify_cryptographic_pipeline():
    """Interactive technical cryptographic verification workbench."""
    data = request.get_json() or {}
    operation = data.get("operation", "encrypt_decrypt") # "encrypt_decrypt", "hash", "sign_verify"
    payload = data.get("payload", "temperature=42.5")
    device_id = data.get("device_id", "Sensor-01")

    dev = query_db("SELECT * FROM devices WHERE id = ?", (device_id,), one=True)
    if not dev:
        dev = query_db("SELECT * FROM devices LIMIT 1", one=True)

    aes_key = dev["aes_key_hex"] if dev else "00" * 32
    pub_pem = dev["public_key_pem"] if dev else None

    # 1. SHA-256 Digest
    digest = compute_sha256_digest(payload)

    # 2. AES-256-GCM AEAD
    enc_res = aes_gcm_encrypt_payload(payload, aes_key, associated_data=f"dev={device_id}")

    # Decryption check (optionally tampered)
    is_tampered = bool(data.get("tamper_ciphertext", False))
    decrypt_ct = "TAMPERED_" + enc_res["ciphertext_b64"][9:] if is_tampered else enc_res["ciphertext_b64"]
    dec_ok, dec_pt, dec_msg = aes_gcm_decrypt_payload(
        decrypt_ct, enc_res["nonce_b64"], enc_res["tag_b64"], aes_key, associated_data=f"dev={device_id}"
    )

    # 3. RSA-PSS Signature
    priv_key = get_device_private_key(device_id) if dev else None
    sig_b64 = rsa_pss_sign_digest(digest, priv_key) if priv_key else None
    
    is_sig_tampered = bool(data.get("tamper_signature", False))
    verify_sig = "CORRUPTED_SIGNATURE_XXXX=" if is_sig_tampered else sig_b64
    sig_ok, sig_msg = rsa_pss_verify_signature(digest, verify_sig, pub_pem) if (pub_pem and verify_sig) else (False, "No public key")

    return jsonify({
        "success": True,
        "payload": payload,
        "device_id": device_id,
        "digest": {
            "algorithm": "SHA-256",
            "hash_hex": digest
        },
        "encryption": {
            "algorithm": "AES-256-GCM",
            "ciphertext_b64": enc_res["ciphertext_b64"],
            "nonce_b64": enc_res["nonce_b64"],
            "tag_b64": enc_res["tag_b64"],
            "associated_data": enc_res["associated_data"],
            "tamper_simulated": is_tampered,
            "decryption_success": dec_ok,
            "recovered_payload": dec_pt,
            "status_message": dec_msg
        },
        "digital_signature": {
            "algorithm": "RSA-PSS (2048-bit, SHA-256, MGF1)",
            "signature_b64": sig_b64,
            "tamper_simulated": is_sig_tampered,
            "verification_success": sig_ok,
            "status_message": sig_msg
        }
    })
