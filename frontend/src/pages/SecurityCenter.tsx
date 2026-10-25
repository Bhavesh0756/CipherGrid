import React, { useEffect, useState } from 'react';
/**
 * SecurityCenter Component
 * Security configuration cockpit for cryptographic suite selection, RBAC policy enforcement, and MITM adversarial triggers.
 * Fully backend-driven with real AES-256-GCM AEAD, SHA-256 digest calculation, and RSA-PSS 2048-bit signatures.
 */
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  FileCode,
  Key,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  XCircle,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { TamperedValueCard } from '../components/NetworkLab/TamperedValueCard';

const SCENARIO_DEFS = [
  { id: 'normal', name: 'Normal Secure Communication', objective: 'Deliver authorized telemetry with AES-256-GCM authenticated encryption and RSA-PSS signature.' },
  { id: 'tampering', name: 'Message Tampering (MITM)', objective: 'Detect bit alteration of ciphertext in transit via SHA-256 and AEAD authentication tag.' },
  { id: 'bad_signature', name: 'Invalid Digital Signature', objective: 'Reject forged or corrupted RSA-PSS 2048-bit digital signature from untrusted actor.' },
  { id: 'unauthorized_device', name: 'Unauthorized Device (RBAC)', objective: 'Reject untrusted or non-whitelisted device communication violating least-privilege.' },
  { id: 'replay_attempt', name: 'Replay Attack Detection', objective: 'Detect and reject repeated stale message identifiers cached in SQLite.' },
  { id: 'bad_auth_tag', name: 'Invalid AES-GCM Auth Tag', objective: 'Reject payload when 128-bit MAC authentication tag fails GCM integrity check.' },
  { id: 'missing_path', name: 'Missing Network Route', objective: 'Detect unreachable or broken physical link via BFS graph pathfinder.' },
  { id: 'disabled_destination', name: 'Disabled Destination Node', objective: 'Reject message transmission when target device is administratively offline.' },
  { id: 'recovery', name: 'Recovery After Rejection', objective: 'Verify state machine cleanly recovers to deliver valid payload after violation.' },
];

