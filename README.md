# Secure Industrial Control System Communication Simulator (Industrial SecureSim)

A software-only cybersecurity simulation platform that demonstrates how virtual industrial devices (PLCs, RTUs, smart sensors, actuator controllers) communicate securely with a central SCADA monitoring server.

This project implements and demonstrates concepts across all **four Network Security modules** through working cryptographic features, access control policy engines, and clearly labelled protocol simulations.

---

## 1. Project Overview & Architectural Alignment

In Industrial Control Systems (ICS / SCADA), security relies on defense-in-depth:
- Device Admission & Identity (IEEE 802.1X / EAP-TLS)
- Access Control & Authorization (RBAC, Principle of Least Privilege)
- Cryptographic Message Security (AES-256-GCM AEAD, SHA-256 integrity, RSA-PSS signatures)
- Transport Security (TLS 1.3 / 1.2 with mutual X.509 certificate validation)
- Network-Layer Protection (IPsec AH & ESP encapsulation)

```
[ Virtual Industrial Device ]
       │ (1. Telemetry / Command: Temp, Pressure, RPM)
       ▼
[ Security Admission & RBAC Policy Layer ]
       │ ── Checks device status (Authorized / Suspended / Unauthorized)
       │ ── Validates role permissions against requested action
       ▼
[ Cryptographic Engine ]
       │ ── AES-256-GCM (Confidentiality & Polynomial Auth Tag)
       │ ── SHA-256 Digest (Integrity verification)
       │ ── RSA-PSS Digital Signature (Origin authentication & non-repudiation)
       ▼
[ Secure Transport Channel ]
       │ ── TLS 1.3 Encrypted Socket (Port 8443)
       │ ── Strict X.509 Certificate & Hostname Validation
       ▼
[ SCADA Central Monitoring Controller ]
       │ ── Validates signature, verifies tag, decrypts payload
       │ ── Records audit events in SQLite database
       └── Renders live telemetry & alerts on Dashboard
```

---

## 2. Curriculum Coverage: All 4 Network Security Modules

### Module 1: Classical Cryptography & Fundamentals
- **Caesar Cipher (Shift Cipher)**: Implements monoalphabetic substitution ($C = (P + k) \pmod{26}$) with an interactive shift slider.
- **Columnar Transposition Cipher**: Implements permutation of characters using a keyword grid.
- **Educational Notice**: Both algorithms are explicitly identified as educational demonstrations. Their limited key space (25 keys for Caesar) and vulnerability to frequency analysis and anagramming make them unsuited for modern industrial security.

### Module 2: Modern Symmetric, Asymmetric, Hashing & PKI
- **AES-256-GCM (Authenticated Encryption with Associated Data)**: Uses the Python `cryptography` library. Encrypts industrial messages using 256-bit keys and fresh, cryptographically secure 96-bit (12-byte) nonces generated per message (`os.urandom(12)`). Decryption verifies the 128-bit GHASH authentication tag; any tampering with ciphertext, nonce, or associated data causes decryption to fail immediately with an `InvalidTag` exception.
- **SHA-256 Cryptographic Hashing**: Uses Python `hashlib`. Demonstrates one-way pre-image resistance and features an interactive **Avalanche Effect** comparator that calculates exact Hamming bit distance (showing that flipping a single character flips ~50% of the 256 bits).
- **RSA-2048 Asymmetric Cryptography & Hybrid Encryption**: Generates RSA-2048 key pairs ($e=65537$) with PKCS#8 PEM public key export. Demonstrates modern **Key Encapsulation / Hybrid Envelope Encryption**: bulk industrial payloads are encrypted with AES-256-GCM, and the ephemeral 32-byte AES key is encrypted with RSA-OAEP (SHA-256).
- **RSA-PSS Digital Signatures**: Implements Probabilistic Signature Scheme (PSS) with SHA-256 and MGF1. Proves message authenticity, integrity, and non-repudiation. Includes controlled wire-tampering simulation where modifying a single byte invalidates the signature.
- **X.509 Digital Certificates**: Generates a self-signed X.509 certificate for `localhost` / `127.0.0.1` using `cryptography.x509`. Displays Subject, Issuer, Serial Number, Validity Dates, Key Usage, and SHA-256 fingerprint. Performs local certificate validation.
- **Key Management**: Strict separation of public and private keys, safe key generation via OS CSPRNG, exclusion of keys/databases from Git via `.gitignore`, and warnings against frontend key storage.

