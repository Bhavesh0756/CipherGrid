"""Cybersecurity Engine and Scenario Runner API Routes."""
# API Route Documentation:
# - POST /api/security/hash: Computes authentic SHA-256 digest on arbitrary input.
# - POST /api/security/hash/verify: Verifies SHA-256 digest integrity against expected value.
# - POST /api/security/sign: Signs payload using device's real RSA-2048 private key with RSA-PSS.
# - POST /api/security/verify-signature: Verifies signature using device's real public key.
# - POST /api/security/verify: Complete live cryptographic dissection pipeline (AEAD + SHA-256 + RSA-PSS).
# - GET /api/security/scenarios: Lists all 9 industrial test scenarios.
# - POST /api/security/scenarios/<id>/run: Executes scenario and returns real cryptographic evaluation.

import base64
import json
import hashlib
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..simulation.scenarios import list_security_scenarios, run_security_scenario
from ..database.db import query_db, execute_db, get_device_private_key, generate_device_keys
from ..security.crypto_engine import (
    canonicalize_payload,
    compute_sha256_digest,
    verify_sha256_digest,
    aes_gcm_encrypt_payload,
    aes_gcm_decrypt_payload,
    rsa_pss_sign_digest,
    rsa_pss_verify_signature
)

security_bp = Blueprint("security", __name__, url_prefix="/api/security")

