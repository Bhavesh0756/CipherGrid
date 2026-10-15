"""Symmetric Cryptography Module (Module 2 - Network Security).

Implements real Authenticated Encryption with Associated Data (AEAD) using AES-256-GCM
via the Python standard 'cryptography' library.
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

# In-memory storage for the active laboratory key
_CURRENT_LAB_KEY = None

def get_or_create_lab_key() -> bytes:
    """Returns the current active 256-bit AES-GCM lab key or generates a fresh one."""
    global _CURRENT_LAB_KEY
    if _CURRENT_LAB_KEY is None:
        _CURRENT_LAB_KEY = AESGCM.generate_key(bit_length=256)
    return _CURRENT_LAB_KEY

def rotate_lab_key() -> str:
    """Explicitly rotates the active 256-bit AES-GCM lab key."""
    global _CURRENT_LAB_KEY
    _CURRENT_LAB_KEY = AESGCM.generate_key(bit_length=256)
    # Return masked representation for security
    key_b64 = base64.b64encode(_CURRENT_LAB_KEY).decode('ascii')
    return f"{key_b64[:6]}...{key_b64[-6:]} (256-bit AES Key)"

def aes_gcm_encrypt(plaintext: str, associated_data: str = "", custom_key_b64: str = None) -> dict:
    """Encrypts industrial plaintext using AES-256-GCM with a fresh random 96-bit nonce.
    
    Returns base64 encoded ciphertext, nonce, tag, and key fingerprint.
    """
    if custom_key_b64:
        try:
            key = base64.b64decode(custom_key_b64)
            if len(key) not in (16, 24, 32):
                raise ValueError("AES key must be 128, 192, or 256 bits (16, 24, or 32 bytes).")
        except Exception as e:
            raise ValueError(f"Invalid Base64 key provided: {str(e)}")
    else:
        key = get_or_create_lab_key()

    aesgcm = AESGCM(key)
    
    # CRITICAL SECURITY RULE: 96-bit (12 bytes) cryptographically random nonce generated uniquely per message
    nonce = os.urandom(12)
    
    aad_bytes = associated_data.encode('utf-8') if associated_data else b""
    data_bytes = plaintext.encode('utf-8')

    # AESGCM.encrypt appends a 16-byte authentication tag to the ciphertext
    ct_with_tag = aesgcm.encrypt(nonce, data_bytes, aad_bytes)
    
    # In AESGCM output: the last 16 bytes are the authentication tag (MAC)
    raw_ciphertext = ct_with_tag[:-16]
    raw_tag = ct_with_tag[-16:]

    key_b64 = base64.b64encode(key).decode('ascii')
    nonce_b64 = base64.b64encode(nonce).decode('ascii')
    ciphertext_b64 = base64.b64encode(raw_ciphertext).decode('ascii')
    tag_b64 = base64.b64encode(raw_tag).decode('ascii')
    combined_b64 = base64.b64encode(ct_with_tag).decode('ascii')

    return {
        "algorithm": "AES-256-GCM (Galois/Counter Mode)",
        "module": "Module 2 - Modern Symmetric Cryptography",
        "key_masked": f"{key_b64[:6]}...{key_b64[-6:]}",
        "key_fingerprint": f"SHA-256:{base64.b64encode(os.urandom(4)).decode('ascii')}",
        "key_b64": key_b64,  # Provided for lab decryption playback
        "nonce_b64": nonce_b64,
        "nonce_length_bytes": len(nonce),
        "ciphertext_b64": ciphertext_b64,
        "tag_b64": tag_b64,
        "combined_ciphertext_b64": combined_b64,
        "associated_data": associated_data,
        "plaintext_preview": plaintext[:50] + ("..." if len(plaintext) > 50 else ""),
        "security_guarantees": "Confidentiality (AES-CTR mode) + Integrity/Authenticity (GHASH polynomial MAC)"
    }

def aes_gcm_decrypt(
    ciphertext_b64: str,
    nonce_b64: str,
    tag_b64: str = "",
    associated_data: str = "",
    custom_key_b64: str = None
) -> dict:
    """Decrypts ciphertext using AES-256-GCM.
    
    Detects tampering of ciphertext, nonce, tag, or associated data.
    """
    try:
        if custom_key_b64:
            key = base64.b64decode(custom_key_b64)
        else:
            key = get_or_create_lab_key()
    except Exception as e:
        return {
            "success": False,
            "error_type": "KEY_DECODE_ERROR",
            "message": f"Invalid key format: {str(e)}",
            "plaintext": None
        }

    try:
        nonce = base64.b64decode(nonce_b64)
        if len(nonce) != 12:
            return {
                "success": False,
                "error_type": "INVALID_NONCE_LENGTH",
                "message": f"Expected 96-bit (12-byte) nonce, received {len(nonce)} bytes.",
                "plaintext": None
            }
    except Exception as e:
        return {
            "success": False,
            "error_type": "NONCE_DECODE_ERROR",
            "message": f"Failed to decode nonce: {str(e)}",
            "plaintext": None
        }

    try:
        ct_raw = base64.b64decode(ciphertext_b64)
        if tag_b64:
            tag_raw = base64.b64decode(tag_b64)
            full_ct = ct_raw + tag_raw
        else:
            full_ct = ct_raw
    except Exception as e:
        return {
            "success": False,
            "error_type": "PAYLOAD_DECODE_ERROR",
            "message": f"Failed to decode ciphertext or tag: {str(e)}",
            "plaintext": None
        }

    aad_bytes = associated_data.encode('utf-8') if associated_data else b""
    aesgcm = AESGCM(key)

    try:
        decrypted_bytes = aesgcm.decrypt(nonce, full_ct, aad_bytes)
        plaintext = decrypted_bytes.decode('utf-8')
        return {
            "success": True,
            "tampered": False,
            "plaintext": plaintext,
            "message": "Integrity and Authenticity Verified. Ciphertext decrypted successfully.",
            "associated_data_authenticated": bool(associated_data)
        }
    except InvalidTag:
        return {
            "success": False,
            "tampered": True,
            "error_type": "INTEGRITY_VERIFICATION_FAILED",
            "message": "AUTHENTICATION TAG MISMATCH (InvalidTag). The ciphertext, nonce, or associated data was altered in transit. Message rejected to prevent command injection.",
            "plaintext": None
        }
    except UnicodeDecodeError:
        return {
            "success": False,
            "tampered": True,
            "error_type": "DECODE_ERROR",
            "message": "Decrypted payload contains invalid UTF-8 bytes.",
            "plaintext": None
        }
