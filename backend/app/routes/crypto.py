"""Cryptography Lab API Endpoints."""
from flask import Blueprint, request, jsonify
from ..services.crypto_service import (
    run_caesar, run_transposition,
    run_aes_encrypt, run_aes_decrypt, rotate_lab_key,
    run_sha256, run_sha256_compare,
    run_rsa_keygen, get_public_key_pem, hybrid_encrypt_payload, hybrid_decrypt_payload,
    run_rsa_sign, run_rsa_verify,
    run_cert_generate, run_cert_inspect, run_cert_validate
)

crypto_bp = Blueprint("crypto", __name__, url_prefix="/api/crypto")

# --- Classical Cryptography (Module 1) ---

@crypto_bp.route("/classical/caesar", methods=["POST"])
def api_caesar():
    data = request.get_json() or {}
    text = data.get("text", "")
    shift = int(data.get("shift", 3))
    decrypt = bool(data.get("decrypt", False))
    if not text:
        return jsonify({"success": False, "error": "Plaintext/Ciphertext cannot be empty."}), 400
    res = run_caesar(text, shift, decrypt)
    return jsonify({"success": True, **res})

@crypto_bp.route("/classical/transposition", methods=["POST"])
def api_transposition():
    data = request.get_json() or {}
    text = data.get("text", "")
    key = data.get("key", "SECURE")
    decrypt = bool(data.get("decrypt", False))
    if not text:
        return jsonify({"success": False, "error": "Text cannot be empty."}), 400
    res = run_transposition(text, key, decrypt)
    return jsonify({"success": True, **res})

# --- Modern Symmetric Cryptography - AES-GCM (Module 2) ---

@crypto_bp.route("/aes/encrypt", methods=["POST"])
def api_aes_encrypt():
    data = request.get_json() or {}
    plaintext = data.get("plaintext", "")
    associated_data = data.get("associated_data", "")
    if not plaintext:
        return jsonify({"success": False, "error": "Plaintext message cannot be empty."}), 400
    res = run_aes_encrypt(plaintext, associated_data)
    return jsonify({"success": True, **res})

@crypto_bp.route("/aes/decrypt", methods=["POST"])
def api_aes_decrypt():
    data = request.get_json() or {}
    ciphertext_b64 = data.get("ciphertext_b64", "")
    nonce_b64 = data.get("nonce_b64", "")
    tag_b64 = data.get("tag_b64", "")
    associated_data = data.get("associated_data", "")
    key_b64 = data.get("key_b64", None)

    if not ciphertext_b64 or not nonce_b64:
        return jsonify({"success": False, "error": "Ciphertext and Nonce are required."}), 400

    res = run_aes_decrypt(ciphertext_b64, nonce_b64, tag_b64, associated_data, key_b64)
    status_code = 200 if res.get("success") else 400
    return jsonify(res), status_code

@crypto_bp.route("/aes/rotate-key", methods=["POST"])
def api_aes_rotate():
    masked = rotate_lab_key()
    return jsonify({"success": True, "message": "AES key rotated.", "key_preview": masked})

# --- Cryptographic Hash Functions - SHA-256 (Module 2) ---

@crypto_bp.route("/hash/sha256", methods=["POST"])
def api_sha256():
    data = request.get_json() or {}
    message = data.get("message", "")
    res = run_sha256(message)
    return jsonify({"success": True, **res})

@crypto_bp.route("/hash/compare", methods=["POST"])
def api_sha256_compare():
    data = request.get_json() or {}
    msg_a = data.get("message_a", "")
    msg_b = data.get("message_b", "")
    res = run_sha256_compare(msg_a, msg_b)
    return jsonify({"success": True, **res})

# --- Asymmetric Cryptography - RSA (Module 2) ---

@crypto_bp.route("/rsa/keygen", methods=["POST"])
def api_rsa_keygen():
    data = request.get_json() or {}
    key_size = int(data.get("key_size", 2048))
    if key_size not in (2048, 3072, 4096):
        key_size = 2048
    res = run_rsa_keygen(key_size)
    return jsonify({"success": True, **res})

@crypto_bp.route("/rsa/public-key", methods=["GET"])
def api_rsa_public_key():
    pem = get_public_key_pem()
    return jsonify({"success": True, "public_key_pem": pem, "algorithm": "RSA-2048 (PKCS#8 SubjectPublicKeyInfo)"})

@crypto_bp.route("/rsa/hybrid-encrypt", methods=["POST"])
def api_hybrid_encrypt():
    data = request.get_json() or {}
    plaintext = data.get("plaintext", "")
    if not plaintext:
        return jsonify({"success": False, "error": "Plaintext cannot be empty."}), 400
    res = hybrid_encrypt_payload(plaintext)
    return jsonify({"success": True, **res})

@crypto_bp.route("/rsa/hybrid-decrypt", methods=["POST"])
def api_hybrid_decrypt():
    data = request.get_json() or {}
    session_key_b64 = data.get("encrypted_session_key_b64", "")
    nonce_b64 = data.get("nonce_b64", "")
    payload_b64 = data.get("encrypted_payload_b64", "")

    if not session_key_b64 or not nonce_b64 or not payload_b64:
        return jsonify({"success": False, "error": "Missing envelope parameters."}), 400

    res = hybrid_decrypt_payload(session_key_b64, nonce_b64, payload_b64)
    status_code = 200 if res.get("success") else 400
    return jsonify(res), status_code

# --- Digital Signatures - RSA-PSS (Module 2) ---

@crypto_bp.route("/signatures/sign", methods=["POST"])
def api_sign():
    data = request.get_json() or {}
    message = data.get("message", "")
    if not message:
        return jsonify({"success": False, "error": "Message cannot be empty."}), 400
    res = run_rsa_sign(message)
    return jsonify({"success": True, **res})

@crypto_bp.route("/signatures/verify", methods=["POST"])
def api_verify():
    data = request.get_json() or {}
    message = data.get("message", "")
    signature_b64 = data.get("signature_b64", "")
    if not message or not signature_b64:
        return jsonify({"success": False, "error": "Both message and signature_b64 are required."}), 400
    res = run_rsa_verify(message, signature_b64)
    status_code = 200 if res.get("valid") else 400
    return jsonify(res), status_code

# --- Digital Certificates - X.509 (Module 2) ---

@crypto_bp.route("/certificates/generate", methods=["POST"])
def api_cert_generate():
    data = request.get_json() or {}
    common_name = data.get("common_name", "localhost")
    organization = data.get("organization", "Industrial SecureSim SCADA Lab")
    res = run_cert_generate(common_name, organization)
    return jsonify({"success": True, **res})

@crypto_bp.route("/certificates/inspect", methods=["GET"])
def api_cert_inspect():
    res = run_cert_inspect()
    return jsonify({"success": True, **res})

@crypto_bp.route("/certificates/validate", methods=["POST"])
def api_cert_validate():
    data = request.get_json() or {}
    hostname = data.get("hostname", "localhost")
    res = run_cert_validate(hostname)
    return jsonify({"success": True, **res})
