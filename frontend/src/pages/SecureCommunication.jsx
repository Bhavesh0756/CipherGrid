import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Lock, 
  Terminal, 
  Layers, 
  Network, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Play,
  Search,
  RefreshCw
} from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 card-hover space-y-4 ${className}`}>
    {children}
  </div>
);

const InfoBanner = ({ icon: Icon, color, children }) => (
  <div className={`p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3 ${color}`}>
    <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
    <div>{children}</div>
  </div>
);

export const SecureCommunication = () => {
  const [activeTab, setActiveTab] = useState('tls');
  const [tlsStatus, setTlsStatus] = useState(null);
  const [isRunningTls, setIsRunningTls] = useState(false);
  const [tlsLiveResults, setTlsLiveResults] = useState(null);
  const [tlsError, setTlsError] = useState(null);
  const [ipsecSpec, setIpsecSpec] = useState(null);
  const [ipsecMode, setIpsecMode] = useState('transport');
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
    { id: 'tls',        label: 'TLS 1.3 Socket Demo',   icon: Lock,   tag: 'Real Python',   color: 'text-sky-400' },
    { id: 'ipsec',      label: 'IPsec Simulator',        icon: Layers, tag: 'Conceptual',    color: 'text-teal-400' },
    { id: 'wireshark',  label: 'Wireshark Guide',        icon: Search, tag: 'Inspection',    color: 'text-blue-400' },
  ];

  const ipsecRows = [
    ['Confidentiality (Encryption)', 'NO (Plaintext readable)', true, 'YES (AES-CBC / AES-GCM)', false],
    ['Integrity & Authenticity',     'YES (HMAC / ICV)',        false, 'YES (ESP ICV MAC)',       false],
    ['Anti-Replay Protection',       'YES (Sequence numbers)',  false, 'YES (Sequence numbers)',  false],
    ['Protects Outer IP Header',     'YES (Immutable fields)',  false, 'NO (Header in clear)',   true ],
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 flowing-border">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          Secure Communication Channels
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Transport Layer Security (real local TLS 1.3 socket demo), Network Layer security (conceptual IPsec AH & ESP simulator), and Wireshark inspection guide.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-[#080f1e] rounded-xl border border-[#1a2844]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 min-w-fit justify-center sm:justify-start btn-press ${
                isActive
                  ? 'bg-[#0c1428] text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1428]/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-500'}`} />
              <span className="hidden sm:block">{tab.label}</span>
              <span className={`font-mono-code text-[9px] px-1.5 rounded border ${
                isActive ? 'bg-sky-950/40 border-sky-500/30 text-sky-400' : 'bg-[#080f1e] border-[#1a2844] text-slate-600'
              }`}>
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TLS DEMO ── */}
      {activeTab === 'tls' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={Lock} color="alert-info text-sky-300">
            <strong>Transport Layer Security 1.3 — Real Python Socket Implementation.</strong>
            <p className="mt-0.5 opacity-80">
              This spawns an actual local TLS client-server connection using Python's standard <code className="text-sky-300">ssl</code> module. The client validates the server X.509 certificate with <code className="text-sky-300">check_hostname=True</code> and <code className="text-sky-300">verify_mode=CERT_REQUIRED</code>. Communication uses negotiated AEAD ciphers (e.g. TLS_AES_256_GCM_SHA384).
            </p>
          </InfoBanner>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Live TLS Socket Handshake</h3>
                <span className="text-[10px] font-mono-code text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/30">
                  Local Python SSL
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Spawns an ephemeral TLS 1.3 server + client in the backend, performs the full cryptographic handshake on localhost, and returns the negotiated socket parameters.
              </p>

              <button
                onClick={handleRunLiveTlsTest}
                disabled={isRunningTls}
                className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-950/40 flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isRunningTls ? 'animate-pulse' : ''}`} />
                <span>{isRunningTls ? 'Negotiating Handshake…' : 'Execute Live TLS Handshake Test'}</span>
              </button>

              {tlsLiveResults && (
                <div className="p-4 rounded-lg code-block border-sky-500/30 border space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    TLS Connection Established Successfully
                  </div>
                  {[
                    ['Protocol', tlsLiveResults.results.tls_version, 'text-sky-300'],
                    ['Cipher Suite', tlsLiveResults.results.cipher_suite, 'text-teal-300'],
                    ['Test Port', `127.0.0.1:${tlsLiveResults.test_port}`, 'text-slate-200'],
                    ['Hostname Verification', 'PASSED (strict localhost)', 'text-emerald-400'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex justify-between border-b border-[#1a2844] pb-1.5 text-xs font-mono-code">
                      <span className="text-slate-500">{k}</span>
                      <span className={`${c} font-bold`}>{v}</span>
                    </div>
                  ))}
                  <div className="pt-1 text-[11px] text-slate-400">
                    <strong className="text-slate-300">Decrypted TLS Payload:</strong>
                    <div className="mt-1 p-2 rounded bg-[#030712] border border-[#1a2844] text-slate-200 font-mono-code">
                      {JSON.stringify(tlsLiveResults.results.payload_exchanged)}
                    </div>
                  </div>
                </div>
              )}

              {tlsError && (
                <div className="p-3 rounded-lg alert-critical text-rose-300 text-xs animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    TLS Handshake Failed
                  </div>
                  <p className="text-[11px] opacity-80">{tlsError}</p>
                </div>
              )}
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                Standalone Terminal CLI Demo
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Run the standalone Python client and server directly from your terminal on port 8443:
              </p>

              <div>
                <span className="text-xs font-semibold text-sky-400 block mb-1.5">Terminal 1 — Start TLS Server (port 8443)</span>
                <CodeBlock code="python backend/tls_demo/server.py" language="powershell" />
              </div>

              <div>
                <span className="text-xs font-semibold text-teal-400 block mb-1.5">Terminal 2 — Run TLS Client (Strict Verification)</span>
                <CodeBlock code="python backend/tls_demo/client.py" language="powershell" />
              </div>

              <div className="p-3 rounded-lg bg-[#080f1e] border border-[#1a2844] text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Technical Note:</strong> The standalone client uses <code className="text-sky-300">server_cert.pem</code> as its trusted CA (<code className="text-sky-300">cafile</code>) to authenticate the localhost certificate without disabling SSL verification.
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── IPSEC SIMULATOR ── */}
      {activeTab === 'ipsec' && (
        <div className="space-y-5 animate-fade-slide-up">
          <InfoBanner icon={AlertTriangle} color="alert-warning text-amber-300">
            <strong>Conceptual Educational Simulation — IPsec Network Layer Security.</strong>
            <p className="mt-0.5 opacity-80">
              IPsec operates at OSI Layer 3 (Network Layer). In production, it runs inside the OS kernel or edge firewall/VPN gateways. This section simulates the architecture, AH vs ESP differences, and packet structures.
            </p>
          </InfoBanner>

          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">IPsec Operational Mode:</span>
            <div className="flex bg-[#080f1e] p-1 rounded-lg border border-[#1a2844] text-xs gap-1">
              {['transport', 'tunnel'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setIpsecMode(mode)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all btn-press capitalize ${
                    ipsecMode === mode
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode} Mode {mode === 'transport' ? '(Host-to-Host)' : '(Gateway / VPN)'}
                </button>
              ))}
            </div>
          </div>

          {/* AH vs ESP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'Authentication Header (AH)',
                tag: 'IP Protocol 51',
                tagColor: 'text-sky-400 bg-sky-950/40 border-sky-500/30',
                layout: ipsecMode === 'transport' ? [
                  ['IP Header', 'text-blue-300 bg-blue-950/40 border-blue-500/30'],
                  ['AH Header (51)', 'text-sky-300 bg-sky-950/50 border-sky-500/40 font-bold'],
                  ['TCP / Port 502 (Modbus)', 'text-slate-300 bg-slate-800/40 border-slate-700/40'],
                  ['Industrial Telemetry', 'text-slate-300 bg-slate-800/40 border-slate-700/40'],
                ] : [
                  ['New IP Header (Tunnel)', 'text-purple-300 bg-purple-950/40 border-purple-500/30 font-bold'],
                  ['AH Header (51)', 'text-sky-300 bg-sky-950/50 border-sky-500/40 font-bold'],
                  ['Original IP Header', 'text-blue-300 bg-blue-950/40 border-blue-500/30'],
                  ['TCP + Payload', 'text-slate-300 bg-slate-800/40 border-slate-700/40'],
                ],
              },
              {
                title: 'Encapsulating Security Payload (ESP)',
                tag: 'IP Protocol 50',
                tagColor: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
                layout: ipsecMode === 'transport' ? [
                  ['IP Header', 'text-blue-300 bg-blue-950/40 border-blue-500/30'],
                  ['ESP Header (50)', 'text-teal-300 bg-teal-950/50 border-teal-500/40 font-bold'],
                  ['Encrypted [TCP + Payload]', 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40 font-bold'],
                  ['ESP Trailer & Auth', 'text-teal-300 bg-teal-950/40 border-teal-500/30'],
                ] : [
                  ['New IP Header (VPN)', 'text-purple-300 bg-purple-950/40 border-purple-500/30 font-bold'],
                  ['ESP Header (50)', 'text-teal-300 bg-teal-950/50 border-teal-500/40 font-bold'],
                  ['Encrypted [Original IP + TCP + Payload]', 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40 font-bold'],
                  ['ESP Trailer & Auth', 'text-teal-300 bg-teal-950/40 border-teal-500/30'],
                ],
              },
            ].map((proto) => (
              <Panel key={proto.title}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">{proto.title}</h3>
                  <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded border ${proto.tagColor}`}>{proto.tag}</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {ipsecRows.map(([label, ahVal, ahBad, espVal, espBad]) => {
                    const isAh = proto.title.includes('AH');
                    const val = isAh ? ahVal : espVal;
                    const bad = isAh ? ahBad : espBad;
                    return (
                      <div key={label} className="flex justify-between border-b border-[#1a2844] pb-1.5">
                        <span className="text-slate-500">{label}</span>
                        <span className={`font-bold text-[11px] ${bad ? 'text-rose-400' : 'text-emerald-400'}`}>{val}</span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                    Packet Layout ({ipsecMode.toUpperCase()} MODE)
                  </span>
                  <div className="flex flex-wrap gap-1 font-mono-code text-[10px]">
                    {proto.layout.map(([label, cls], i) => (
                      <span key={i} className={`p-1.5 rounded border ${cls}`}>{label}</span>
                    ))}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {/* ── WIRESHARK GUIDE ── */}
      {activeTab === 'wireshark' && (
        <div className="space-y-5 animate-fade-slide-up">
          <Panel>
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Wireshark Local Packet Inspection Guide
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect local TLS 1.3 handshakes, X.509 certificates, and encrypted SCADA data frames on your machine.
              </p>
            </div>

            <div className="p-3 rounded-lg alert-info text-sky-300 text-xs">
              <strong>Capture Scope:</strong> Performed locally using Wireshark / Npcap. Steps below guide you through inspecting localhost port 8443 traffic.
            </div>

            <div className="space-y-2">
              {wiresharkGuide?.steps?.map((step) => (
                <div key={step.step} className="p-3.5 rounded-lg bg-[#080f1e] border border-[#1a2844] text-xs space-y-1">
                  <div className="flex items-center gap-2 text-sky-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-[10px] font-mono-code shrink-0">
                      {step.step}
                    </span>
                    <span>{step.title}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pl-7 leading-relaxed">{step.details}</p>
                </div>
              ))}
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">Quick Display Filter Cheatsheet</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono-code text-[11px]">
                {[
                  ['tcp.port == 8443', 'All traffic to TLS SCADA port', 'text-sky-400'],
                  ['tls.handshake.type == 1', 'Client Hello packets', 'text-teal-400'],
                  ['tls.handshake.type == 2', 'Server Hello packets', 'text-violet-400'],
                  ['tls.record.content_type == 23', 'Encrypted Application Data frames', 'text-emerald-400'],
                ].map(([filter, desc, color]) => (
                  <div key={filter} className="p-2.5 code-block rounded-lg">
                    <span className={color}>{filter}</span>
                    <p className="text-slate-500 text-[10px] font-sans mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};
