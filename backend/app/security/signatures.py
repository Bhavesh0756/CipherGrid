"""Digital Signatures Module (Module 2 - Network Security).

Implements RSA-PSS (Probabilistic Signature Scheme) digital signatures using SHA-256
and MGF1 via the Python cryptography library.
"""
import base64
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidSignature
from .asymmetric import get_or_create_rsa_keypair

def rsa_pss_sign(message: str) -> dict:
    """Signs an industrial message using the RSA private key with PSS padding."""
    private_key, _ = get_or_create_rsa_keypair()
    
    msg_bytes = message.encode('utf-8')
    signature = private_key.sign(
        msg_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )

    sig_b64 = base64.b64encode(signature).decode('ascii')
    
    return {
        "algorithm": "RSA-PSS (Probabilistic Signature Scheme)",
        "hash_algorithm": "SHA-256",
        "mgf": "MGF1 (Mask Generation Function 1)",
        "message": message,
        "signature_b64": sig_b64,
        "signature_length_bytes": len(signature),
        "security_properties": [
            "Authentication: Proof that message originated from the private key holder.",
            "Integrity: Mathematically guarantees that not a single bit of the message was altered.",
            "Non-Repudiation: The sender cannot deny having authorized the message."
        ]
    }

def rsa_pss_verify(message: str, signature_b64: str) -> dict:
    """Verifies an RSA-PSS digital signature against the public key."""
    _, public_key = get_or_create_rsa_keypair()

    try:
        sig_bytes = base64.b64decode(signature_b64)
    except Exception as e:
        return {
            "valid": False,
            "tampered": True,
            "error_type": "BASE64_DECODE_ERROR",
            "message": f"Malformed signature format: {str(e)}"
        }

    msg_bytes = message.encode('utf-8')

    try:
        public_key.verify(
            sig_bytes,
            msg_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return {
            "valid": True,
            "tampered": False,
            "status": "VALID_SIGNATURE",
            "message": "Signature verified successfully. Origin authentication and data integrity confirmed."
        }
    except InvalidSignature:
        return {
            "valid": False,
            "tampered": True,
            "status": "INVALID_SIGNATURE",
            "error_type": "SIGNATURE_VERIFICATION_FAILED",
            "message": "DIGITAL SIGNATURE VERIFICATION FAILED! The message was tampered with in transit or signed with an unauthorized private key."
        }
    except Exception as e:
        return {
            "valid": False,
            "tampered": True,
            "status": "ERROR",
            "message": f"Verification error: {str(e)}"
        }
