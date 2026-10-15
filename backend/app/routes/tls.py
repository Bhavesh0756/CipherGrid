"""TLS and Network Security API Routes (Module 4)."""
import os
import socket
import ssl
import threading
import time
import json
from flask import Blueprint, jsonify, request
from ..security.certificates import inspect_current_certificate, generate_local_x509_certificate, CERT_PATH, KEY_PATH
from ..services.log_service import record_event

tls_bp = Blueprint("tls", __name__, url_prefix="/api/tls")

def is_port_listening(host="127.0.0.1", port=8443):
    """Checks if a local socket is listening on the given port."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.3)
    try:
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

@tls_bp.route("/status", methods=["GET"])
def get_tls_status():
    """Returns local TLS setup status and certificate information."""
    has_cert = os.path.exists(CERT_PATH) and os.path.exists(KEY_PATH)
    cert_info = None
    if has_cert:
        try:
            cert_info = inspect_current_certificate()
        except Exception:
            pass

    server_active = is_port_listening("127.0.0.1", 8443)

    return jsonify({
        "success": True,
        "tls_ready": has_cert,
        "server_active": server_active,
        "port": 8443,
        "host": "localhost (127.0.0.1)",
        "certificate": cert_info,
        "supported_protocols": ["TLSv1.3", "TLSv1.2"],
        "cipher_suites_preference": "AEAD (AES-256-GCM, CHACHA20-POLY1305)",
        "module": "Module 4 - Transport-Layer Security"
    })

@tls_bp.route("/run-test", methods=["POST"])
def run_live_tls_test():
    """Spawns an ephemeral in-process TLS server and client on a dynamic port,
    completes a real TLS 1.3/1.2 handshake over local TCP socket, and returns the real trace!
    """
    if not (os.path.exists(CERT_PATH) and os.path.exists(KEY_PATH)):
        generate_local_x509_certificate(common_name="localhost")

    # Find free port
    temp_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    temp_sock.bind(("127.0.0.1", 0))
    test_port = temp_sock.getsockname()[1]
    temp_sock.close()

    server_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    if hasattr(ssl, "TLSVersion"):
        server_context.minimum_version = ssl.TLSVersion.TLSv1_2
    server_context.load_cert_chain(certfile=CERT_PATH, keyfile=KEY_PATH)

    results = {
        "server_handshake": False,
        "client_handshake": False,
        "tls_version": None,
        "cipher_suite": None,
        "peer_cert": None,
        "payload_exchanged": None,
        "error": None
    }

    server_error = []

    def server_worker():
        try:
            bind_s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            bind_s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            bind_s.bind(("127.0.0.1", test_port))
            bind_s.listen(1)
            bind_s.settimeout(4.0)

            with server_context.wrap_socket(bind_s, server_side=True) as tls_s:
                conn, addr = tls_s.accept()
                results["server_handshake"] = True
                data = conn.recv(4096)
                if data:
                    req_json = json.loads(data.decode('utf-8'))
                    reply = {
                        "status": "ACK",
                        "server_msg": "Industrial SCADA node verified client over TLS."
                    }
                    conn.sendall(json.dumps(reply).encode('utf-8'))
                conn.close()
            bind_s.close()
        except Exception as e:
            server_error.append(str(e))

    srv_thread = threading.Thread(target=server_worker, daemon=True)
    srv_thread.start()
    time.sleep(0.15)  # Allow server to bind

    # Run Client
    client_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH, cafile=CERT_PATH)
    client_context.check_hostname = True
    client_context.verify_mode = ssl.CERT_REQUIRED
    if hasattr(ssl, "TLSVersion"):
        client_context.minimum_version = ssl.TLSVersion.TLSv1_2

    client_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_sock.settimeout(3.0)

    try:
        with client_context.wrap_socket(client_sock, server_hostname="localhost") as tls_client:
            tls_client.connect(("127.0.0.1", test_port))
            results["client_handshake"] = True
            results["tls_version"] = tls_client.version()
            cipher_info = tls_client.cipher()
            results["cipher_suite"] = f"{cipher_info[0]} ({cipher_info[2]} bits)"
            peer = tls_client.getpeercert()
            results["peer_cert"] = {
                "subject": str(peer.get("subject", "")),
                "issuer": str(peer.get("issuer", ""))
            }

            test_payload = {
                "device_id": "PLC-TURBINE-01",
                "command": "POLL_TELEMETRY",
                "auth_layer": "TLS_ENCRYPTED_SOCKET"
            }
            tls_client.sendall(json.dumps(test_payload).encode('utf-8'))
            resp_data = tls_client.recv(4096)
            results["payload_exchanged"] = json.loads(resp_data.decode('utf-8'))

        srv_thread.join(timeout=1.0)

        record_event(
            event_type="TLS_CONNECTION_SUCCESS",
            severity="INFO",
            device_id="PLC-TURBINE-01",
            action="TLS_HANDSHAKE",
            result="SUCCESS",
            message=f"Live local TLS handshake succeeded: {results['tls_version']}, Cipher: {results['cipher_suite']}.",
            details={"version": results["tls_version"], "port": test_port}
        )

        return jsonify({
            "success": True,
            "message": "Real local TLS handshake completed with strict certificate verification.",
            "test_port": test_port,
            "results": results
        })

    except Exception as ex:
        err_msg = str(ex)
        if server_error:
            err_msg += f" (Server error: {server_error[0]})"
        record_event(
            event_type="TLS_CONNECTION_FAILED",
            severity="CRITICAL",
            device_id="PLC-TURBINE-01",
            action="TLS_HANDSHAKE",
            result="FAILURE",
            message=f"Live TLS handshake failed: {err_msg}",
            details={"error": err_msg}
        )
        return jsonify({
            "success": False,
            "error": err_msg,
            "details": "Ensure localhost resolves to 127.0.0.1 and certificates are valid."
        }), 500

@tls_bp.route("/ipsec-spec", methods=["GET"])
def get_ipsec_specification():
    """Returns the conceptual IPsec protocol model (AH vs ESP, modes, packet layouts)."""
    return jsonify({
        "success": True,
        "module": "Module 4 - Network-Layer Security (IPsec)",
        "is_conceptual_simulation": True,
        "disclaimer": "This is a conceptual educational simulation. Real IPsec operates inside the OS kernel network stack (e.g. Linux XFRM / Windows IPsec policy) or on hardware edge security gateways.",
        "protocols": {
            "AH": {
                "name": "Authentication Header (IP Protocol 51)",
                "confidentiality": False,
                "integrity": True,
                "data_origin_authentication": True,
                "anti_replay": True,
                "protects_ip_header": True,
                "summary": "Protects integrity of the entire packet (including outer IP header mutable fields zeroed out), but provides NO encryption."
            },
            "ESP": {
                "name": "Encapsulating Security Payload (IP Protocol 50)",
                "confidentiality": True,
                "integrity": True,
                "data_origin_authentication": True,
                "anti_replay": True,
                "protects_ip_header": False,
                "summary": "Encrypts the payload (AES-CBC or AES-GCM) and provides optional authentication/integrity."
            }
        },
        "modes": {
            "transport": {
                "name": "Transport Mode",
                "use_case": "Host-to-Host communication (e.g., Engineering Workstation to SCADA Server)",
                "packet_structure_ah": ["Original IP Header", "AH Header", "TCP/UDP Header", "Industrial Payload"],
                "packet_structure_esp": ["Original IP Header", "ESP Header", "Encrypted [TCP/UDP + Payload]", "ESP Trailer", "ESP Auth"]
            },
            "tunnel": {
                "name": "Tunnel Mode",
                "use_case": "Gateway-to-Gateway / VPN (e.g., Substation Security Router to Central Control Room)",
                "packet_structure_ah": ["New IP Header", "AH Header", "Original IP Header", "TCP/UDP", "Industrial Payload"],
                "packet_structure_esp": ["New IP Header", "ESP Header", "Encrypted [Original IP Header + TCP/UDP + Payload]", "ESP Trailer", "ESP Auth"]
            }
        }
    })

@tls_bp.route("/wireshark-guide", methods=["GET"])
def get_wireshark_guide():
    """Returns step-by-step instructions for inspecting local TLS traffic in Wireshark."""
    return jsonify({
        "success": True,
        "title": "Wireshark Packet Inspection Guide for ICS Local TLS",
        "steps": [
            {
                "step": 1,
                "title": "Launch Wireshark & Select Loopback Interface",
                "details": "Open Wireshark. On Windows, choose the 'Npcap Loopback Adapter' or 'Adapter for loopback traffic capture' to inspect traffic between 127.0.0.1 and localhost:8443."
            },
            {
                "step": 2,
                "title": "Apply Capture Filter",
                "details": "Set capture filter to: 'tcp port 8443'. This ignores background Windows telemetry and records only our Industrial SecureSim TLS frames."
            },
            {
                "step": 3,
                "title": "Start Standalone TLS Server & Run Client",
                "details": "In terminal 1: python backend/tls_demo/server.py. In terminal 2: python backend/tls_demo/client.py (or click 'Run Live TLS Handshake Test' in dashboard)."
            },
            {
                "step": 4,
                "title": "Inspect Handshake Sequence in Display Filter",
                "details": "Use display filter: 'tls'. You will observe: 1) Client Hello (showing supported cipher suites and SNI 'localhost'), 2) Server Hello (selecting TLS 1.3 or 1.2), 3) Certificate Exchange, 4) Encrypted Handshake Message."
            },
            {
                "step": 5,
                "title": "Verify Payload Confidentiality",
                "details": "Examine 'Application Data' packets. Notice that the industrial telemetry (bearing temp, turbine RPM) is entirely opaque ciphertext. Without the private key or SSLKEYLOGFILE, eavesdroppers cannot read commands."
            }
        ]
    })
