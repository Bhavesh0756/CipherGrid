import React from 'react';
import { 
  Info, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Server, 
  Lock, 
  Cpu, 
  FileCode,
  ExternalLink
} from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';

export const ProjectInformation = () => {
  const moduleMappings = [
    {
      module: 'Module 1: Classical Cryptography',
      concepts: 'Symmetric Shift Ciphers, Permutation & Transposition, Key Space Limits, Frequency Analysis',
      implementation: 'Working Python Caesar Cipher (shift 1-25) and Columnar Transposition with keyword matrix.',
      status: 'Real Implementation (Educational)',
      statusType: 'real',
    },
    {
      module: 'Module 2: Modern Cryptography & PKI',
      concepts: 'Authenticated Encryption with Associated Data (AEAD), Secure Hashing, Asymmetric Keypairs, Digital Signatures, X.509 PKI, Key Management',
      implementation: 'AES-256-GCM with fresh 96-bit nonces & tamper detection (InvalidTag), SHA-256 with bit-level avalanche effect, RSA-2048 keygen with Hybrid Envelope (RSA-OAEP), RSA-PSS signatures (SHA-256, MGF1), and X.509 self-signed cert creation.',
      status: 'Real Implementation (Cryptographic Library)',
      statusType: 'real',
    },
    {
      module: 'Module 3: Access Control & Device Management',
      concepts: 'Role-Based Access Control (RBAC), Principle of Least Privilege (PoLP), Port-Based Network Admission Control (IEEE 802.1X / EAP)',
      implementation: 'Working SQLite RBAC decision engine evaluating device admission status, role permissions, and risk tiers. Plus, an interactive 7-step conceptual model of IEEE 802.1X Supplicant → Authenticator → RADIUS server.',
      status: 'Real RBAC + Conceptual 802.1X Simulation',
      statusType: 'mixed',
    },
    {
      module: 'Module 4: Transport & Network Layer Security',
      concepts: 'Transport Layer Security (TLS 1.3), Hostname & Certificate Verification, IPsec (AH vs ESP, Transport vs Tunnel Modes), Wireshark Packet Inspection',
      implementation: 'Real standalone local Python TLS client/server over sockets using Python ssl module with strict verification. In-app live TLS socket test runner. Plus conceptual IPsec simulator and Wireshark capture tutorial.',
      status: 'Real Local TLS + Conceptual IPsec Simulator',
      statusType: 'mixed',
    },
  ];

  const disclosureTable = [
    {
      feature: 'Caesar & Columnar Transposition Ciphers',
      nature: 'Real Working Implementation',
      details: 'Mathematical cipher algorithms running in Python for educational comparison.',
    },
    {
      feature: 'AES-256-GCM Encryption & Tampering Detection',
      nature: 'Real Working Implementation',
      details: 'Cryptographically secure via Python standard `cryptography.hazmat` library.',
    },
    {
      feature: 'SHA-256 Hashing & Avalanche Effect Analyzer',
      nature: 'Real Working Implementation',
      details: 'Computes SHA-256 digests via `hashlib` and calculates exact bit differences.',
    },
    {
      feature: 'RSA-2048 Key Generation & Hybrid Envelope',
      nature: 'Real Working Implementation',
      details: 'Standard RSA-2048 keys with PKCS#8 PEM export and RSA-OAEP session key wrapping.',
    },
    {
      feature: 'RSA-PSS Digital Signatures',
      nature: 'Real Working Implementation',
      details: 'Probabilistic Signature Scheme (PSS) signing and strict public key verification.',
    },
    {
      feature: 'X.509 Certificate Generation & Local Validation',
      nature: 'Real Working Implementation',
      details: 'Generates real self-signed X.509 certificate for localhost. Stored on disk for TLS.',
    },
    {
      feature: 'SCADA Role-Based Access Control (RBAC)',
      nature: 'Real Working Implementation',
      details: 'SQLite-backed policy engine enforcing device lifecycle and role privileges.',
    },
    {
      feature: 'Standalone Local TLS 1.3 Client & Server',
      nature: 'Real Working Implementation',
      details: 'Actual TLS client-server communication using Python `ssl` module over TCP port 8443.',
    },
    {
      feature: 'IEEE 802.1X / EAP-TLS Workflow',
      nature: 'Conceptual Educational Simulation',
      details: 'Simulates the protocol handshakes without requiring physical enterprise hardware switches.',
    },
    {
      feature: 'IPsec AH vs ESP Packet Simulator',
      nature: 'Conceptual Educational Simulation',
      details: 'Illustrates OSI Layer 3 header encapsulation without modifying OS kernel network tables.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="bg-[#0d1629]/70 border border-slate-800 p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Industrial SecureSim — Project Documentation
            </h2>
            <span className="text-xs text-cyan-400 font-mono-code">
              Network Security College Microproject Specification
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          <strong>Secure Industrial Control System Communication Simulator</strong> is a software-only cybersecurity demonstration platform. It illustrates how virtual industrial devices (PLCs, RTUs, smart sensors) communicate securely with a monitoring server without physical hardware or industrial plant risks.
        </p>
      </div>

      {/* 4 Network Security Modules Mapping */}
      <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Curriculum Coverage Across All 4 Network Security Modules</span>
        </h3>

        <div className="space-y-3">
          {moduleMappings.map((m, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">{m.module}</span>
                <span className="px-2 py-0.5 rounded font-mono-code text-[11px] bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                  {m.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Key Theoretical Concepts:</span>{' '}
                <span className="text-slate-300">{m.concepts}</span>
              </div>
              <div>
                <span className="text-teal-400 font-semibold">Project Implementation:</span>{' '}
                <span className="text-slate-300 leading-relaxed">{m.implementation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real vs Conceptual Simulation Disclosure Matrix */}
      <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <span>Transparency Matrix: Real Implementations vs Conceptual Simulations</span>
        </h3>
        <p className="text-xs text-slate-400">
          Strictly distinguishes functional cryptographic code from pedagogical visual simulations.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Feature / Subsystem</th>
                <th className="pb-2 font-medium">Implementation Status</th>
                <th className="pb-2 font-medium">Technical Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {disclosureTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-semibold text-slate-200">{row.feature}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono-code border ${
                      row.nature.includes('Real')
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                    }`}>
                      {row.nature}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px]">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Run & Verification Commands */}
      <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Execution Instructions & Verification Commands</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-cyan-400 font-semibold block mb-1">1. Run Automated Security Test Suite (Pytest):</span>
            <CodeBlock code="python -m pytest backend/tests/test_securesim.py -v" language="powershell" />
          </div>

          <div>
            <span className="text-teal-400 font-semibold block mb-1">2. Start Flask Backend API (Port 5000):</span>
            <CodeBlock code="python backend/run.py" language="powershell" />
          </div>

          <div>
            <span className="text-blue-400 font-semibold block mb-1">3. Start React Frontend (Vite Dev Server - Port 5173):</span>
            <CodeBlock code="cd frontend; npm run dev" language="powershell" />
          </div>

          <div>
            <span className="text-purple-400 font-semibold block mb-1">4. Optional Standalone TLS Server & Client:</span>
            <CodeBlock code="python backend/tls_demo/server.py&#10;python backend/tls_demo/client.py" language="powershell" />
          </div>
        </div>
      </div>
    </div>
  );
};