export const SecurityCenter: React.FC = () => {
  const {
    devices,
    scenarioResults,
    selectedScenario,
    setSelectedScenario,
    runScenario,
    runAllScenarios,
    isRunningScenarios,
  } = useSimulatorStore();

  const [activeTab, setActiveTab] = useState<'scenarios' | 'workbench'>('scenarios');

  // Workbench Interactive State (Backend Driven)
  const [workbenchPayload, setWorkbenchPayload] = useState('temperature=42.5;pressure=101.3;unit=celsius');
  const [workbenchDevice, setWorkbenchDevice] = useState('');
  const [tamperPayload, setTamperPayload] = useState(false);
  const [tamperCiphertext, setTamperCiphertext] = useState(false);
  const [tamperTag, setTamperTag] = useState(false);
  const [tamperSignature, setTamperSignature] = useState(false);
  const [isWorkbenchExecuting, setIsWorkbenchExecuting] = useState(false);
  const [workbenchResult, setWorkbenchResult] = useState<any>(null);

  // Dedicated Live SHA-256 Hasher State (Backend Driven)
  const [shaInput, setShaInput] = useState('temperature=42.5;pressure=101.3;unit=celsius');
  const [shaComputedDigest, setShaComputedDigest] = useState('');
  const [shaExpectedDigest, setShaExpectedDigest] = useState('');
  const [shaVerificationResult, setShaVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isComputingHash, setIsComputingHash] = useState(false);

  // Dedicated Live RSA-PSS Signer State (Backend Driven)
  const [signDeviceId, setSignDeviceId] = useState('');
  const [signPayloadText, setSignPayloadText] = useState('CMD: OPEN_VALVE_04; TARGET: RTU-01; AUTH_CODE: 0x9A4F');
  const [signResult, setSignResult] = useState<{ signature_b64: string; digest: string; algorithm: string; public_key_pem?: string } | null>(null);
  const [verifySigResult, setVerifySigResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isVerifyingSig, setIsVerifyingSig] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Set default selected device once loaded
  useEffect(() => {
    if (devices.length > 0) {
      if (!workbenchDevice) setWorkbenchDevice(devices[0].id);
      if (!signDeviceId) setSignDeviceId(devices[0].id);
    }
  }, [devices]);

  // Initial Scenario run
  useEffect(() => {
    if (scenarioResults.length === 0) {
      runScenario('normal');
    }
  }, []);

  // Run initial workbench verification on mount
  useEffect(() => {
    const runInitialWorkbench = async () => {
      try {
        const devId = devices[0]?.id || 'Sensor-01';
        const res = await api.verifyCryptoWorkbench({
          payload: workbenchPayload,
          device_id: devId,
          tamper_payload: false,
          tamper_ciphertext: false,
          tamper_tag: false,
          tamper_signature: false,
        });
        setWorkbenchResult(res);
      } catch {
        // ignore
      }
    };
    runInitialWorkbench();
  }, [devices]);

  // Live Backend SHA-256 calculation on input change
  useEffect(() => {
    if (!shaInput.trim()) {
      setShaComputedDigest('');
      setShaVerificationResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsComputingHash(true);
      try {
        const res = await api.computeHash(shaInput);
        setShaComputedDigest(res.digest);
      } catch {
        // ignore
      } finally {
        setIsComputingHash(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [shaInput]);

  // Handler to execute complete backend cryptographic pipeline
  const executeWorkbench = async () => {
    setIsWorkbenchExecuting(true);
    try {
      const devId = workbenchDevice || devices[0]?.id || 'Sensor-01';
      const res = await api.verifyCryptoWorkbench({
        payload: workbenchPayload,
        device_id: devId,
        tamper_payload: tamperPayload,
        tamper_ciphertext: tamperCiphertext,
        tamper_tag: tamperTag,
        tamper_signature: tamperSignature,
      });
      setWorkbenchResult(res);
    } catch (err: any) {
      console.error('Workbench execution failed:', err);
    } finally {
      setIsWorkbenchExecuting(false);
    }
  };

  // Handler for backend SHA-256 verification
  const handleVerifyHash = async () => {
    if (!shaExpectedDigest) return;
    try {
      const res = await api.verifyHash(shaInput, shaExpectedDigest);
      setShaVerificationResult({ valid: res.valid, message: res.message });
    } catch (err: any) {
      setShaVerificationResult({ valid: false, message: err.message || 'Verification request failed' });
    }
  };

  // Handler for signing with real device private key
  const handleSignPayload = async () => {
    const devId = signDeviceId || devices[0]?.id;
    if (!devId) return;
    setIsSigning(true);
    setVerifySigResult(null);
    try {
      const res = await api.signPayload(devId, signPayloadText);
      setSignResult(res);
    } catch (err: any) {
      console.error('Signing failed:', err);
    } finally {
      setIsSigning(false);
    }
  };

  // Handler for verifying signature with real device public key
  const handleVerifySignature = async () => {
    if (!signResult?.signature_b64) return;
    const devId = signDeviceId || devices[0]?.id;
    setIsVerifyingSig(true);
    try {
      const res = await api.verifySignature({
        deviceId: devId,
        payload: signPayloadText,
        signatureB64: signResult.signature_b64,
      });
      setVerifySigResult({ valid: res.valid, message: res.message });
    } catch (err: any) {
      setVerifySigResult({ valid: false, message: err.message || 'Signature verification request failed' });
    } finally {
      setIsVerifyingSig(false);
    }
  };

  const activeResult = selectedScenario || scenarioResults[0] || null;
  const passed = scenarioResults.filter((r) => r.pass_status).length;
  const total = SCENARIO_DEFS.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  SECURITY DEFENSE CENTER & CRYPTO WORKBENCH
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  BACKEND-DRIVEN CRYPTO ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Empirical verification of AES-256-GCM, RSA-PSS signatures, SHA-256 digests & industrial RBAC
              </p>
            </div>
          </div>

          {/* Scenario Progress */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-mono font-bold text-slate-200">
                {passed}/{scenarioResults.length} RUN · <span className="text-emerald-400">{passed} PASSED</span>
              </div>
              <div className="w-36 h-2 bg-slate-900 rounded-full mt-1 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: scenarioResults.length ? `${(passed / scenarioResults.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
            {activeTab === 'scenarios' && (
              <button
                onClick={runAllScenarios}
                disabled={isRunningScenarios}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer font-mono"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunningScenarios ? 'Running Tests…' : 'Run All 9 Tests'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-3 font-mono text-xs">
          {[
            { id: 'scenarios' as const, label: 'REPEATABLE TEST SCENARIOS' },
            { id: 'workbench' as const, label: 'CRYPTOGRAPHIC DISSECTION WORKBENCH' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'scenarios' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Scenarios List */}
          <div className="w-80 bg-[#080d1a] border-r border-slate-800/80 flex flex-col overflow-y-auto shrink-0">
            <div className="px-4 py-2 border-b border-slate-800/80 bg-[#060913]/90 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                SCENARIO SUITE ({scenarioResults.length}/{total})
              </span>
              <span className="text-[9.5px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                AUTO-EVAL
              </span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {SCENARIO_DEFS.map((def, idx) => {
                const res = scenarioResults.find((r) => r.scenario_id === def.id);
                const isSelected = activeResult?.scenario_id === def.id;
                return (
                  <div
                    key={def.id}
                    onClick={() => { if (res) setSelectedScenario(res); else runScenario(def.id); }}
                    className={`px-4 py-3 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-rose-950/30 border-l-4 border-l-rose-500 shadow-inner'
                        : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[9.5px] font-mono text-slate-400 mb-0.5">
                          TEST #{String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="text-xs font-bold text-slate-100 leading-snug font-display">
                          {def.name}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {def.objective}
                        </p>
                      </div>
                      <div className="shrink-0 pt-2">
                        {res ? (
                          res.pass_status ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-700" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); runScenario(def.id); }}
                      disabled={isRunningScenarios}
                      className="mt-2 text-[10px] font-mono text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Execute Test</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Execution Result */}
          <div className="flex-1 overflow-y-auto px-6 py-6 select-text bg-[#070b14]">
            {activeResult ? (
              <div className="max-w-3xl space-y-4">
                {/* Status Hero Card */}
                <div className={`p-5 rounded-2xl border ${
                  activeResult.pass_status
                    ? 'bg-[#0d1e1d] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-[#1f0d14] border-rose-500/40 shadow-lg shadow-rose-500/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {activeResult.pass_status ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-400" />
                      )}
                      <div>
                        <h2 className="text-base font-bold text-white font-display">
                          {activeResult.name}
                        </h2>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {activeResult.objective}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider ${
                      activeResult.pass_status
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {activeResult.pass_status ? 'VERIFIED PASS' : 'FAILED'}
                    </span>
                  </div>
                </div>

                {/* Expected vs Actual */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Expected Defense Behavior', value: activeResult.expected_outcome, color: 'text-blue-300' },
                    { label: 'Observed System Result', value: activeResult.actual_outcome, color: 'text-emerald-300' },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#0d1424] rounded-2xl border border-slate-800 p-4">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        {item.label}
                      </div>
                      <p className={`text-xs font-mono font-semibold leading-relaxed ${item.color}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Defensive Decision */}
                <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-4">
                  <div className="text-xs font-bold text-white font-display mb-2">
                    Security Engine Defensive Evaluation
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#060913] p-3 rounded-xl border border-slate-800 font-mono">
                    {activeResult.reason}
                  </p>
                </div>

                {/* Security Gates */}
                {activeResult.checks_executed && activeResult.checks_executed.length > 0 && (
                  <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-4">
                    <div className="text-xs font-bold text-white font-display mb-3">
                      Security Gates & Cryptographic Validation Passes
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeResult.checks_executed.map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#060913] rounded-xl border border-slate-800">
                          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-200">{chk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crypto Record */}
                {activeResult.security_record && (
                  <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-4">
                    <div className="text-xs font-bold text-white font-display mb-2">
                      Session Cryptographic Record (AES-256-GCM / SHA-256 / RSA-PSS)
                    </div>
                    <pre className="p-3 bg-[#060913] text-slate-300 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
                      {JSON.stringify(activeResult.security_record, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-mono">
                <Shield className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-xs">Select a scenario to inspect execution details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Cryptographic Dissection Workbench */
        <div className="flex-1 overflow-y-auto px-6 py-6 select-text space-y-6 bg-[#070b14]">
          {/* Header Description */}
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                    Comparative Cryptographic Dissection Workbench
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Live end-to-end pipeline computed by Python backend engine: AES-256-GCM AEAD, SHA-256 Digest, and RSA-PSS 2048-bit digital signature.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                100% BACKEND COMPUTED
              </span>
            </div>
          </div>

          {/* Interactive Pipeline Execution Cockpit */}
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  Live Cryptographic Pipeline Controls
                </span>
              </div>
              <button
                onClick={executeWorkbench}
                disabled={isWorkbenchExecuting}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer font-mono"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isWorkbenchExecuting ? 'animate-spin' : ''}`} />
                <span>{isWorkbenchExecuting ? 'Executing in Python Engine…' : 'Execute Backend Pipeline'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Source Device Identity & Registered Keystore:
                </label>
                <select
                  value={workbenchDevice}
                  onChange={(e) => setWorkbenchDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060913] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id}) - {d.trust_status} [Purdue: {d.purdue_level}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Plaintext OT Industrial Payload:
                </label>
                <input
                  type="text"
                  value={workbenchPayload}
                  onChange={(e) => setWorkbenchPayload(e.target.value)}
                  placeholder="e.g. temperature=42.5;pressure=101.3;unit=celsius"
                  className="w-full px-3 py-2 bg-[#060913] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Adversarial Tampering Injection Checkboxes */}
            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-2">
                Adversarial Wire Tampering Injection (Controlled bit-flips in Python memory buffer):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Tamper Payload (MITM)', checked: tamperPayload, setter: setTamperPayload },
                  { label: 'Tamper Ciphertext (Bit-flip)', checked: tamperCiphertext, setter: setTamperCiphertext },
                  { label: 'Tamper Auth Tag (MAC)', checked: tamperTag, setter: setTamperTag },
                  { label: 'Tamper Signature (RSA)', checked: tamperSignature, setter: setTamperSignature },
                ].map((item) => (
                  <label
                    key={item.label}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      item.checked
                        ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                        : 'bg-[#060913] border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Verdict Banner */}
          {workbenchResult && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              workbenchResult.pipeline_verdict?.intact
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-3">
                {workbenchResult.pipeline_verdict?.intact ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold font-display uppercase tracking-wider">
                    {workbenchResult.pipeline_verdict?.intact ? 'CRYPTOGRAPHIC ASSURANCE VERIFIED (ALL GATES PASSED)' : 'SECURITY POLICY VIOLATION DETECTED'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                    {workbenchResult.pipeline_verdict?.summary}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${
                workbenchResult.pipeline_verdict?.intact
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {workbenchResult.pipeline_verdict?.intact ? 'VERIFIED' : 'REJECTED'}
              </span>
            </div>
          )}

          {/* 3-Column Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 01 */}
            <div className="bg-[#0d1424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#080d1a]/80">
                <div>
                  <div className="text-[9px] font-mono text-slate-400">STEP 01</div>
                  <div className="text-xs font-bold text-white font-display">Original Plaintext Payload</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-slate-300 bg-slate-800 border-slate-700">
                  Sender Buffer
                </span>
              </div>
              <div className="p-4 space-y-2 font-mono text-xs">
                <div className="text-[10px] text-slate-400">Structured OT Parameters:</div>
                <pre className="p-3 bg-[#060913] text-slate-200 rounded-xl font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {workbenchResult?.payload || workbenchPayload}
                </pre>
                <div className="text-[10px] text-slate-400">
                  Transmitting Node: <span className="text-blue-400 font-semibold">{workbenchResult?.device_id || workbenchDevice}</span>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-[#0d1424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#080d1a]/80">
                <div>
                  <div className="text-[9px] font-mono text-slate-400">STEP 02</div>
                  <div className="text-xs font-bold text-white font-display">Encrypted Wire Transit</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/30">
                  AES-256-GCM AEAD
                </span>
              </div>
              <div className="p-4 space-y-2 font-mono text-xs">
                <div className="text-[10px] text-slate-400">96-bit Nonce (IV):</div>
                <div className="p-2 bg-[#060913] text-teal-400 rounded-lg text-[10px] truncate border border-slate-800">
                  {workbenchResult?.encryption?.nonce_b64 || 'Execute pipeline to generate'}
                </div>
                <div className="text-[10px] text-slate-400">Wire AEAD Ciphertext (Base64):</div>
                <pre className="p-2 bg-[#060913] text-amber-300 rounded-lg text-[10px] overflow-x-auto truncate border border-slate-800">
                  {workbenchResult?.encryption?.wire_ciphertext_b64 || 'Execute pipeline to generate'}
                </pre>
                <div className="text-[10px] text-slate-400">128-bit MAC Auth Tag (Base64):</div>
                <div className="p-2 bg-[#060913] text-amber-400 rounded-lg text-[10px] truncate border border-slate-800">
                  {workbenchResult?.encryption?.wire_tag_b64 || 'Execute pipeline to generate'}
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-[#0d1424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#080d1a]/80">
                <div>
                  <div className="text-[9px] font-mono text-slate-400">STEP 03</div>
                  <div className="text-xs font-bold text-white font-display">Receiver Decrypted Recovery</div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  workbenchResult?.encryption?.decryption_success
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                }`}>
                  {workbenchResult?.encryption?.decryption_success ? 'Decrypted Match' : 'AEAD Auth Failed'}
                </span>
              </div>
              <div className="p-4 space-y-2 font-mono text-xs">
                <div className="text-[10px] text-slate-400">Decrypted Payload:</div>
                <pre className={`p-3 bg-[#060913] rounded-xl font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap border border-slate-800 ${
                  workbenchResult?.encryption?.decryption_success ? 'text-emerald-300' : 'text-rose-400'
                }`}>
                  {workbenchResult?.encryption?.decryption_success
                    ? workbenchResult.encryption.recovered_payload
                    : `[REJECTED: ${workbenchResult?.encryption?.status_message || 'Tampered or Invalid AEAD Tag'}]`}
                </pre>

                {/* In-flight tampered parameter differential (e.g. 55 -> 60) */}
                {workbenchResult && !workbenchResult.encryption?.decryption_success && (
                  <TamperedValueCard
                    sentPayload={workbenchResult.payload || workbenchPayload}
                    receivedPayload={workbenchResult.encryption?.recovered_payload}
                    serverTamperDiff={workbenchResult.tamper_diff}
                  />
                )}
                <div className={`text-[10px] font-bold ${
                  workbenchResult?.encryption?.decryption_success ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  GCM Tag Integrity: {workbenchResult?.encryption?.decryption_success ? 'VALID AUTHENTIC' : 'CORRUPTED / TAMPERED'}
                </div>
              </div>
            </div>
          </div>

          {/* SHA-256 Comparison Panel */}
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl font-mono">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>SHA-256 Mathematical Integrity Verification</span>
              </div>
              {workbenchResult?.digest && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  workbenchResult.digest.matches
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {workbenchResult.digest.matches ? 'EXACT HASH MATCH' : 'HASH MISMATCH'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Sender Payload Digest:</div>
                <div className="p-2.5 bg-[#060913] text-purple-400 text-xs rounded-xl break-all border border-slate-800">
                  {workbenchResult?.digest?.sender_digest || 'Execute pipeline to compute'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Receiver Recomputed Digest:</div>
                <div className="p-2.5 bg-[#060913] text-purple-400 text-xs rounded-xl break-all border border-slate-800">
                  {workbenchResult?.digest?.receiver_digest || 'Pending recovery'}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Canonical key-value serialization hashed via SHA-256 ensures zero unauthorized bit-flips occurred during intermediate network hops.
            </p>
          </div>

          {/* RSA-PSS Digital Signature Panel */}
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl font-mono">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>RSA-PSS 2048-bit Probabilistic Digital Signature</span>
              </div>
              {workbenchResult?.digital_signature && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  workbenchResult.digital_signature.verification_success
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {workbenchResult.digital_signature.verification_success ? 'SIGNATURE VALID' : 'SIGNATURE REJECTED'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Sender signs payload with private key. Receiver validates authenticity against the pre-shared public key directory.
            </p>
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400">Base64 Encoded Signature:</div>
              <div className="p-3 bg-[#060913] text-slate-300 text-[10px] rounded-xl overflow-x-auto break-all border border-slate-800">
                {workbenchResult?.digital_signature?.wire_signature_b64 || 'Execute pipeline to generate'}
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                Verification Engine Message: <span className={workbenchResult?.digital_signature?.verification_success ? 'text-emerald-400' : 'text-rose-400'}>
                  {workbenchResult?.digital_signature?.status_message || 'Awaiting execution'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Dedicated Primitives Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Live SHA-256 Tool */}
            <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                    Interactive Live SHA-256 Hasher
                  </span>
                </div>
                {isComputingHash && (
                  <span className="text-[10px] text-purple-400 animate-pulse font-mono">Computing in backend…</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Type any text below. The input is transmitted to the backend crypto engine to recalculate the actual SHA-256 digest in real time.
              </p>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Input String:</label>
                <input
                  type="text"
                  value={shaInput}
                  onChange={(e) => setShaInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060913] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Real SHA-256 Digest (Backend API):</span>
                  {shaComputedDigest && (
                    <button
                      onClick={() => copyToClipboard(shaComputedDigest, 'sha')}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'sha' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'sha' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <div className="p-2.5 bg-[#060913] text-purple-400 text-xs rounded-xl break-all border border-slate-800">
                  {shaComputedDigest || 'Awaiting input…'}
                </div>
              </div>

              {/* Verify Hash Subsection */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[10px] text-slate-400 block uppercase font-bold">Verify Against Expected Digest:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shaExpectedDigest}
                    onChange={(e) => setShaExpectedDigest(e.target.value)}
                    placeholder="Paste 64-hex SHA-256 digest to verify…"
                    className="flex-1 px-3 py-1.5 bg-[#060913] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleVerifyHash}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
                {shaVerificationResult && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    shaVerificationResult.valid
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  }`}>
                    {shaVerificationResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span>{shaVerificationResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live RSA-PSS Digital Signer & Verifier */}
            <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                    Interactive RSA-PSS 2048-bit Signer
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">PRIVATE KEY IN ISOLATION</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sign payload using the device's real private key stored on the server. The client only sees the public key and the resulting RSA-PSS signature.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Signing Device:</label>
                  <select
                    value={signDeviceId}
                    onChange={(e) => setSignDeviceId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#060913] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Action:</label>
                  <button
                    onClick={handleSignPayload}
                    disabled={isSigning}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isSigning ? 'Signing…' : 'Sign with Private Key'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">Message to Sign:</label>
                <input
                  type="text"
                  value={signPayloadText}
                  onChange={(e) => setSignPayloadText(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060913] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {signResult && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">RSA-PSS Signature (Base64):</span>
                    <button
                      onClick={handleVerifySignature}
                      disabled={isVerifyingSig}
                      className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {isVerifyingSig ? 'Verifying…' : 'Verify with Public Key'}
                    </button>
                  </div>
                  <pre className="p-2.5 bg-[#060913] text-emerald-400 text-[10px] rounded-xl overflow-x-auto break-all border border-slate-800 max-h-24">
                    {signResult.signature_b64}
                  </pre>
                  {verifySigResult && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      verifySigResult.valid
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    }`}>
                      {verifySigResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{verifySigResult.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
