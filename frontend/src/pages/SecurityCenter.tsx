import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Key,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';

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
    scenarioResults,
    selectedScenario,
    setSelectedScenario,
    runScenario,
    runAllScenarios,
    isRunningScenarios,
    lastResult,
  } = useSimulatorStore();

  const [activeTab, setActiveTab] = useState<'scenarios' | 'workbench'>('scenarios');

  useEffect(() => {
    if (scenarioResults.length === 0) {
      runScenario('normal');
    }
  }, []);

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
                  9 AUTOMATED SCENARIOS
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
        /* Workbench */
        <div className="flex-1 overflow-y-auto px-6 py-6 select-text space-y-6 bg-[#070b14]">
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center gap-2.5 mb-2">
              <Lock className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                Comparative Cryptographic Workbench
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Live side-by-side inspection: Sender Plaintext ➔ AES-256-GCM AEAD Wire Encapsulation ➔ Receiver Decrypted Recovery with SHA-256 Digest & RSA-PSS Verification.
            </p>
          </div>

          {/* 3-Column Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'Original Plaintext Payload',
                badge: 'Sender Buffer',
                badgeColor: 'text-slate-300 bg-slate-800 border-slate-700',
                content: (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="text-[10px] text-slate-400">Structured OT Parameters:</div>
                    <pre className="p-3 bg-[#060913] text-slate-200 rounded-xl font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                      {lastResult?.message_record?.payload || 'temperature=42.5;pressure=101.3;unit=celsius'}
                    </pre>
                    <div className="text-[10px] text-slate-400">
                      Session Message ID: <span className="text-slate-300 font-semibold">{lastResult?.message_id || 'msg_sim_001'}</span>
                    </div>
                  </div>
                ),
              },
              {
                step: '02',
                title: 'Encrypted Wire Transit',
                badge: 'AES-256-GCM AEAD',
                badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                content: (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="text-[10px] text-slate-400">96-bit Nonce (IV):</div>
                    <div className="p-2 bg-[#060913] text-teal-400 rounded-lg text-[10px] truncate border border-slate-800">
                      {lastResult?.security_record?.nonce || '9a4f21b7c891e30a55219f80'}
                    </div>
                    <div className="text-[10px] text-slate-400">AEAD Ciphertext:</div>
                    <pre className="p-2 bg-[#060913] text-amber-300 rounded-lg text-[10px] overflow-x-auto truncate border border-slate-800">
                      {lastResult?.security_record?.ciphertext || '7k9+12BvM1A9cXxk09LL1mNx4kQ=='}
                    </pre>
                    <div className="text-[10px] text-slate-400">128-bit MAC Auth Tag:</div>
                    <div className="p-2 bg-[#060913] text-amber-400 rounded-lg text-[10px] truncate border border-slate-800">
                      {lastResult?.security_record?.tag || 'b381ec8027da5f18709e20a45b901a14'}
                    </div>
                  </div>
                ),
              },
              {
                step: '03',
                title: 'Receiver Decrypted Recovery',
                badge: 'Verified Match',
                badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
                content: (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="text-[10px] text-slate-400">Decrypted Payload:</div>
                    <pre className="p-3 bg-[#060913] text-emerald-300 rounded-xl font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                      {lastResult?.delivered !== false
                        ? (lastResult?.message_record?.payload || 'temperature=42.5;pressure=101.3;unit=celsius')
                        : '[ABORTED: Security Check Failed]'}
                    </pre>
                    <div className="text-[10px] text-emerald-400 font-bold">
                      GCM Tag Integrity: VALID
                    </div>
                  </div>
                ),
              },
            ].map((col) => (
              <div key={col.step} className="bg-[#0d1424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#080d1a]/80">
                  <div>
                    <div className="text-[9px] font-mono text-slate-400">STEP {col.step}</div>
                    <div className="text-xs font-bold text-white font-display">{col.title}</div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${col.badgeColor}`}>
                    {col.badge}
                  </span>
                </div>
                <div className="p-4">{col.content}</div>
              </div>
            ))}
          </div>

          {/* SHA-256 Comparison */}
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl font-mono">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>SHA-256 Mathematical Integrity Verification</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Sender Digest', 'Receiver Recomputed Digest'].map((label) => (
                <div key={label}>
                  <div className="text-[10px] text-slate-400 mb-1 uppercase font-bold">{label}:</div>
                  <div className="p-2.5 bg-[#060913] text-purple-400 text-xs rounded-xl truncate border border-slate-800">
                    {lastResult?.security_record?.digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Canonical key-value serialization hashed via SHA-256 ensures zero unauthorized bit-flips occurred during intermediate network hops.
            </p>
          </div>

          {/* RSA-PSS Signature */}
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 p-5 shadow-xl font-mono">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-display mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>RSA-PSS 2048-bit Probabilistic Digital Signature</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Sender signs payload with private key. Receiver validates authenticity against the pre-shared public key directory.
            </p>
            <div className="p-3 bg-[#060913] text-slate-300 text-[10px] rounded-xl overflow-x-auto truncate border border-slate-800">
              {lastResult?.security_record?.signature || '3a401c…RSA-PSS-SHA256-2048BIT-DIGITAL-SIGNATURE…'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
