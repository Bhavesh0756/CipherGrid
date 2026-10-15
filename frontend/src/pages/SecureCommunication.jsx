import React, { useState, useEffect } from 'react';
import {
  Radio,
  Lock,
  ShieldCheck,
  Terminal,
  Layers,
  Network,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Search,
  ExternalLink,
  Cpu,
  Server,
  Sparkles
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0e1320]/85 border border-[#1c263c] rounded-2xl p-6 shadow-xl shadow-black/40 backdrop-blur-md card-hover space-y-4 ${className}`}>
    {children}
  </div>
);

const InfoBanner = ({ icon: Icon, color, children }) => (
  <div className={`p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3 ${color}`}>
    <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
    <div>{children}</div>
  </div>
);

export const SecureCommunication = () => {
  const [activeTab, setActiveTab] = useState('tls');

  // TLS Demo state
  const [tlsStatus, setTlsStatus] = useState(null);
  const [isRunningTls, setIsRunningTls] = useState(false);
  const [tlsLiveResults, setTlsLiveResults] = useState(null);
  const [tlsError, setTlsError] = useState(null);

  // IPsec state
  const [ipsecSpec, setIpsecSpec] = useState(null);
  const [ipsecMode, setIpsecMode] = useState('transport');

  // Wireshark state
  const [wiresharkGuide, setWiresharkGuide] = useState(null);

  useEffect(() => {
    api.getTlsStatus().then(r => r.ok && setTlsStatus(r.data));
    api.getIpsecSpec().then(r => r.ok && setIpsecSpec(r.data));
    api.getWiresharkGuide().then(r => r.ok && setWiresharkGuide(r.data));
  }, []);

  const handleRunLiveTlsTest = async () => {
    setIsRunningTls(true);
    setTlsLiveResults(null);
    setTlsError(null);
    try {
      const res = await api.runLiveTlsTest();
      if (res.ok && res.data?.success) {
        setTlsLiveResults(res.data);
      } else {
        setTlsError(res.data?.error || 'Live TLS handshake failed.');
      }
    } catch (err) {
      setTlsError(err.message || 'Error executing TLS handshake.');
    } finally {
      setIsRunningTls(false);
    }
  };

  const tabs = [
    { id: 'tls',        label: 'TLS 1.3 Live Sockets',   icon: Lock,   tag: 'Native Python SSL', color: 'text-cyan-400' },
    { id: 'ipsec',      label: 'IPsec Architecture',     icon: Layers, tag: 'AH vs ESP',         color: 'text-teal-400' },
    { id: 'wireshark',  label: 'Wireshark Telemetry',    icon: Search, tag: 'Packet Inspection', color: 'text-sky-400' },
  ];

  const ipsecRows = [
    ['Confidentiality (Encryption)', 'NO (Plaintext payload)', true, 'YES (AES-CBC / AES-GCM)', false],
    ['Integrity & Authenticity',     'YES (HMAC / ICV)',        false, 'YES (ESP ICV MAC)',       false],
    ['Anti-Replay Protection',       'YES (Sequence numbers)',  false, 'YES (Sequence numbers)',  false],
    ['Protects Outer IP Header',     'YES (Immutable fields)',  false, 'NO (Outer IP clear)',     true ],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0c101b] via-[#0f1524] to-[#0c111d] border border-cyan-500/20 rounded-2xl p-6 shadow-xl shadow-black/40 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono-code uppercase tracking-wider text-cyan-400 font-semibold">
              OSI Layer 4 & Layer 3 Security
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-cyan-400" />
            Secure Industrial Transport & Network Protocols
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real local TLS 1.3 socket client-server demo with strict certificate verification, conceptual IPsec AH vs ESP architectural framing, and Wireshark capture guides.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#0a0e18] rounded-2xl border border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex-1 min-w-fit justify-center sm:justify-start btn-press ${
                isActive
                  ? 'bg-cyan-500/10 text-white border border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className={`font-mono-code text-[9px] px-2 py-0.5 rounded-full border ${
                isActive ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TLS DEMO ── */}
      {activeTab === 'tls' && (
        <div className="space-y-6 animate-fade-slide-up">
          <InfoBanner icon={Lock} color="alert-info text-cyan-300">
            <div>
              <strong>Transport Layer Security 1.3 — Native Python Socket Tunnel.</strong>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                Spawns a real localhost TLS socket connection via Python's standard <code className="text-cyan-300 font-mono">ssl</code> module. The client strictly validates the server X.509 certificate with <code className="text-cyan-300 font-mono">check_hostname=True</code> and <code className="text-cyan-300 font-mono">verify_mode=CERT_REQUIRED</code>. Encrypted using negotiated AEAD ciphers (TLS_AES_256_GCM_SHA384).
              </p>
            </div>
          </InfoBanner>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Live TLS Socket Handshake Test</span>
                </h3>
                <span className="text-[10px] font-mono-code text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  Port 8443 (Localhost)
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Executes an ephemeral client-server TLS 1.3 handshake on localhost, verifies certificate trust chain, and returns negotiated cipher suite details.
              </p>

              <button
                onClick={handleRunLiveTlsTest}
                disabled={isRunningTls}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all btn-press border border-cyan-400/30 disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isRunningTls ? 'animate-spin text-cyan-200' : 'fill-current'}`} />
                <span>{isRunningTls ? 'Negotiating Local TLS Handshake…' : 'Execute Local TLS 1.3 Test'}</span>
              </button>

              {tlsError && (
                <div className="p-3 rounded-xl alert-critical text-rose-300 text-xs">
                  <strong>Handshake Failed:</strong> {tlsError}
                </div>
              )}

              {tlsLiveResults && (
                <div className="p-4 rounded-xl bg-[#090d16] border border-cyan-500/30 space-y-3 text-xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Handshake Successful
                    </span>
                    <span className="font-mono-code text-cyan-400 font-bold">{tlsLiveResults.protocol_version}</span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono-code">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cipher Suite:</span>
                      <span className="text-cyan-300 font-semibold">{tlsLiveResults.cipher_suite}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hostname Checked:</span>
                      <span className="text-emerald-400 font-semibold">{tlsLiveResults.hostname_validated ? 'YES (Strict)' : 'NO'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latency:</span>
                      <span className="text-slate-200">{tlsLiveResults.handshake_latency_ms} ms</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                      Encrypted Telemetry Echo:
                    </span>
                    <div className="p-2.5 rounded-lg bg-[#0e1320] border border-slate-800 text-slate-200 font-mono-code text-[11px]">
                      {tlsLiveResults.echoed_payload}
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            <Panel>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Terminal className="w-4 h-4" />
                </div>
                <span>Standalone Native TLS Client & Server</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You can run the server and client as standalone Python terminal processes to inspect the raw socket exchange:
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                    1. Launch TLS Server (Port 8443)
                  </span>
                  <CodeBlock code="python backend/tls_demo/server.py" language="powershell" />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                    2. Launch TLS Client
                  </span>
                  <CodeBlock code="python backend/tls_demo/client.py" language="powershell" />
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── IPSEC SIMULATOR ── */}
      {activeTab === 'ipsec' && (
        <div className="space-y-6 animate-fade-slide-up">
          <InfoBanner icon={Layers} color="alert-warning text-amber-300">
            <div>
              <strong>Disclosure — Pedagogical Network-Layer Protocol Modeling.</strong>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                Real IPsec operates inside the OS kernel network stack (ESP/AH protocol numbers 50/51). This interactive model illustrates packet encapsulation differences between Authentication Header (AH) and Encapsulating Security Payload (ESP) without modifying operating system routing tables.
              </p>
            </div>
          </InfoBanner>

          <Panel>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                IPsec Security Associations: AH vs ESP Capability Matrix
              </h3>
              <span className="text-[10px] font-mono-code text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                RFC 4301 Architecture
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3">Security Service</th>
                    <th className="pb-3">Authentication Header (AH)</th>
                    <th className="pb-3">Encapsulating Security Payload (ESP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-code">
                  {ipsecRows.map(([service, ah, ahAlert, esp, espAlert], idx) => (
                    <tr key={idx} className="table-row-hover">
                      <td className="py-3 font-semibold text-white font-sans">{service}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                          ahAlert ? 'bg-rose-950/40 text-rose-300 border-rose-500/30' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {ah}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                          espAlert ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {esp}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ── WIRESHARK GUIDE ── */}
      {activeTab === 'wireshark' && (
        <div className="space-y-6 animate-fade-slide-up">
          <InfoBanner icon={Search} color="alert-info text-cyan-300">
            <div>
              <strong>Wireshark Telemetry & Packet Capture Filters.</strong>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                Wireshark allows real-time packet inspection of industrial networks. Use the capture and display filters below to isolate our encrypted TLS socket frames from background operating system noise.
              </p>
            </div>
          </InfoBanner>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Recommended Capture Filters</span>
              </h3>
              <p className="text-xs text-slate-400">Apply before starting capture to only record our TLS test traffic:</p>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">Capture Filter:</span>
                  <CodeBlock code="tcp port 8443" language="wireshark" />
                </div>
                <div>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">Display Filter (TLS 1.3 Handshake):</span>
                  <CodeBlock code="tls.handshake.type == 1" language="wireshark" />
                </div>
              </div>
            </Panel>

            <Panel>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>What to Verify in Captured Packets</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                  <span><strong>Client Hello:</strong> Inspect supported cipher suites including TLS_AES_256_GCM_SHA384.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                  <span><strong>Server Certificate:</strong> Confirm public key and Common Name match "localhost".</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span><strong>Application Data:</strong> Industrial telemetry is completely encrypted — raw payload is unreadable without session keys.</span>
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};
