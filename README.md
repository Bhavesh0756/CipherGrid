# Secure Industrial Control System Communication Simulator (CipherGrid)

An educational cybersecurity and industrial network simulation platform designed to model virtual SCADA/ICS environments, visualize hop-by-hop packet communication across Purdue Model levels, and demonstrate how cryptographic mechanisms and access control policies protect critical infrastructure messages.

---

## 1. System Overview & Architecture

The simulator is structured as a full-stack engineering workspace inspired by professional network simulation tools (such as Cisco Packet Tracer), with a restrained industrial engineering aesthetic (slate grey, off-white workspace, deep charcoal navigation, and muted industrial blue/teal accents).

```
                      +------------------------------------------+
                      |         REACT FLOW NETWORK CANVAS        |
                      |  (Interactive Drag-and-Drop OT Topology) |
                      +--------------------+---------------------+
                                           |
                              REST API (JSON / HTTP)
                                           |
                      +--------------------v---------------------+
                      |         FLASK SIMULATION ENGINE          |
                      |                                          |
                      |  * Network Graph BFS Pathfinding         |
                      |  * Industrial RBAC Admission Policy      |
                      |  * AES-256-GCM AEAD Encryption Engine    |
                      |  * SHA-256 Integrity Verification        |
                      |  * RSA-PSS 2048-bit Digital Signatures   |
                      |  * SQLite Event & Replay Cache           |
                      +------------------------------------------+
```

### Key Modules:
1. **Network Lab**: Interactive React Flow topology editor with custom industrial device nodes (Sensors, PLCs, SCADA Servers, HMIs, Gateways, Switches, Routers, Monitors, and Untrusted Probes), port wiring, hop-by-hop animated simulation playback, and live device inspection.
2. **Device Inventory**: Purdue Model asset directory detailing IP addresses, hardware MACs, ISA-95 levels (Level 0 through 3.5), administrative online/offline state, and public keys.
3. **Packet Inspector**: Wireshark-inspired simulation packet table and multi-pane packet dissector showing protocol state, routing metadata, cryptographic parameters, and hex/wire representations.
4. **Security Center**: Technical analysis workbench featuring side-by-side comparative inspection (Plaintext vs AES-256-GCM AEAD vs Recovered payload, SHA-256 digests, RSA-PSS signatures) and an automated test runner for all 9 repeatable security scenarios.
5. **Event Logs**: Persistent SQLite audit trail with status filters, search, pagination, and CSV export.
6. **Lab Reports**: Printable engineering report generator with topology breakdowns, empirical test scenario results, and cryptographic mechanism conclusions.
7. **Operational Telemetry Dashboard**: Purposeful overview displaying active device metrics, simulation sessions, delivery/rejection counters, pass rates, and recent audit records.
8. **Settings**: Simulator parameters, presentation playback clock speed, cryptographic profile specifications, and factory starter reset.

---

## 2. Technology Stack

### Backend
- **Python 3.12+**
- **Flask 3.1.0** & **Flask-CORS 6.0.0**
- **Cryptography >= 43.0.0** (`AESGCM`, `RSAPSS`, `SHA256`, `MGF1`)
- **SQLite 3** (Persistent local relational storage)
- **Pytest >= 8.0.0**

### Frontend
- **React 19**
- **Vite 8**
- **TypeScript 5.8+**
- **Tailwind CSS v4** with `@tailwindcss/vite`
- **@xyflow/react** (React Flow 12)
- **Lucide React** (Industrial iconography)
- **Zustand 5** (Lightweight reactive store)

---

## 3. Getting Started & PowerShell Startup Commands

### Step 1: Install Dependencies

#### Backend Dependencies:
```powershell
pip install -r backend/requirements.txt
```

#### Frontend Dependencies:
```powershell
cd frontend
npm install
cd ..
```

---

### Step 2: Run Automated Tests

#### Backend Pytest Suite (16 Automated Tests):
```powershell
python -m pytest backend/tests -v
```

#### Frontend TypeScript & Production Build Verification:
```powershell
cd frontend
npm run build
cd ..
```

---

### Step 3: Start the Application Services

Open two PowerShell terminal windows:

#### Terminal 1 — Start the Flask Backend (Port 5000):
```powershell
python backend/run.py
```
*The backend API server will start at `http://127.0.0.1:5000` with the health check available at `http://127.0.0.1:5000/api/health`.*

#### Terminal 2 — Start the Vite Frontend (Port 5173):
```powershell
cd frontend
npm run dev
```
*The frontend user interface will be served at `http://127.0.0.1:5173`.*

---

## 4. Cryptographic Implementation Details

- **AES-256-GCM (AEAD)**: Payload confidentiality with a fresh 96-bit cryptographically secure random nonce (`os.urandom(12)`). Authenticates ciphertext and contextual Associated Data (`id`, `src`, `dst`, `type`, `ts`) with a 128-bit MAC tag.
- **SHA-256 Message Digest**: Canonical key-value serialization hashed via SHA-256 for mathematical data integrity verification.
- **RSA-PSS Digital Signatures**: 2048-bit RSA keys with Probabilistic Signature Scheme (PSS), MGF1 mask generation, and SHA-256 digests. Private keys are securely retained on the backend; public keys are distributed across endpoints.
- **Industrial RBAC & Admission Control**: Principle of Least Privilege enforcement based on device role (Sensor, Controller, SCADA, Operator, Gateway, Switch, Router, Monitor, Untrusted), Purdue zone authorization, and message type whitelist.
- **Replay Protection**: Unique deterministic message sequence identifiers tracked in SQLite storage to prevent re-transmission and replay attacks.