@security_bp.route("/hash", methods=["POST"])
def compute_hash_endpoint():
    """Calculates authentic SHA-256 digest of input data using backend crypto engine."""
    data = request.get_json() or {}
    raw_payload = data.get("payload", "")
    canonical = canonicalize_payload(raw_payload)
    digest = compute_sha256_digest(canonical)
    
    return jsonify({
        "success": True,
        "algorithm": "SHA-256",
        "input_length_bytes": len(canonical.encode("utf-8")),
        "canonical_payload": canonical,
        "digest": digest,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@security_bp.route("/hash/verify", methods=["POST"])
def verify_hash_endpoint():
    """Verifies SHA-256 digest integrity on backend using real cryptographic comparison."""
    data = request.get_json() or {}
    raw_payload = data.get("payload", "")
    expected_digest = data.get("expected_digest", "").strip()

    canonical = canonicalize_payload(raw_payload)
    is_valid, msg = verify_sha256_digest(canonical, expected_digest)
    computed = compute_sha256_digest(canonical)

    return jsonify({
        "success": True,
        "valid": is_valid,
        "algorithm": "SHA-256",
        "computed_digest": computed,
        "expected_digest": expected_digest,
        "message": msg
    })

@security_bp.route("/sign", methods=["POST"])
def sign_payload_endpoint():
    """Signs payload with the registered private key of the specified device using RSA-PSS."""
    data = request.get_json() or {}
    device_id = data.get("device_id", "Sensor-01")
    raw_payload = data.get("payload", "")

    dev = query_db("SELECT id, public_key_pem FROM devices WHERE id = ?", (device_id,), one=True)
    if not dev:
        return jsonify({"success": False, "error": f"Device '{device_id}' not found in registry."}), 404

    canonical = canonicalize_payload(raw_payload)
    digest = compute_sha256_digest(canonical)
    priv_key = get_device_private_key(device_id)

    if not priv_key:
        return jsonify({"success": False, "error": f"Could not load cryptographic private key for '{device_id}'."}), 500

    sig_b64 = rsa_pss_sign_digest(digest, priv_key)

    return jsonify({
        "success": True,
        "device_id": device_id,
        "algorithm": "RSA-PSS (2048-bit, SHA-256, MGF1)",
        "digest": digest,
        "signature_b64": sig_b64,
        "public_key_pem": dev.get("public_key_pem")
    })

@security_bp.route("/verify-signature", methods=["POST"])
def verify_signature_endpoint():
    """Cryptographically validates an RSA-PSS signature against the device's public key."""
    data = request.get_json() or {}
    device_id = data.get("device_id")
    raw_payload = data.get("payload", "")
    signature_b64 = data.get("signature_b64", "")
    provided_pub_pem = data.get("public_key_pem")

    pub_pem = provided_pub_pem
    if not pub_pem and device_id:
        dev = query_db("SELECT public_key_pem FROM devices WHERE id = ?", (device_id,), one=True)
        if dev:
            pub_pem = dev.get("public_key_pem")

    if not pub_pem:
        return jsonify({"success": False, "valid": False, "error": "No public key available for verification."}), 400

    canonical = canonicalize_payload(raw_payload)
    digest = compute_sha256_digest(canonical)

    is_valid, msg = rsa_pss_verify_signature(digest, signature_b64, pub_pem)

    return jsonify({
        "success": True,
        "valid": is_valid,
        "message": msg,
        "device_id": device_id,
        "algorithm": "RSA-PSS (2048-bit, SHA-256, MGF1)",
        "digest": digest
    })

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
    """Interactive live cryptographic verification workbench.
    Performs real AES-256-GCM AEAD encryption, real SHA-256 digest generation,
    real RSA-PSS 2048-bit signing, and receiver-side authentic decryption & verification.
    """
    data = request.get_json() or {}
    payload = data.get("payload", "temperature=42.5;pressure=101.3;unit=celsius")
    device_id = data.get("device_id", "Sensor-01")

    dev = query_db("SELECT * FROM devices WHERE id = ?", (device_id,), one=True)
    if not dev:
        dev = query_db("SELECT * FROM devices LIMIT 1", one=True)

    if not dev:
        return jsonify({"success": False, "error": "No virtual devices provisioned in database."}), 404

    aes_key = dev["aes_key_hex"]
    pub_pem = dev["public_key_pem"]
    actual_dev_id = dev["id"]

    # 1. SHA-256 Digest of canonical sender payload
    canonical_sender_payload = canonicalize_payload(payload)
    sender_digest = compute_sha256_digest(canonical_sender_payload)

    # 2. AES-256-GCM AEAD Encryption
    aad = f"dev={actual_dev_id};ts={datetime.now(timezone.utc).isoformat()}"
    enc_res = aes_gcm_encrypt_payload(canonical_sender_payload, aes_key, associated_data=aad)

    # 3. RSA-PSS Digital Signature by sender
    priv_key = get_device_private_key(actual_dev_id)
    sig_b64 = rsa_pss_sign_digest(sender_digest, priv_key) if priv_key else ""

    # Tampering injections (controlled bit-flips in real wire buffers)
    tamper_payload = bool(data.get("tamper_payload", False))
    tamper_ct = bool(data.get("tamper_ciphertext", False))
    tamper_tag = bool(data.get("tamper_tag", False))
    tamper_sig = bool(data.get("tamper_signature", False))

    decrypt_ct = enc_res["ciphertext_b64"]
    decrypt_tag = enc_res["tag_b64"]
    decrypt_sig = sig_b64

    if tamper_ct:
        raw_ct = list(base64.b64decode(decrypt_ct))
        if raw_ct:
            raw_ct[0] ^= 0xFF
            decrypt_ct = base64.b64encode(bytes(raw_ct)).decode('ascii')
        else:
            decrypt_ct = "CORRUPTED_CIPHERTEXT"

    if tamper_tag:
        raw_tag = list(base64.b64decode(decrypt_tag))
        if raw_tag:
            raw_tag[0] ^= 0xFF
            decrypt_tag = base64.b64encode(bytes(raw_tag)).decode('ascii')

    if tamper_sig and decrypt_sig:
        raw_sig = list(base64.b64decode(decrypt_sig))
        if raw_sig:
            raw_sig[0] ^= 0xFF
            decrypt_sig = base64.b64encode(bytes(raw_sig)).decode('ascii')

    # Receiver Decryption Verification
    dec_ok, dec_pt, dec_msg = aes_gcm_decrypt_payload(
        decrypt_ct, enc_res["nonce_b64"], decrypt_tag, aes_key, associated_data=aad
    )

    # Receiver Recomputes SHA-256 Digest from recovered payload (or tampered payload if tested)
    receiver_payload = dec_pt if dec_ok else None
    if tamper_payload and receiver_payload:
        receiver_payload += " [TAMPERED_ANOMALY]"

    receiver_digest = compute_sha256_digest(receiver_payload) if receiver_payload else None
    digest_matches = (sender_digest == receiver_digest) if (receiver_digest and dec_ok and not tamper_payload) else False

    # Receiver Validates RSA-PSS Signature
    digest_to_verify = receiver_digest if receiver_digest else sender_digest
    sig_ok, sig_msg = rsa_pss_verify_signature(digest_to_verify, decrypt_sig, pub_pem) if (pub_pem and decrypt_sig) else (False, "No public key or signature available")

    # Audit log of interactive test
    now = datetime.now(timezone.utc).isoformat()
    overall_status = "SUCCESS" if (dec_ok and sig_ok and digest_matches) else "SECURITY_ALERT"
    execute_db(
        """INSERT INTO audit_logs (timestamp, source_device, event_type, security_result, decision, details_json)
           VALUES (?, ?, 'CRYPTO_WORKBENCH_RUN', ?, ?, ?)""",
        (
            now, actual_dev_id, overall_status,
            "ACCEPTED" if overall_status == "SUCCESS" else "REJECTED",
            json.dumps({
                "payload": payload,
                "tampering": {
                    "payload": tamper_payload,
                    "ciphertext": tamper_ct,
                    "tag": tamper_tag,
                    "signature": tamper_sig
                },
                "decryption_ok": dec_ok,
                "signature_ok": sig_ok,
                "digest_matches": digest_matches
            })
        )
    )

    return jsonify({
        "success": True,
        "payload": payload,
        "device_id": actual_dev_id,
        "device_name": dev.get("name"),
        "tampering_flags": {
            "tamper_payload": tamper_payload,
            "tamper_ciphertext": tamper_ct,
            "tamper_tag": tamper_tag,
            "tamper_signature": tamper_sig
        },
        "digest": {
            "algorithm": "SHA-256",
            "sender_digest": sender_digest,
            "receiver_digest": receiver_digest,
            "matches": digest_matches
        },
        "encryption": {
            "algorithm": "AES-256-GCM AEAD (256-bit)",
            "ciphertext_b64": enc_res["ciphertext_b64"],
            "wire_ciphertext_b64": decrypt_ct,
            "nonce_b64": enc_res["nonce_b64"],
            "tag_b64": enc_res["tag_b64"],
            "wire_tag_b64": decrypt_tag,
            "associated_data": aad,
            "decryption_success": dec_ok,
            "recovered_payload": dec_pt,
            "status_message": dec_msg
        },
        "digital_signature": {
            "algorithm": "RSA-PSS (2048-bit, SHA-256, MGF1)",
            "signature_b64": sig_b64,
            "wire_signature_b64": decrypt_sig,
            "verification_success": sig_ok,
            "status_message": sig_msg
        },
        "pipeline_verdict": {
            "intact": (dec_ok and sig_ok and digest_matches),
            "summary": "Cryptographic assurance verified: authentic origin, confidentially encrypted & unaltered integrity." if (dec_ok and sig_ok and digest_matches) else "Security violation detected: bit alteration or untrusted signature rejected."
        }
    })
