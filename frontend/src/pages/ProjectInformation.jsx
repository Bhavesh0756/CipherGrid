import React from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  Terminal, 
  Cpu, 
  KeyRound,
  Radio,
  Lock,
  Server,
  FileCode,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';

export const ProjectInformation = () => {
  const domains = [
    {
      domainId: '01',
      title: 'Classical Cryptography & Cryptanalysis',
      badge: 'Real Math Algorithms',
      badgeColor: 'emerald',
      concepts: 'Symmetric Shift Ciphers, Permutation & Transposition, Key Space Limits, Frequency Analysis',
      implementation: 'Working Python Caesar Cipher (shift 1-25) and Columnar Transposition with keyword matrix and brute-force key space analysis.',
      standards: 'Historical baseline, Kerckhoffs’s Principle',
      icon: KeyRound,
      accent: 'from-amber-500/20 to-orange-500/5',
      borderAccent: 'border-amber-500/30'
    },
    {
      domainId: '02',
      title: 'Modern Cryptography, AEAD & PKI',
      badge: 'NIST Standards · Real Hazmat',
      badgeColor: 'emerald',
      concepts: 'Authenticated Encryption with Associated Data (AEAD), Avalanche Effect, Asymmetric Keypairs, Digital Signatures, X.509 PKI',
      implementation: 'AES-256-GCM with fresh 96-bit nonces & tamper detection (InvalidTag), SHA-256 with bit-level avalanche analysis, RSA-2048 keygen with Hybrid Envelope (RSA-OAEP), RSA-PSS signatures (SHA-256, MGF1), and X.509 certificate generation.',
      standards: 'FIPS 197 (AES), FIPS 180-4 (SHA-2), PKCS#1 v2.2 (RSA-PSS / OAEP)',
      icon: Lock,
      accent: 'from-sky-500/20 to-cyan-500/5',
      borderAccent: 'border-sky-500/30'
    },
    {
      domainId: '03',
      title: 'Industrial Access Control & Network Admission',
      badge: 'Real RBAC + Conceptual 802.1X',
      badgeColor: 'sky',
      concepts: 'Role-Based Access Control (RBAC), Principle of Least Privilege (PoLP), Port-Based Network Admission Control (IEEE 802.1X / EAP-TLS)',
      implementation: 'SQLite-backed RBAC decision engine evaluating device admission status, role permissions, and risk tiers. Plus, an interactive 7-step pedagogical state machine for IEEE 802.1X Supplicant → Authenticator → RADIUS server.',
      standards: 'IEEE 802.1X-2020, RFC 5280, NIST SP 800-82',
      icon: ShieldCheck,
      accent: 'from-teal-500/20 to-emerald-500/5',
      borderAccent: 'border-teal-500/30'
    },
    {
      domainId: '04',
      title: 'Transport Security & Network Protocol Defense',
      badge: 'Real TLS 1.3 + Conceptual IPsec',
      badgeColor: 'sky',
      concepts: 'Transport Layer Security (TLS 1.3), Hostname & Certificate Verification, IPsec (AH vs ESP, Transport vs Tunnel Modes), Wireshark Packet Inspection',
      implementation: 'Real local Python TLS client/server over sockets using Python ssl module with strict verification. In-app live TLS socket test runner. Plus pedagogical IPsec simulator and Wireshark capture filter cheatsheet.',
      standards: 'RFC 8446 (TLS 1.3), RFC 4301 (IPsec Architecture)',
      icon: Radio,
      accent: 'from-indigo-500/20 to-purple-500/5',
      borderAccent: 'border-indigo-500/30'
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

  const architectureFlow = [
    { title: 'Virtual Field Devices', desc: 'Simulated PLCs, RTUs, sensors emitting realistic telemetry', icon: Cpu, color: 'text-sky-400' },
    { title: 'Cryptographic Security Gate', desc: 'AES-256-GCM encryption, RSA-PSS signature, SHA-256 integrity', icon: Lock, color: 'text-violet-400' },
    { title: 'Admission & RBAC Engine', desc: '802.1X validation, least privilege enforcement, risk tiers', icon: ShieldCheck, color: 'text-teal-400' },
    { title: 'Secure Transport & Ledger', desc: 'TLS 1.3 encrypted socket tunnel and SQLite audit database', icon: Server, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-8">
      {/* Title Hero */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#091325]/90 border border-[#1a2c4e] backdrop-blur-xl relative overflow-hidden shadow-xl shadow-black/30">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-sky-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                Network Security College Microproject
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-code">
                Full-Stack Architecture
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              AegisGrid <span className="text-sky-400">ICS</span> — Architecture Dossier
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              A pure software-driven industrial cybersecurity simulation platform. Demonstrates how virtual industrial devices (PLCs, RTUs, smart meters) establish cryptographic trust and secure telemetry channels with a monitoring server without physical hardware risk.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#050c18] border border-slate-800 text-right shrink-0">
            <div className="text-[11px] text-slate-400">Target Environment</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Software-Only ICS Simulator</div>
            <div className="text-[10px] text-sky-400/80 font-mono-code mt-1">Zero Physical Hardware Needed</div>
          </div>
        </div>
      </div>

      {/* High-Level Architecture Flow */}
      <div className="bg-[#091325]/90 border border-[#1a2c4e] rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>AegisGrid System Architecture Pipeline</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {architectureFlow.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="p-4 rounded-xl bg-[#050c18] border border-slate-800/80 relative space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono-code text-slate-500">Tier 0{idx + 1}</span>
                </div>
                <h3 className="text-xs font-bold text-white">{step.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Curriculum Domains */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Academic Syllabus & Cryptographic Domains</span>
          </h2>
          <span className="text-[11px] font-mono-code text-slate-400">Complete 4-Module Coverage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map((dom) => {
            const Icon = dom.icon;
            return (
              <div 
                key={dom.domainId} 
                className={`p-5 rounded-2xl bg-gradient-to-br ${dom.accent} bg-[#091325]/90 border ${dom.borderAccent} shadow-xl shadow-black/20 space-y-3.5 relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 font-mono-code font-bold text-xs flex items-center justify-center">
                      {dom.domainId}
                    </span>
                    <h3 className="text-sm font-bold text-white">{dom.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono-code text-emerald-400">
                    {dom.badge}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Core Concepts Covered:</span>
                    <p className="text-slate-300 mt-0.5 text-[11px]">{dom.concepts}</p>
                  </div>
                  <div>
                    <span className="text-sky-400 font-semibold block text-[11px]">Implemented Architecture:</span>
                    <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">{dom.implementation}</p>
                  </div>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-slate-500">Benchmark Standards:</span>
                    <span>{dom.standards}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real vs Conceptual Simulation Disclosure Matrix */}
      <div className="bg-[#091325]/90 border border-[#1a2c4e] rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Academic Rigor & Implementation Transparency Matrix</span>
          </h2>
          <span className="text-[11px] text-slate-400">Strict disclosure of real cryptography vs simulated elements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1a2c4e] bg-[#050c18] text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Feature / Cryptographic Subsystem</th>
                <th className="py-3 px-3">Implementation Status</th>
                <th className="py-3 px-4">Technical Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {disclosureTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-200">{row.feature}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code border inline-flex items-center gap-1 ${
                      row.nature.includes('Real')
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {row.nature}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Instructions */}
      <div className="bg-[#091325]/90 border border-[#1a2c4e] rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Execution Instructions & Verification Commands</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <span className="text-sky-400 font-semibold block text-[11px]">1. Automated Pytest Verification Suite:</span>
            <CodeBlock code="python -m pytest backend/tests/test_securesim.py -v" language="powershell" />
          </div>

          <div className="space-y-1.5">
            <span className="text-teal-400 font-semibold block text-[11px]">2. Start Flask Security Backend (Port 5000):</span>
            <CodeBlock code="python backend/run.py" language="powershell" />
          </div>

          <div className="space-y-1.5">
            <span className="text-blue-400 font-semibold block text-[11px]">3. Launch React Frontend (Vite Dev Server - Port 5173):</span>
            <CodeBlock code="cd frontend; npm run dev" language="powershell" />
          </div>

          <div className="space-y-1.5">
            <span className="text-purple-400 font-semibold block text-[11px]">4. Standalone Native TLS 1.3 Socket Test:</span>
            <CodeBlock code="python backend/tls_demo/server.py&#10;python backend/tls_demo/client.py" language="powershell" />
          </div>
        </div>
      </div>
    </div>
  );
};
