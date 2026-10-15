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
  Server
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d1629]/70 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Secure Industrial Communication (Module 4)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Covers transport-layer security (real local TLS 1.3 client-server socket demo), network-layer security (conceptual IPsec AH & ESP simulator), and Wireshark traffic inspection guide.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tls')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'tls'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Real Local TLS 1.3 Demo</span>
          <span className="text-[10px] font-mono-code text-cyan-300 bg-cyan-950/60 px-1 rounded border border-cyan-500/30">
            Real Python Sockets
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ipsec')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'ipsec'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-400" />
          <span>IPsec Conceptual Simulator</span>
          <span className="text-[10px] font-mono-code text-amber-400 bg-amber-950/60 px-1 rounded border border-amber-500/30">
            Conceptual Model
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wireshark')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'wireshark'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
          }`}
        >
          <Search className="w-4 h-4 text-blue-400" />
          <span>Wireshark Inspection Guide</span>
          <span className="text-[10px] font-mono-code text-blue-300 bg-blue-950/60 px-1 rounded border border-blue-500/30">
            Optional Tool
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: REAL LOCAL TLS DEMO */}
      {activeTab === 'tls' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 text-xs leading-relaxed flex items-start gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>Transport Layer Security (TLS 1.3 / 1.2) Implementation:</strong>
              <p className="mt-0.5 text-cyan-400/90">
                This feature demonstrates an actual, functional local TLS socket connection using Python's standard <code className="text-cyan-300">ssl</code> module. The client strictly validates the server X.509 certificate and hostname (<code className="text-cyan-300">check_hostname=True</code>, <code className="text-cyan-300">verify_mode=CERT_REQUIRED</code>). Communication is encrypted using negotiated AEAD ciphers (e.g. TLS_AES_256_GCM_SHA384).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Socket Handshake Test Runner */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Live TLS Socket Handshake Test</h3>
                <span className="text-[11px] font-mono-code text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Local Python SSL
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Click below to spawn an ephemeral TLS server socket and client in the backend, perform the full TLS 1.3 cryptographic handshake on localhost, and inspect the negotiated socket parameters.
              </p>

              <button
                onClick={handleRunLiveTlsTest}
                disabled={isRunningTls}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isRunningTls ? 'animate-pulse' : ''}`} />
                <span>{isRunningTls ? 'Negotiating Local TLS Handshake...' : 'Execute Live TLS Handshake Test'}</span>
              </button>

              {tlsLiveResults && (
                <div className="p-4 rounded-lg bg-[#070d19] border border-cyan-500/40 space-y-2 text-xs font-mono-code">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-sans">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real TLS Connection Established Successfully!</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Negotiated Protocol:</span>
                    <span className="text-cyan-300 font-bold">{tlsLiveResults.results.tls_version}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Negotiated Cipher:</span>
                    <span className="text-teal-300">{tlsLiveResults.results.cipher_suite}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Test Socket Port:</span>
                    <span className="text-slate-200">127.0.0.1:{tlsLiveResults.test_port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hostname Verification:</span>
                    <span className="text-emerald-400 font-sans font-bold">PASSED (Strict localhost match)</span>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 font-sans">
                    <strong>Decrypted Reply from TLS Server:</strong>
                    <div className="mt-1 p-2 rounded bg-slate-900 text-slate-200 font-mono-code">
                      {JSON.stringify(tlsLiveResults.results.payload_exchanged)}
                    </div>
                  </div>
                </div>
              )}

              {tlsError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>TLS Handshake Failed</span>
                  </div>
                  <p className="text-[11px]">{tlsError}</p>
                </div>
              )}
            </div>

            {/* Standalone Terminal CLI Instructions */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <span>Standalone Terminal CLI Demo</span>
                </h3>
                <span className="text-[11px] font-mono-code text-slate-400">
                  server.py & client.py
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                You can also run the standalone Python client and server directly from your terminal on port 8443:
              </p>

              <div>
                <span className="text-xs font-semibold text-cyan-400 block mb-1">
                  Terminal 1: Start TLS Server (port 8443)
                </span>
                <CodeBlock 
                  code="python backend/tls_demo/server.py" 
                  language="powershell" 
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-teal-400 block mb-1">
                  Terminal 2: Run TLS Client (Strict Verification)
                </span>
                <CodeBlock 
                  code="python backend/tls_demo/client.py" 
                  language="powershell" 
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Technical Note:</strong> The standalone client uses <code className="text-cyan-300">server_cert.pem</code> as its trusted CA (<code className="text-cyan-300">cafile</code>) to authenticate the localhost certificate without turning off SSL security.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: IPSEC CONCEPTUAL SIMULATOR */}
      {activeTab === 'ipsec' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Educational Conceptual Simulation (Module 4):</strong>
              <p className="mt-0.5 text-amber-400/90">
                IPsec provides security at the Network Layer (OSI Layer 3). In production critical infrastructure, IPsec runs inside the operating system kernel or edge hardware firewalls/VPN gateways. This section simulates the architecture, protocol differences (AH vs ESP), and packet structures for educational clarity.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Select IPsec Operational Mode:</span>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setIpsecMode('transport')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  ipsecMode === 'transport'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Transport Mode (Host-to-Host)
              </button>
              <button
                onClick={() => setIpsecMode('tunnel')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  ipsecMode === 'tunnel'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tunnel Mode (Gateway-to-Gateway / VPN)
              </button>
            </div>
          </div>

          {/* Side-by-Side: AH vs ESP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Header (AH) */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Authentication Header (AH)</h3>
                <span className="text-[11px] font-mono-code text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  IP Protocol 51
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Confidentiality (Encryption):</span>
                  <span className="text-rose-400 font-bold font-sans">NO (Plaintext readable)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Integrity & Authenticity:</span>
                  <span className="text-emerald-400 font-bold font-sans">YES (HMAC / ICV)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Anti-Replay Protection:</span>
                  <span className="text-emerald-400 font-bold font-sans">YES (Sequence numbers)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protects Outer IP Header:</span>
                  <span className="text-emerald-400 font-bold font-sans">YES (Immutable fields)</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Packet Layout ({ipsecMode.toUpperCase()} MODE):
                </span>
                <div className="flex flex-wrap gap-1 font-mono-code text-[11px]">
                  {ipsecMode === 'transport' ? (
                    <>
                      <span className="p-1.5 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded">IP Header</span>
                      <span className="p-1.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded font-bold">AH Header (51)</span>
                      <span className="p-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">TCP / Port 502 (Modbus)</span>
                      <span className="p-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">Industrial Telemetry</span>
                    </>
                  ) : (
                    <>
                      <span className="p-1.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 rounded font-bold">New IP Header (Tunnel)</span>
                      <span className="p-1.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded font-bold">AH Header (51)</span>
                      <span className="p-1.5 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded">Original IP Header</span>
                      <span className="p-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">TCP / Industrial Payload</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Encapsulating Security Payload (ESP) */}
            <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Encapsulating Security Payload (ESP)</h3>
                <span className="text-[11px] font-mono-code text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  IP Protocol 50
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Confidentiality (Encryption):</span>
                  <span className="text-emerald-400 font-bold font-sans">YES (AES-CBC / AES-GCM)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Integrity & Authenticity:</span>
                  <span className="text-emerald-400 font-bold font-sans">YES (ESP ICV MAC)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-400">Anti-Replay Protection:</span>
                  <span className="text-emerald-400 font-bold font-sans">YES (Sequence numbers)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protects Outer IP Header:</span>
                  <span className="text-rose-400 font-bold font-sans">NO (Header in clear)</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Packet Layout ({ipsecMode.toUpperCase()} MODE):
                </span>
                <div className="flex flex-wrap gap-1 font-mono-code text-[11px]">
                  {ipsecMode === 'transport' ? (
                    <>
                      <span className="p-1.5 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded">IP Header</span>
                      <span className="p-1.5 bg-teal-950/60 border border-teal-500/40 text-teal-300 rounded font-bold">ESP Header (50)</span>
                      <span className="p-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded font-bold">Encrypted [TCP + Payload]</span>
                      <span className="p-1.5 bg-teal-950/60 border border-teal-500/40 text-teal-300 rounded">ESP Trailer & Auth</span>
                    </>
                  ) : (
                    <>
                      <span className="p-1.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 rounded font-bold">New IP Header (VPN)</span>
                      <span className="p-1.5 bg-teal-950/60 border border-teal-500/40 text-teal-300 rounded font-bold">ESP Header (50)</span>
                      <span className="p-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded font-bold">Encrypted [Original IP + TCP + Payload]</span>
                      <span className="p-1.5 bg-teal-950/60 border border-teal-500/40 text-teal-300 rounded">ESP Trailer & Auth</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WIRESHARK PACKET INSPECTION GUIDE */}
      {activeTab === 'wireshark' && (
        <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Wireshark Local Packet Inspection Guide (Optional Tool)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow these instructions to inspect local TLS 1.3 handshakes, certificates, and encrypted SCADA application data frames on your machine.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-blue-300 text-xs">
            <strong>Capture Scope:</strong> Wireshark packet captures are performed locally by the user using Wireshark / Npcap. The steps below guide you through inspecting localhost port 8443 traffic.
          </div>

          <div className="space-y-3">
            {wiresharkGuide?.steps?.map((step) => (
              <div key={step.step} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[11px]">
                    {step.step}
                  </span>
                  <span>{step.title}</span>
                </div>
                <p className="text-slate-300 text-[11px] pl-7 leading-relaxed">
                  {step.details}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-[#070d19] border border-slate-800 text-xs space-y-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block">
              Quick Wireshark Display Filter Cheat Sheet:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono-code text-[11px]">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-cyan-400">tcp.port == 8443</span>
                <p className="text-slate-500 text-[10px] font-sans">Filter all traffic to our TLS SCADA port</p>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-teal-400">tls.handshake.type == 1</span>
                <p className="text-slate-500 text-[10px] font-sans">Filter for Client Hello packets</p>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-indigo-400">tls.handshake.type == 2</span>
                <p className="text-slate-500 text-[10px] font-sans">Filter for Server Hello packets</p>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-emerald-400">tls.record.content_type == 23</span>
                <p className="text-slate-500 text-[10px] font-sans">Encrypted Application Data frames</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
