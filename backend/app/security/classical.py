"""Classical Cryptography Module (Module 1 - Network Security).

Implements Caesar Cipher and Columnar Transposition Cipher for educational
demonstration purposes. Clearly identifies security shortcomings.
"""
import math

def caesar_encrypt(plaintext: str, shift: int) -> dict:
    """Encrypts plaintext using Caesar cipher with given shift (1-25)."""
    shift = shift % 26
    ciphertext = []
    for char in plaintext:
        if 'a' <= char <= 'z':
            ciphertext.append(chr((ord(char) - ord('a') + shift) % 26 + ord('a')))
        elif 'A' <= char <= 'Z':
            ciphertext.append(chr((ord(char) - ord('A') + shift) % 26 + ord('A')))
        else:
            ciphertext.append(char)
    result_text = "".join(ciphertext)
    return {
        "algorithm": "Caesar Cipher (Shift Cipher)",
        "module": "Module 1 - Classical Cryptography",
        "shift": shift,
        "plaintext": plaintext,
        "ciphertext": result_text,
        "security_note": "EDUCATIONAL DEMONSTRATION ONLY. Key space is only 25 possible shifts, making it trivially vulnerable to brute-force attack and frequency analysis."
    }

def caesar_decrypt(ciphertext: str, shift: int) -> dict:
    """Decrypts ciphertext using Caesar cipher with given shift."""
    shift = shift % 26
    plaintext = []
    for char in ciphertext:
        if 'a' <= char <= 'z':
            plaintext.append(chr((ord(char) - ord('a') - shift) % 26 + ord('a')))
        elif 'A' <= char <= 'Z':
            plaintext.append(chr((ord(char) - ord('A') - shift) % 26 + ord('A')))
        else:
            plaintext.append(char)
    result_text = "".join(plaintext)
    return {
        "algorithm": "Caesar Cipher (Shift Cipher)",
        "module": "Module 1 - Classical Cryptography",
        "shift": shift,
        "ciphertext": ciphertext,
        "plaintext": result_text,
        "security_note": "EDUCATIONAL DEMONSTRATION ONLY. Not secure for modern industrial communications."
    }

def transposition_encrypt(plaintext: str, key: str) -> dict:
    """Encrypts plaintext using Columnar Transposition Cipher with a text key."""
    if not key:
        key = "SECURE"
    clean_key = "".join([c.upper() for c in key if c.isalnum()])
    if not clean_key:
        clean_key = "SECURE"

    num_cols = len(clean_key)
    num_rows = math.ceil(len(plaintext) / num_cols)
    
    # Pad plaintext with spaces or null chars up to grid size
    grid = [''] * num_cols
    for col in range(num_cols):
        pointer = col
        while pointer < len(plaintext):
            grid[col] += plaintext[pointer]
            pointer += num_cols

    # Sort columns based on alphabetical order of key characters
    sorted_key_indices = sorted(range(len(clean_key)), key=lambda k: clean_key[k])
    
    ciphertext = "".join(grid[idx] for idx in sorted_key_indices)
    return {
        "algorithm": "Columnar Transposition Cipher",
        "module": "Module 1 - Classical Cryptography",
        "key": clean_key,
        "key_length": num_cols,
        "grid_rows": num_rows,
        "plaintext": plaintext,
        "ciphertext": ciphertext,
        "security_note": "EDUCATIONAL DEMONSTRATION ONLY. Rearranges character positions without altering identity. Vulnerable to anagramming and multiple anagram analysis."
    }

def transposition_decrypt(ciphertext: str, key: str) -> dict:
    """Decrypts ciphertext using Columnar Transposition Cipher with a text key."""
    if not key:
        key = "SECURE"
    clean_key = "".join([c.upper() for c in key if c.isalnum()])
    if not clean_key:
        clean_key = "SECURE"

    num_cols = len(clean_key)
    num_rows = math.ceil(len(ciphertext) / num_cols)
    num_shaded_boxes = (num_cols * num_rows) - len(ciphertext)

    # Reconstruct columns
    sorted_key_indices = sorted(range(len(clean_key)), key=lambda k: clean_key[k])
    
    # Calculate column lengths
    col_lengths = [num_rows] * num_cols
    for i in range(num_cols - num_shaded_boxes, num_cols):
        col_lengths[i] = num_rows - 1

    # Extract columns in sorted order
    cols = [''] * num_cols
    current_idx = 0
    for idx in sorted_key_indices:
        length = col_lengths[idx]
        cols[idx] = ciphertext[current_idx:current_idx + length]
        current_idx += length

    # Read row-by-row
    plaintext = []
    for r in range(num_rows):
        for c in range(num_cols):
            if r < len(cols[c]):
                plaintext.append(cols[c][r])

    result_text = "".join(plaintext)
    return {
        "algorithm": "Columnar Transposition Cipher",
        "module": "Module 1 - Classical Cryptography",
        "key": clean_key,
        "ciphertext": ciphertext,
        "plaintext": result_text,
        "security_note": "EDUCATIONAL DEMONSTRATION ONLY. Classical transposition does not provide modern computational security."
    }