### Module 3: Access Control & Network Defense
- **SCADA Role-Based Access Control (RBAC)**: Persisted in SQLite. Enforces device lifecycle states (`Authorized`, `Suspended`, `Unauthorized`, `Revoked`) and role permissions (`telemetry_node`, `operator`, `maintenance_supervisor`, `admin_controller`, `untrusted_sensor`).
- **Principle of Least Privilege (PoLP)**: High-risk actions (`reboot_plc`, `emergency_trip`, `flash_firmware`) require elevated roles; unauthorized attempts are dropped and logged as critical security violations.
- **Conceptual IEEE 802.1X / EAP-TLS Workflow**: Interactive 7-step visualization of port-based network access control between Supplicant (Virtual Device), Authenticator (ICS Switch), and Authentication Server (RADIUS / EAP-TLS).

### Module 4: Transport & Network Layer Security
- **Real Local TLS 1.3 Client-Server Demo**: Standalone Python scripts (`backend/tls_demo/server.py` and `backend/tls_demo/client.py`) using Python's standard `ssl` module. The server loads the X.509 certificate and listens on port 8443; the client strictly verifies the server certificate and hostname (`check_hostname=True`), negotiates TLS 1.3 (or 1.2), and exchanges encrypted telemetry.
- **In-App Live TLS Socket Handshake Test**: Allows executing a real local socket TLS handshake from the browser dashboard and inspecting the negotiated protocol (`TLSv1.3`), cipher suite (`TLS_AES_256_GCM_SHA384`), and encrypted frames.
- **IPsec Conceptual Simulator**: Visualizes OSI Layer 3 security, comparing Authentication Header (AH, Protocol 51 - integrity only) vs Encapsulating Security Payload (ESP, Protocol 50 - confidentiality + integrity) in both Transport Mode and Tunnel Mode.
- **Wireshark Packet Inspection Guide**: Step-by-step tutorial for capturing and inspecting local loopback TLS handshakes and opaque Application Data packets on port 8443.

---

## 3. Real Implementation vs Conceptual Simulation Disclosures

| Feature / Subsystem | Implementation Type | Technical Detail |
|---|---|---|
| Caesar & Columnar Transposition Ciphers | **Real Implementation** | Mathematical algorithms running in Python for educational analysis. |
| AES-256-GCM AEAD & Tampering Detection | **Real Implementation** | Built with standard `cryptography.hazmat` library; enforces nonce uniqueness. |
| SHA-256 Hashing & Avalanche Analyzer | **Real Implementation** | Standard `hashlib.sha256` with bit-level Hamming distance calculation. |
| RSA-2048 Asymmetric Keypair & Hybrid Envelope | **Real Implementation** | Standard `cryptography.hazmat.primitives.asymmetric.rsa` & OAEP padding. |
| RSA-PSS Digital Signatures | **Real Implementation** | Real PSS padding with MGF1 and SHA-256. |
| X.509 Digital Certificates | **Real Implementation** | Generated with `cryptography.x509` and stored in `backend/certificates/`. |
| Industrial RBAC & Policy Engine | **Real Implementation** | SQLite-backed evaluation engine with audit logging. |
| Local TLS 1.3 Client & Server Socket Demo | **Real Implementation** | Real TLS communication using Python `ssl` module on port 8443. |
| IEEE 802.1X / EAP-TLS Workflow | **Conceptual Simulation** | Conceptual model; does not require physical hardware switches. |
| IPsec AH vs ESP Packet Simulator | **Conceptual Simulation** | Illustrates Layer 3 encapsulation without altering OS kernel tables. |
| Wireshark Traffic Capture | **Optional Local Tool** | Practical instructions for local packet capture with Wireshark/Npcap. |

---

## 4. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Recharts, Lucide React icons.
- **Backend**: Python 3.12, Flask, Flask-CORS, Python standard `cryptography` library, `hashlib`, `ssl`, `sqlite3`.
- **Database**: SQLite (`backend/app/database/securesim.db`), automatically created and seeded on first run.

---

## 5. Getting Started & Execution Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm

### Installation

1. **Install Backend Dependencies**:
```powershell
pip install -r backend/requirements.txt
```

2. **Install Frontend Dependencies**:
```powershell
cd frontend
npm install
cd ..
```

---

### Running the Application

Open two terminal windows:

#### Terminal 1 — Start Flask Backend Server:
```powershell
python backend/run.py
```
*The API server will run at `http://127.0.0.1:5000/api/health`.*

#### Terminal 2 — Start React Frontend:
```powershell
cd frontend
npm run dev
```
*Open your browser at `http://localhost:5173` to access the Industrial SecureSim dashboard.*

---

### Running Automated Security Tests

