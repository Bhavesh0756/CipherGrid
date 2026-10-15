"""Cryptography Lab Service.

Coordinates cryptographic experiments and records educational audit events.
"""
from ..security.classical import caesar_encrypt, caesar_decrypt, transposition_encrypt, transposition_decrypt
from ..security.symmetric import aes_gcm_encrypt, aes_gcm_decrypt, rotate_lab_key
from ..security.hash_util import sha256_hash, compare_hashes
from ..security.asymmetric import generate_new_keypair, get_public_key_pem, hybrid_encrypt_payload, hybrid_decrypt_payload
from ..security.signatures import rsa_pss_sign, rsa_pss_verify
from ..security.certificates import generate_local_x509_certificate, inspect_current_certificate, validate_certificate_for_host
from .log_service import record_event

def run_caesar(plaintext: str, shift: int, decrypt: bool = False) -> dict:
    if decrypt:
        res = caesar_decrypt(plaintext, shift)
    else:
        res = caesar_encrypt(plaintext, shift)
    return res

def run_transposition(text: str, key: str, decrypt: bool = False) -> dict:
    if decrypt:
        res = transposition_decrypt(text, key)
    else:
        res = transposition_encrypt(text, key)
    return res

def run_aes_encrypt(plaintext: str, associated_data: str = "") -> dict:
    res = aes_gcm_encrypt(plaintext, associated_data)
    record_event(
        event_type="AES_GCM_ENCRYPT",
        severity="INFO",
        device_id="CRYPTO_LAB",
        action="ENCRYPT_AEAD",
        result="SUCCESS",
        message=f"AES-256-GCM encryption performed ({len(plaintext)} chars). Nonce & Auth Tag generated.",
        details={"nonce_sample": res["nonce_b64"], "tag_sample": res["tag_b64"]}
    )
    return res

def run_aes_decrypt(ciphertext_b64: str, nonce_b64: str, tag_b64: str = "", associated_data: str = "", key_b64: str = None) -> dict:
    res = aes_gcm_decrypt(ciphertext_b64, nonce_b64, tag_b64, associated_data, key_b64)
    if res.get("tampered"):
        record_event(
            event_type="AES_GCM_DECRYPT_TAMPER",
            severity="CRITICAL",
            device_id="CRYPTO_LAB",
            action="DECRYPT_AEAD",
            result="FAILURE",
            message="AES-GCM integrity check failed: Authentication Tag mismatch detected (Tampering alert).",
            details={"error_type": res.get("error_type")}
        )
    else:
        record_event(
            event_type="AES_GCM_DECRYPT_SUCCESS",
            severity="INFO",
            device_id="CRYPTO_LAB",
            action="DECRYPT_AEAD",
            result="SUCCESS",
            message="AES-GCM payload decrypted and authentication tag verified.",
            details={"associated_data_authenticated": res.get("associated_data_authenticated")}
        )
    return res

def run_sha256(message: str) -> dict:
    return sha256_hash(message)

def run_sha256_compare(message_a: str, message_b: str) -> dict:
    return compare_hashes(message_a, message_b)

def run_rsa_keygen(key_size: int = 2048) -> dict:
    res = generate_new_keypair(key_size)
    record_event(
        event_type="RSA_KEY_GENERATED",
        severity="INFO",
        device_id="CRYPTO_LAB",
        action="KEYGEN",
        result="SUCCESS",
        message=f"Fresh RSA-{key_size} keypair generated. Public key exported to PEM format.",
        details={"key_size": key_size}
    )
    return res

def run_rsa_sign(message: str) -> dict:
    res = rsa_pss_sign(message)
    record_event(
        event_type="SIGNATURE_GENERATED",
        severity="INFO",
        device_id="CRYPTO_LAB",
        action="SIGN_PSS",
        result="SUCCESS",
        message="RSA-PSS digital signature computed for industrial telemetry payload.",
        details={"sig_sample": res["signature_b64"][:20] + "..."}
    )
    return res

def run_rsa_verify(message: str, signature_b64: str) -> dict:
    res = rsa_pss_verify(message, signature_b64)
    if res.get("valid"):
        record_event(
            event_type="SIGNATURE_VERIFIED",
            severity="INFO",
            device_id="CRYPTO_LAB",
            action="VERIFY_PSS",
            result="SUCCESS",
            message="RSA-PSS digital signature verification SUCCESS. Origin and integrity confirmed.",
            details={"status": res.get("status")}
        )
    else:
        record_event(
            event_type="SIGNATURE_REJECTED",
            severity="CRITICAL",
            device_id="CRYPTO_LAB",
            action="VERIFY_PSS",
            result="FAILURE",
            message="RSA-PSS signature verification FAILED. Payload was altered or signature invalid.",
            details={"error_type": res.get("error_type")}
        )
    return res

def run_cert_generate(common_name: str = "localhost", organization: str = "Industrial SecureSim SCADA Lab") -> dict:
    res = generate_local_x509_certificate(common_name, organization)
    record_event(
        event_type="CERTIFICATE_GENERATED",
        severity="INFO",
        device_id="CRYPTO_LAB",
        action="GENERATE_X509",
        result="SUCCESS",
        message=f"Self-signed X.509 certificate generated for host '{common_name}'.",
        details={"serial": res["serial_number"], "sha256_fp": res["sha256_fingerprint"]}
    )
    return res

def run_cert_inspect() -> dict:
    return inspect_current_certificate()

def run_cert_validate(expected_host: str = "localhost") -> dict:
    res = validate_certificate_for_host(expected_host)
    record_event(
        event_type="CERTIFICATE_VALIDATED",
        severity="INFO" if res["overall_status"] == "VALID_FOR_LOCAL_TLS" else "WARNING",
        device_id="CRYPTO_LAB",
        action="VALIDATE_X509",
        result="SUCCESS" if res["overall_status"] == "VALID_FOR_LOCAL_TLS" else "FAILURE",
        message=f"X.509 certificate validation result for host '{expected_host}': {res['overall_status']}.",
        details=res["verification_details"]
    )
    return res