---

## 5. Security Test Scenarios

The simulator features 9 repeatable security scenarios with calculated Pass/Fail status:

| # | Scenario Name | Test Objective | Defense Mechanism Tested | Expected Result |
|---|---------------|----------------|--------------------------|-----------------|
| 1 | **Normal Secure Communication** | Deliver authorized telemetry | AES-GCM + RSA-PSS + RBAC | Delivered (PASS) |
| 2 | **Message Tampering** | Detect payload alteration in transit | AEAD 128-bit MAC Tag & SHA-256 | Rejected (PASS) |
| 3 | **Invalid Digital Signature** | Detect forged or corrupted signature | RSA-PSS Signature Verification | Rejected (PASS) |
| 4 | **Unauthorized Device** | Prevent untrusted node injection | Industrial Admission & RBAC Policy | Rejected (PASS) |
| 5 | **Replay Attempt** | Block duplicate message retransmission | SQLite Sequence & Nonce Cache | Rejected (PASS) |
| 6 | **Invalid AES-GCM Tag** | Detect corrupt or forged MAC tag | GCM Authentication Verification | Rejected (PASS) |
| 7 | **Missing Network Path** | Detect broken physical link / topology | Network Graph BFS Pathfinder | Failed (PASS) |
| 8 | **Disabled Destination** | Reject packet to offline node | Administrative Status Validator | Failed (PASS) |
| 9 | **Recovery After Failure** | Verify clean recovery after rejection | State Cleanup & Normal Pipeline | Delivered (PASS) |

---

## 6. Directory Structure

```
Secure Industrial Control System Communication Simulator/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   ├── db.py               # SQLite connection & schema seeding
│   │   │   └── schema.sql          # DDL tables & indexes
│   │   ├── routes/
│   │   │   ├── dashboard.py        # /api/dashboard/stats
│   │   │   ├── devices.py          # /api/devices CRUD
│   │   │   ├── events.py           # /api/events & packet stream
│   │   │   ├── messages.py         # /api/messages/send
│   │   │   ├── reports.py          # /api/reports/lab-report
│   │   │   ├── security.py         # /api/security/scenarios & verify
│   │   │   └── topology.py         # /api/topology & connections
│   │   ├── security/
│   │   │   ├── access_control.py   # Industrial RBAC admission policy
│   │   │   └── crypto_engine.py    # AES-GCM, SHA-256, RSA-PSS
│   │   ├── simulation/
│   │   │   ├── engine.py           # Hop-by-hop packet simulation engine
│   │   │   ├── pathfinder.py       # Graph BFS routing algorithm
│   │   │   └── scenarios.py        # 9 repeatable security scenarios
│   │   └── __init__.py             # Flask application factory & CORS
│   ├── tests/
│   │   └── test_simulator.py       # 16 Pytest test cases
│   ├── requirements.txt            # Python dependencies
│   └── run.py                      # Flask entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.tsx     # Deep charcoal module navigation
│   │   │   │   └── Topbar.tsx      # Application title & core status
│   │   │   └── NetworkLab/
│   │   │       ├── DeviceInspector.tsx      # Selected node configuration panel
│   │   │       ├── DevicePalette.tsx        # Draggable virtual device toolbox
│   │   │       ├── IndustrialNode.tsx       # Custom React Flow OT node
│   │   │       ├── MessageSimulatorModal.tsx# Packet formulation & attack injection
│   │   │       └── SimulationControls.tsx   # Step playback & speed controls
│   │   ├── pages/
│   │   │   ├── DeviceInventory.tsx   # Purdue asset directory
│   │   │   ├── EventLogs.tsx         # SQLite audit log viewer & CSV export
│   │   │   ├── LabReports.tsx        # Printable lab report & findings
│   │   │   ├── NetworkLab.tsx        # Interactive React Flow workspace
│   │   │   ├── OverviewDashboard.tsx # Operational telemetry dashboard
│   │   │   ├── PacketInspector.tsx   # Multi-pane packet dissector
│   │   │   ├── SecurityCenter.tsx    # Cryptographic workbench & scenarios
│   │   │   └── Settings.tsx          # Simulator parameters & factory reset
│   │   ├── services/
│   │   │   └── api.ts                # Typed REST client
│   │   ├── store/
│   │   │   └── useSimulatorStore.ts  # Zustand simulation state store
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interface definitions
│   │   ├── App.tsx                   # Main workspace shell
│   │   ├── index.css                 # Industrial engineering styling
│   │   └── main.tsx                  # React entrypoint
│   ├── index.html                    # HTML shell
│   ├── package.json                  # Frontend dependencies
│   ├── tsconfig.json                 # TypeScript project configuration
│   └── vite.config.ts                # Vite config & API reverse proxy
└── README.md                         # Project documentation
```

---

## 7. Educational Disclaimer

This simulator is designed exclusively for cybersecurity education, ICS protocol research, and academic laboratory demonstrations. All virtual devices, IP addresses, interfaces, and packet streams represent simulated software models executing within the local Python engine. No connections are made to physical operational technology (OT) equipment or real-world industrial control networks.
