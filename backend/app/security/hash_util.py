"""Cryptographic Hashing Module (Module 2 - Network Security).

Implements real SHA-256 cryptographic hashing via Python hashlib.
Demonstrates deterministic output, one-way pre-image resistance, and the Avalanche Effect.
"""
import hashlib

def sha256_hash(message: str) -> dict:
    """Computes SHA-256 digest of input message."""
    msg_bytes = message.encode('utf-8')
    digest_hex = hashlib.sha256(msg_bytes).hexdigest()
    digest_binary = bin(int(digest_hex, 16))[2:].zfill(256)

    return {
        "algorithm": "SHA-256 (Secure Hash Algorithm 256-bit)",
        "module": "Module 2 - Cryptographic Hash Functions",
        "input_message": message,
        "input_length_bytes": len(msg_bytes),
        "hash_hex": digest_hex,
        "hash_binary": digest_binary,
        "digest_size_bits": 256,
        "digest_size_bytes": 32,
        "key_concepts": {
            "one_way": "Pre-image resistance: computation of original message from hash is computationally infeasible.",
            "collision_resistant": "Infeasible to find two distinct inputs yielding identical hash digests.",
            "deterministic": "Identical inputs always yield the exact same 256-bit digest.",
            "not_encryption": "Hashing is NOT encryption. Hashes cannot be 'decrypted' because original data is irreversibly compressed into a fixed-size digest."
        }
    }

def compare_hashes(message_a: str, message_b: str) -> dict:
    """Compares SHA-256 digests of two messages to demonstrate the Avalanche Effect."""
    res_a = sha256_hash(message_a)
    res_b = sha256_hash(message_b)

    hash_a_hex = res_a["hash_hex"]
    hash_b_hex = res_b["hash_hex"]
    bin_a = res_a["hash_binary"]
    bin_b = res_b["hash_binary"]

    # Compute bit-level differences (Hamming distance)
    differing_bits = sum(c1 != c2 for c1, c2 in zip(bin_a, bin_b))
    avalanche_percentage = round((differing_bits / 256.0) * 100, 2)
    are_identical = (hash_a_hex == hash_b_hex)

    return {
        "message_a": message_a,
        "message_b": message_b,
        "hash_a": hash_a_hex,
        "hash_b": hash_b_hex,
        "are_identical": are_identical,
        "differing_bits": differing_bits,
        "total_bits": 256,
        "avalanche_percentage": avalanche_percentage,
        "avalanche_analysis": (
            "No difference (identical inputs)" if are_identical else
            f"Avalanche Effect demonstrated: A slight variation flipped {differing_bits}/256 bits ({avalanche_percentage}%). "
            "A secure cryptographic hash function flips approximately 50% of the output bits when even a single bit of input changes."
        )
    }
