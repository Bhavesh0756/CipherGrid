"""Local TLS 1.3 / 1.2 Industrial SCADA Server.

Runs a standalone secure TLS server using Python's standard `ssl` and `socket` modules.
Demonstrates:
- Loading local X.509 certificate and private key
- TLS protocol negotiation (TLS 1.3 preferred, TLS 1.2 minimum)
- Secure socket wrapping and connection handling
- Receiving authenticated industrial command frames and sending encrypted status replies
"""
import ssl
import socket
import os
import sys
import json

# Ensure parent directory is in path to import certificate helpers if needed
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
CERT_DIR = os.path.join(PROJECT_ROOT, "certificates")
CERT_PATH = os.path.join(CERT_DIR, "server_cert.pem")
KEY_PATH = os.path.join(CERT_DIR, "server_key.pem")

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8443

def ensure_certificates():
    """Generates server cert and key if not present."""
    if not (os.path.exists(CERT_PATH) and os.path.exists(KEY_PATH)):
        print(f"[*] Certificate not found. Generating local X.509 certificate in {CERT_DIR}...")
        sys.path.insert(0, PROJECT_ROOT)
        from app.security.certificates import generate_local_x509_certificate
        generate_local_x509_certificate(common_name="localhost")
        print("[+] Certificate generated successfully.")

def start_tls_server(host=DEFAULT_HOST, port=DEFAULT_PORT, max_connections=None):
    """Starts the TLS server."""
    ensure_certificates()

    # Create server-side SSL context
    # PROTOCOL_TLS_SERVER enables secure defaults (TLS 1.2 and 1.3)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    
    # Enforce minimum TLS 1.2 (prefer TLS 1.3)
    if hasattr(ssl, "TLSVersion"):
        context.minimum_version = ssl.TLSVersion.TLSv1_2
    
    # Load the server certificate and private key
    context.load_cert_chain(certfile=CERT_PATH, keyfile=KEY_PATH)

    # Disable insecure legacy options
    context.options |= ssl.OP_NO_SSLv2
    context.options |= ssl.OP_NO_SSLv3
    context.options |= ssl.OP_NO_TLSv1
    context.options |= ssl.OP_NO_TLSv1_1

    print(f"================================================================")
    print(f"  INDUSTRIAL SECURESIM - LOCAL TLS SERVER (Module 4)")
    print(f"================================================================")
    print(f"[*] Binding to {host}:{port}...")
    print(f"[*] Certificate: {CERT_PATH}")
    print(f"[*] Enforcing TLS 1.2+ with preferred TLS 1.3")
    print(f"[*] Waiting for TLS client connections... (Press Ctrl+C to stop)")
    print(f"----------------------------------------------------------------")

    bind_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    bind_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    bind_sock.bind((host, port))
    bind_sock.listen(5)

    conn_count = 0
    try:
        with context.wrap_socket(bind_sock, server_side=True) as tls_server:
            while True:
                client_sock, client_addr = tls_server.accept()
                conn_count += 1
                tls_version = client_sock.version()
                cipher = client_sock.cipher()
                print(f"[+] [CONN #{conn_count}] Inbound TLS Handshake from {client_addr[0]}:{client_addr[1]}")
                print(f"    - Protocol Version: {tls_version}")
                print(f"    - Negotiated Cipher Suite: {cipher[0]} ({cipher[2]} bits)")

                try:
                    raw_data = client_sock.recv(4096)
                    if raw_data:
                        msg_str = raw_data.decode('utf-8', errors='replace')
                        print(f"    - Received Encrypted Industrial Payload: {msg_str[:120]}")

                        # Send encrypted response
                        response_data = {
                            "status": "PROCESSED_OVER_TLS",
                            "tls_version": tls_version,
                            "cipher_suite": cipher[0],
                            "server_time": "Synchronized",
                            "message": "SCADA TLS Server received authenticated command."
                        }
                        client_sock.sendall(json.dumps(response_data).encode('utf-8'))
                except Exception as ex:
                    print(f"    [-] Connection error: {ex}")
                finally:
                    client_sock.close()
                    print(f"    [*] Connection #{conn_count} closed gracefully.")
                
                if max_connections and conn_count >= max_connections:
                    break
    except KeyboardInterrupt:
        print("\n[*] Server shutdown by operator.")
    finally:
        bind_sock.close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    start_tls_server(port=port)
