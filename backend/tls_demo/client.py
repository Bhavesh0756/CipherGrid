"""Local TLS 1.3 / 1.2 Industrial Client.

Runs a standalone secure TLS client using Python's standard `ssl` and `socket` modules.
Demonstrates:
- Client certificate authority trust configuration (`cafile=server_cert.pem`)
- Strict hostname verification (`check_hostname=True`, server_hostname='localhost')
- Mutual cryptographic handshake negotiation
- Encrypted industrial frame transmission and response inspection
"""
import ssl
import socket
import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
CERT_PATH = os.path.join(PROJECT_ROOT, "certificates", "server_cert.pem")

DEFAULT_HOST = "localhost"
DEFAULT_PORT = 8443

def run_tls_client(host=DEFAULT_HOST, port=DEFAULT_PORT, custom_message=None):
    """Executes a TLS client connection with strict certificate and hostname verification."""
    if not os.path.exists(CERT_PATH):
        print(f"[-] ERROR: Certificate file not found at {CERT_PATH}.")
        print("    Please run the server or generate certificates from the Cryptography Lab first.")
        return False, "Certificate file not found."

    # Create client SSL context with SERVER_AUTH
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile=CERT_PATH)
    
    # Enforce strict hostname verification against SAN / Subject CN
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    # Enforce minimum TLS 1.2 (prefer TLS 1.3)
    if hasattr(ssl, "TLSVersion"):
        context.minimum_version = ssl.TLSVersion.TLSv1_2

    payload = custom_message or {
        "device_id": "PLC-TURBINE-01",
        "action": "report_status",
        "telemetry": {
            "bearing_temp_c": 68.4,
            "vibration_mm_s": 1.2,
            "fuel_flow_kg_s": 14.8,
            "operational_mode": "ACTIVE_SYNCHRONOUS"
        }
    }
    payload_str = json.dumps(payload)

    print(f"================================================================")
    print(f"  INDUSTRIAL SECURESIM - LOCAL TLS CLIENT (Module 4)")
    print(f"================================================================")
    print(f"[*] Target Server: {host}:{port}")
    print(f"[*] Trusted CA File: {CERT_PATH}")
    print(f"[*] Hostname Verification: ENABLED (Strict)")
    print(f"[*] Initiating TLS Handshake...")
    print(f"----------------------------------------------------------------")

    raw_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        with context.wrap_socket(raw_sock, server_hostname=host) as tls_sock:
            tls_sock.connect((host, port))
            tls_version = tls_sock.version()
            cipher = tls_sock.cipher()
            server_cert = tls_sock.getpeercert()

            print(f"[+] TLS Handshake Successful!")
            print(f"    - Negotiated Protocol: {tls_version}")
            print(f"    - Cipher Suite: {cipher[0]} ({cipher[2]} bits)")
            print(f"    - Server Subject: {server_cert.get('subject', [('commonName', 'Unknown')])[0]}")

            print(f"[*] Sending Encrypted Industrial Payload ({len(payload_str)} bytes)...")
            tls_sock.sendall(payload_str.encode('utf-8'))

            response_raw = tls_sock.recv(4096)
            response_str = response_raw.decode('utf-8', errors='replace')
            print(f"[+] Server Response Decrypted:")
            print(f"    {response_str}")
            print(f"================================================================")

            return True, {
                "tls_version": tls_version,
                "cipher_suite": cipher[0],
                "cipher_bits": cipher[2],
                "server_subject": str(server_cert.get("subject", "")),
                "response": response_str
            }
    except ssl.SSLCertVerificationError as cert_err:
        print(f"[-] TLS Certificate Verification Failed: {cert_err}")
        return False, f"Certificate Verification Error: {cert_err}"
    except ConnectionRefusedError:
        print(f"[-] Connection Refused. Is the TLS server running on {host}:{port}?")
        return False, f"Connection Refused on {host}:{port}"
    except Exception as ex:
        print(f"[-] TLS Error: {ex}")
        return False, str(ex)
    finally:
        raw_sock.close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    run_tls_client(port=port)