Execute the complete pytest suite to verify all cryptographic and access control features:
```powershell
python -m pytest backend/tests/test_securesim.py -v
```
*(All 16 automated tests covering Caesar, Transposition, AES-GCM, Tampering Detection, SHA-256, RSA, RSA-PSS, X.509, RBAC, and Live TLS sockets will execute and pass).*

---

### Running the Standalone TLS 1.3 Client & Server

To demonstrate standalone TLS outside the web interface:

1. In Terminal 1, start the TLS server:
```powershell
python backend/tls_demo/server.py
```

2. In Terminal 2, run the TLS client:
```powershell
python backend/tls_demo/client.py
```

*The client validates the server certificate and hostname, negotiates TLS 1.3, and exchanges encrypted industrial commands.*

---

## 6. Project Structure

```
industrial-securesim/
  backend/
    app/
      database/
        __init__.py
        db.py               # SQLite connection manager & seed runner
        schema.sql          # Tables: devices, roles, security_events, simulation_records
      routes/
        __init__.py
        dashboard.py        # Live metrics & chart data from SQLite
        devices.py          # Device CRUD & multi-layer simulation endpoints
        crypto.py           # Endpoints for Caesar, AES-GCM, RSA, SHA-256, PSS, X.509
        logs.py             # Filterable audit log retrieval & purge
        tls.py              # In-process live TLS socket test runner & IPsec spec
      security/
        __init__.py
        classical.py        # Caesar & Columnar Transposition ciphers
        symmetric.py        # AES-256-GCM AEAD & tampering verification
        asymmetric.py       # RSA-2048 keygen & Hybrid Envelope (RSA-OAEP + AES-GCM)
        hash_util.py        # SHA-256 hashing & bit-level avalanche analyzer
        signatures.py       # RSA-PSS digital signatures (SHA-256, MGF1)
        certificates.py     # X.509 self-signed cert generation & inspection
        rbac.py             # ICS Role-Based Access Control policy engine
      services/
        __init__.py
        device_service.py   # Multi-layer cryptographic message simulation
        crypto_service.py   # Orchestrator for cryptography lab operations
        log_service.py      # Safe SQLite audit logging (redacts secrets)
      __init__.py           # Flask application factory with CORS & Blueprints
    certificates/           # Directory storing generated local X.509 certificates
    tls_demo/
      server.py             # Standalone Python TLS 1.3 / 1.2 server
      client.py             # Standalone Python TLS client with strict cert verification
    tests/
      test_securesim.py     # Pytest test suite covering all 4 modules
    requirements.txt        # Backend dependencies
    run.py                  # Backend server entrypoint
    .env.example            # Environment configuration template
  frontend/
    src/
      components/
        Badge.jsx           # Monospace cybersecurity status/severity badges
        CodeBlock.jsx       # Monospace formatted viewer with copy-to-clipboard
        CommunicationFlow.jsx # Visual pipeline: Device → Security → Server
        StatCard.jsx        # Metric cards with accent borders and icons
      layouts/
        DashboardLayout.jsx # Dark navy responsive sidebar & status header
      pages/
        OverviewDashboard.jsx    # Live metrics, Recharts charts, events feed
        IndustrialDevices.jsx    # Virtual device CRUD, status toggle, simulation
        CryptographyLab.jsx      # Modules 1 & 2 interactive cryptographic workbench
        AccessControl.jsx        # RBAC matrix, policy tester, conceptual 802.1X
        SecureCommunication.jsx  # Live TLS demo, standalone scripts, IPsec, Wireshark
        SecurityEventLogs.jsx    # Searchable, filterable audit log table
        ProjectInformation.jsx   # Complete curriculum documentation & disclosures
      services/
        api.js              # REST API client connecting React to Flask
      App.jsx               # Navigation switcher
      main.jsx              # React DOM entrypoint
      index.css             # Tailwind CSS & cybersecurity theme design tokens
    package.json
    index.html
    vite.config.js
  .gitignore
  README.md
```

---

## 7. Security Best Practices Observed

- **No Homemade Cryptography**: All modern cryptographic operations (AES-GCM, RSA, RSA-PSS, X.509, SHA-256) rely on the Python `cryptography` package and `hashlib`.
- **Strict Nonce Handling**: Every AES-GCM encryption draws a unique 96-bit nonce via `os.urandom(12)`.
- **Key Secrecy**: Private keys are maintained server-side and excluded from public API responses.
- **Audit Sanitization**: The logging service strips and redacts private keys, raw secrets, and sensitive tokens prior to SQLite insertion.
- **Git Hygiene**: Private keys (`*.pem`, `*.key`), SQLite databases (`*.db`), virtual environments, and `.env` files are excluded in `.gitignore`.
