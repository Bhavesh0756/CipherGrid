"""Asymmetric Cryptography Module (Module 2 - Network Security).

Implements RSA-2048 key-pair generation, PEM formatting, and modern Hybrid Cryptography
(Key Encapsulation via RSA-OAEP + AES-GCM bulk data encryption).
"""
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

_SERVER_PRIVATE_KEY = None
_SERVER_PUBLIC_KEY = None

def get_or_create_rsa_keypair(key_size: int = 2048):
    """Retrieves or creates active RSA keypair with standard secure exponent e=65537."""
    global _SERVER_PRIVATE_KEY, _SERVER_PUBLIC_KEY
    if _SERVER_PRIVATE_KEY is None:
        _SERVER_PRIVATE_KEY = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size
        )
        _SERVER_PUBLIC_KEY = _SERVER_PRIVATE_KEY.public_key()
    return _SERVER_PRIVATE_KEY, _SERVER_PUBLIC_KEY

def generate_new_keypair(key_size: int = 2048) -> dict:
    """Explicitly generates a fresh RSA-2048 key pair."""
    global _SERVER_PRIVATE_KEY, _SERVER_PUBLIC_KEY
    _SERVER_PRIVATE_KEY = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size
    )
    _SERVER_PUBLIC_KEY = _SERVER_PRIVATE_KEY.public_key()

    public_pem = _SERVER_PUBLIC_KEY.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    # Security rule: Never expose the private key by default.
    # We display a safe cryptographic summary.
    return {
        "algorithm": "RSA (Rivest-Shamir-Adleman)",
        "key_size_bits": key_size,
        "public_exponent": 65537,
        "public_key_pem": public_pem,
        "private_key_status": "PROTECTED_SERVER_SIDE",
        "key_security_note": "Private key is maintained securely in server memory and excluded from public API responses to adhere to the Principle of Least Privilege and safe key management.",
        "hybrid_note": "In modern Network Security, RSA is used for digital signatures and key encapsulation (encrypting small symmetric session keys), while symmetric AES-GCM is used for high-throughput bulk industrial telemetry."
    }

def get_public_key_pem() -> str:
    """Returns the current server public key in PEM format."""
    _, public_key = get_or_create_rsa_keypair()
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

def hybrid_encrypt_payload(plaintext: str) -> dict:
    """Demonstrates Hybrid Encryption (Envelope Encryption):
    
    1. Generates ephemeral 256-bit AES key.
    2. Encrypts industrial payload using AES-GCM.
    3. Encrypts ephemeral AES key using RSA-2048 Public Key with OAEP padding.
    """
    _, public_key = get_or_create_rsa_keypair()

    # Step 1: Generate ephemeral AES session key
    session_key = AESGCM.generate_key(bit_length=256)
    
    # Step 2: Encrypt bulk plaintext with AES-GCM
    aesgcm = AESGCM(session_key)
    nonce = os.urandom(12)
    aad = b"protocol=HYBRID-ICS-V1"
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), aad)

    # Step 3: Encrypt the session key with RSA-OAEP
    encrypted_session_key = public_key.encrypt(
        session_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    return {
        "algorithm": "Hybrid Asymmetric-Symmetric Cryptosystem (RSA-OAEP-2048 + AES-256-GCM)",
        "module": "Module 2 - Asymmetric Key Encapsulation",
        "encrypted_session_key_b64": base64.b64encode(encrypted_session_key).decode('ascii'),
        "nonce_b64": base64.b64encode(nonce).decode('ascii'),
        "encrypted_payload_b64": base64.b64encode(ciphertext_with_tag).decode('ascii'),
        "associated_data": "protocol=HYBRID-ICS-V1",
        "workflow": [
            "1. Client generates ephemeral 256-bit AES session key.",
            "2. Client encrypts bulk industrial message with AES-256-GCM (high speed, authenticated).",
            "3. Client wraps the 32-byte AES key using Server's RSA-2048 Public Key (RSA-OAEP-SHA256).",
            "4. Combined envelope is transmitted over untrusted channel."
        ]
    }

def hybrid_decrypt_payload(encrypted_session_key_b64: str, nonce_b64: str, encrypted_payload_b64: str) -> dict:
    """Decrypts a hybrid envelope using Server's RSA private key and ephemeral AES key."""
    private_key, _ = get_or_create_rsa_keypair()

    try:
        enc_session_key = base64.b64decode(encrypted_session_key_b64)
        nonce = base64.b64decode(nonce_b64)
        ct_with_tag = base64.b64decode(encrypted_payload_b64)
    except Exception as e:
        return {"success": False, "error": f"Base64 decoding failed: {str(e)}"}

    try:
        # Step 1: Decrypt session key using RSA private key
        session_key = private_key.decrypt(
            enc_session_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # Step 2: Decrypt payload using AES-GCM
        aesgcm = AESGCM(session_key)
        aad = b"protocol=HYBRID-ICS-V1"
        decrypted_bytes = aesgcm.decrypt(nonce, ct_with_tag, aad)

        return {
            "success": True,
            "decrypted_plaintext": decrypted_bytes.decode('utf-8'),
            "session_key_recovered": True,
            "message": "Envelope unwrapped successfully: Session key decrypted via RSA-OAEP, payload decrypted via AES-GCM."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Hybrid decryption failed: {str(e)}"
        }
