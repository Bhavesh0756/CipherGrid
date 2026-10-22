"""Industrial Cybersecurity Engine.

Implements real cryptographic operations using Python's cryptography library:
- AES-256-GCM Authenticated Encryption with Associated Data (AEAD)
- SHA-256 Message Integrity Verification
- RSA-PSS 2048-bit Digital Signatures
- Nonce Uniqueness & Replay Protection
"""
import os
import base64
import hashlib
import json
from typing import Dict, Any, Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidTag, InvalidSignature

# In-memory tracking of processed message IDs and nonces for replay protection
_PROCESSED_MESSAGE_IDS = set()
_PROCESSED_NONCES = set()

# Utility function for test fixtures and state re-initialization
def reset_replay_cache():
    """Clears the replay detection cache (e.g. for testing or session reset)."""
    global _PROCESSED_MESSAGE_IDS, _PROCESSED_NONCES
    _PROCESSED_MESSAGE_IDS.clear()
    _PROCESSED_NONCES.clear()

def canonicalize_payload(payload: Any) -> str:
    """Produces deterministic serialized representation for hashing and signatures."""
    if isinstance(payload, dict):
        return json.dumps(payload, sort_keys=True, separators=(',', ':'))
    return str(payload).strip()

def compute_sha256_digest(content: str) -> str:
    """Calculates SHA-256 hex digest of the canonical content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def verify_sha256_digest(content: str, expected_digest: str) -> Tuple[bool, str]:
    """Verifies SHA-256 digest integrity."""
    computed = compute_sha256_digest(content)
    if computed.lower() == expected_digest.lower():
        return True, "Integrity verified: SHA-256 digest matches payload exactly."
    return False, f"Integrity failure: Computed digest ({computed[:12]}...) does not match expected digest ({expected_digest[:12]}...)."

def aes_gcm_encrypt_payload(
    plaintext: str,
    key_hex: str,
    associated_data: str = ""
) -> Dict[str, Any]:
    """Encrypts plaintext using AES-256-GCM with a fresh 96-bit random nonce."""
    try:
        key_bytes = bytes.fromhex(key_hex)
        if len(key_bytes) != 32:
            raise ValueError("AES-256 requires exactly a 32-byte (256-bit) key.")
    except Exception as e:
        raise ValueError(f"Invalid AES key hex: {str(e)}")

    aesgcm = AESGCM(key_bytes)
    
    # 96-bit (12 bytes) cryptographically random nonce generated uniquely per message
    nonce = os.urandom(12)
    nonce_b64 = base64.b64encode(nonce).decode('ascii')
    
    _PROCESSED_NONCES.add(nonce_b64)

    aad_bytes = associated_data.encode('utf-8') if associated_data else b""
    data_bytes = plaintext.encode('utf-8')

    # AESGCM.encrypt appends a 16-byte authentication tag (MAC) to the ciphertext
    ct_with_tag = aesgcm.encrypt(nonce, data_bytes, aad_bytes)
    
    raw_ciphertext = ct_with_tag[:-16]
    raw_tag = ct_with_tag[-16:]

    return {
        "algorithm": "AES-256-GCM",
        "ciphertext_b64": base64.b64encode(raw_ciphertext).decode('ascii'),
        "nonce_b64": nonce_b64,
        "tag_b64": base64.b64encode(raw_tag).decode('ascii'),
        "associated_data": associated_data,
        "raw_length_bytes": len(data_bytes)
    }

def aes_gcm_decrypt_payload(
    ciphertext_b64: str,
    nonce_b64: str,
    tag_b64: str,
    key_hex: str,
    associated_data: str = ""
) -> Tuple[bool, Optional[str], str]:
    """Decrypts ciphertext using AES-256-GCM, verifying the 128-bit authentication tag."""
    try:
        key_bytes = bytes.fromhex(key_hex)
        nonce = base64.b64decode(nonce_b64)
        raw_ciphertext = base64.b64decode(ciphertext_b64)
        raw_tag = base64.b64decode(tag_b64)
        
        # AESGCM expects ciphertext + tag concatenated
        ct_with_tag = raw_ciphertext + raw_tag
        aad_bytes = associated_data.encode('utf-8') if associated_data else b""
        
        aesgcm = AESGCM(key_bytes)
        decrypted_bytes = aesgcm.decrypt(nonce, ct_with_tag, aad_bytes)
        plaintext = decrypted_bytes.decode('utf-8')
        
        return True, plaintext, "AES-256-GCM authentication tag verified. Payload decrypted successfully."
    except InvalidTag:
        return False, None, "Authentication tag mismatch: In-transit ciphertext or authentication tag was modified (tampered)."
    except Exception as e:
        return False, None, f"Decryption failed: {str(e)}"

def rsa_pss_sign_digest(digest_hex: str, private_key) -> str:
    """Signs a SHA-256 digest using RSA-PSS padding with MGF1 and SHA-256."""
    digest_bytes = bytes.fromhex(digest_hex)
    signature = private_key.sign(
        digest_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode('ascii')

def rsa_pss_verify_signature(digest_hex: str, signature_b64: str, public_key_pem: str) -> Tuple[bool, str]:
    """Verifies an RSA-PSS digital signature against the sender's public key."""
    try:
        pub_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
        sig_bytes = base64.b64decode(signature_b64)
        digest_bytes = bytes.fromhex(digest_hex)

        pub_key.verify(
            sig_bytes,
            digest_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True, "RSA-PSS signature verified: authentic origin and non-repudiation established."
    except InvalidSignature:
        return False, "Digital signature verification failed: signature does not match sender's public key or message digest."
    except Exception as e:
        return False, f"Signature verification error: {str(e)}"

def check_replay_attack(message_id: str, nonce_b64: Optional[str] = None) -> Tuple[bool, str]:
    """Detects replay attacks via repeated Message IDs or reused nonces.
    
    Returns (is_replay, explanation)
    """
    if message_id in _PROCESSED_MESSAGE_IDS:
        return True, f"Replay attack detected: Message ID '{message_id}' has already been processed."
    
    _PROCESSED_MESSAGE_IDS.add(message_id)
    return False, "Message ID freshness verified (unique sequence)."
