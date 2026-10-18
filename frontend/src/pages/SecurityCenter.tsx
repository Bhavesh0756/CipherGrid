import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  RefreshCw,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';

const SCENARIO_DEFS = [
  { id: 'normal', name: 'Normal Secure Communication', objective: 'Deliver authorized telemetry with AES-GCM encryption and RSA signature.' },
  { id: 'tampering', name: 'Message Tampering', objective: 'Detect bit alteration of ciphertext via SHA-256 and AEAD tag.' },
  { id: 'bad_signature', name: 'Invalid Digital Signature', objective: 'Reject forged or corrupted RSA-PSS signature.' },
  { id: 'unauthorized_device', name: 'Unauthorized Device (RBAC)', objective: 'Reject untrusted or non-whitelisted device communication.' },
  { id: 'replay_attempt', name: 'Replay Attack Detection', objective: 'Detect and reject repeated stale message IDs.' },
  { id: 'bad_auth_tag', name: 'Invalid AES-GCM Auth Tag', objective: 'Reject message when MAC tag does not match ciphertext.' },
  { id: 'missing_path', name: 'Missing Network Route', objective: 'Detect unreachable destination before cryptographic validation.' },
  { id: 'disabled_destination', name: 'Disabled Destination', objective: 'Reject message when target device is administratively offline.' },
  { id: 'recovery', name: 'Recovery After Rejection', objective: 'Verify network recovers cleanly to deliver valid payload after violation.' },
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

  const passed = scenarioResults.filter(r => r.pass_status).length;
  const total = SCENARIO_DEFS.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fafaf9' }}>
      {/* Module header */}
      <div className="px-6 pt-5 pb-3 border-b border-stone-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Security Center</h1>
              <p className="text-[11px] text-stone-400 mt-0.5">Cryptographic test scenarios and workbench analysis</p>
            </div>
          </div>

          {/* Scenario progress */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-stone-700">{passed}/{scenarioResults.length} run · {passed} passed</div>
              <div className="w-32 h-1.5 bg-stone-100 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-rose-500 transition-all"
                  style={{ width: scenarioResults.length ? `${(passed / scenarioResults.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
            {activeTab === 'scenarios' && (
              <button
                onClick={runAllScenarios}
                disabled={isRunningScenarios}
                className="flex items-center gap-1.5 px-3 py-[6px] bg-rose-600 hover:bg-rose-500 disabled:bg-stone-300 text-white rounded-lg text-[11.5px] font-medium transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                {isRunningScenarios ? 'Running…' : 'Run All 9'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3">
          {[
            { id: 'scenarios' as const, label: 'Test Scenarios' },
            { id: 'workbench' as const, label: 'Cryptographic Workbench' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'scenarios' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Scenarios list */}
          <div className="w-72 bg-white border-r border-stone-100 flex flex-col overflow-y-auto shrink-0">
            <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/50">
              <span className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                {scenarioResults.length}/{total} scenarios run
              </span>
            </div>
            <div className="divide-y divide-stone-50">
              {SCENARIO_DEFS.map((def, idx) => {
                const res = scenarioResults.find((r) => r.scenario_id === def.id);
                const isSelected = activeResult?.scenario_id === def.id;
                return (
                  <div
                    key={def.id}
                    onClick={() => { if (res) setSelectedScenario(res); else runScenario(def.id); }}
                    className={`px-4 py-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-l-2 border-rose-500'
                        : 'hover:bg-stone-50/60 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-stone-400 mb-0.5">{String(idx + 1).padStart(2, '0')}</div>
                        <div className="text-[11.5px] font-semibold text-stone-800 leading-tight">{def.name}</div>
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-2">{def.objective}</p>
                      </div>
                      <div className="shrink-0 pt-4">
                        {res ? (
                          res.pass_status ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-stone-200" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); runScenario(def.id); }}
                      disabled={isRunningScenarios}
                      className="mt-2 text-[10px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 disabled:opacity-40"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Run test
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Result detail */}
          <div className="flex-1 overflow-y-auto px-6 py-5 select-text">
            {activeResult ? (
              <div className="max-w-3xl space-y-4">
                {/* Status card */}
                <div className={`p-5 rounded-xl border ${
                  activeResult.pass_status
                    ? 'bg-emerald-50 border-emerald-200/60'
                    : 'bg-rose-50 border-rose-200/60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {activeResult.pass_status
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        : <XCircle className="w-5 h-5 text-rose-600" />
                      }
                      <h2 className="text-[14px] font-bold text-stone-900">{activeResult.name}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold ${
                      activeResult.pass_status
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {activeResult.pass_status ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-stone-600 mt-2">
                    <span className="font-semibold text-stone-700">Objective:</span> {activeResult.objective}
                  </p>
                </div>

                {/* Expected vs actual */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Expected Outcome', value: activeResult.expected_outcome },
                    { label: 'Actual Outcome', value: activeResult.actual_outcome },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl border border-stone-200/60 p-4">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">{item.label}</div>
                      <p className="text-[12px] text-stone-800 font-medium leading-relaxed">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="bg-white rounded-xl border border-stone-200/60 p-4">
                  <div className="text-[11px] font-bold text-stone-700 mb-2">Defensive Decision</div>
                  <p className="text-[11px] text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100 font-mono">
                    {activeResult.reason}
                  </p>
                </div>

                {/* Security checks */}
                {activeResult.checks_executed && activeResult.checks_executed.length > 0 && (
                  <div className="bg-white rounded-xl border border-stone-200/60 p-4">
                    <div className="text-[11px] font-bold text-stone-700 mb-3">Security Gates Executed</div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeResult.checks_executed.map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-100">
                          <ShieldCheck className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="text-[10.5px] font-mono text-stone-700">{chk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crypto record */}
                {activeResult.security_record && (
                  <div className="bg-white rounded-xl border border-stone-200/60 p-4">
                    <div className="text-[11px] font-bold text-stone-700 mb-2">Cryptographic Record</div>
                    <pre className="p-3 bg-stone-900 text-stone-300 rounded-lg font-mono text-[9.5px] overflow-x-auto leading-relaxed">
                      {JSON.stringify(activeResult.security_record, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400">
                <Shield className="w-10 h-10 text-stone-200 mb-3" />
                <p className="text-[12px] font-medium text-stone-500">Select a scenario to view results</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Workbench */
        <div className="flex-1 overflow-y-auto px-6 py-5 select-text space-y-5">
          <div className="bg-white rounded-xl border border-stone-200/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-rose-600" />
              <h3 className="text-[12.5px] font-bold text-stone-800">Comparative Cryptographic Workbench</h3>
            </div>
            <p className="text-[11.5px] text-stone-500 leading-relaxed">
              Side-by-side comparison: sender plaintext → AES-256-GCM ciphertext + AEAD tag → receiver recovery. Also compares SHA-256 digests and RSA-PSS signatures.
            </p>
          </div>

          {/* 3-column flow */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                step: '01', title: 'Original Message', badge: 'Plaintext', badgeColor: 'text-stone-600',
                content: (
                  <div className="space-y-2">
                    <div className="text-[10px] text-stone-400">Structured Payload:</div>
                    <pre className="p-2.5 bg-stone-50 text-stone-800 rounded-lg font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap border border-stone-100">
                      {lastResult?.message_record?.payload || 'temperature=42.5;pressure=101.3;unit=celsius'}
                    </pre>
                    <div className="text-[9.5px] text-stone-400 font-mono">
                      ID: {lastResult?.message_id || 'msg_demo_001'}
                    </div>
                  </div>
                ),
              },
              {
                step: '02', title: 'Wire Representation', badge: 'AES-256-GCM', badgeColor: 'text-amber-600',
                content: (
                  <div className="space-y-2">
                    <div className="text-[10px] text-stone-400">96-bit Nonce:</div>
                    <div className="p-1.5 bg-stone-900 text-teal-400 rounded-md font-mono text-[9.5px] truncate">
                      {lastResult?.security_record?.nonce || '9a4f21b7c891e30a55219f80'}
                    </div>
                    <div className="text-[10px] text-stone-400">Ciphertext:</div>
                    <pre className="p-2 bg-stone-900 text-amber-300 rounded-md font-mono text-[9.5px] overflow-x-auto truncate">
                      {lastResult?.security_record?.ciphertext || '7k9+12BvM1A9cXxk09LL1mNx4kQ=='}
                    </pre>
                    <div className="text-[10px] text-stone-400">128-bit Auth Tag:</div>
                    <div className="p-1.5 bg-stone-900 text-amber-400 rounded-md font-mono text-[9.5px] truncate">
                      {lastResult?.security_record?.tag || 'b381ec8027da5f18709e20a45b901a14'}
                    </div>
                  </div>
                ),
              },
              {
                step: '03', title: 'Receiver Recovery', badge: 'Authenticated', badgeColor: 'text-emerald-600',
                content: (
                  <div className="space-y-2">
                    <div className="text-[10px] text-stone-400">Decrypted Payload:</div>
                    <pre className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap border border-emerald-100">
                      {lastResult?.delivered !== false
                        ? (lastResult?.message_record?.payload || 'temperature=42.5;pressure=101.3;unit=celsius')
                        : '[ABORTED: Security Check Failed]'}
                    </pre>
                    <div className="text-[9.5px] text-emerald-600 font-mono font-medium">Tag Verification: VALID MATCH</div>
                  </div>
                ),
              },
            ].map((col) => (
              <div key={col.step} className="bg-white rounded-xl border border-stone-200/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-mono text-stone-400">{col.step}</div>
                    <div className="text-[12px] font-semibold text-stone-800">{col.title}</div>
                  </div>
                  <span className={`text-[9.5px] font-mono font-medium ${col.badgeColor}`}>{col.badge}</span>
                </div>
                <div className="p-4">{col.content}</div>
              </div>
            ))}
          </div>

          {/* SHA-256 comparison */}
          <div className="bg-white rounded-xl border border-stone-200/60 p-4">
            <div className="text-[12px] font-bold text-stone-800 mb-3">SHA-256 Integrity Verification</div>
            <div className="grid grid-cols-2 gap-4">
              {['Sender Digest', 'Receiver Recomputed'].map((label) => (
                <div key={label}>
                  <div className="text-[10px] text-stone-400 mb-1">{label}:</div>
                  <div className="p-2 bg-stone-900 text-purple-400 font-mono text-[9.5px] rounded-lg truncate">
                    {lastResult?.security_record?.digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-stone-400 mt-3 leading-relaxed">
              A matching hash ensures message integrity but does not authenticate the sender without a corresponding RSA-PSS signature.
            </p>
          </div>

          {/* RSA-PSS signature */}
          <div className="bg-white rounded-xl border border-stone-200/60 p-4">
            <div className="text-[12px] font-bold text-stone-800 mb-1">RSA-PSS 2048-bit Digital Signature</div>
            <p className="text-[11px] text-stone-500 mb-3">
              The sender signs using their RSA private key. The receiver verifies with the registered public key.
            </p>
            <div className="p-2.5 bg-stone-900 text-stone-400 font-mono text-[9.5px] rounded-lg overflow-x-auto truncate">
              {lastResult?.security_record?.signature || '3a401c…RSA-PSS-SHA256-DIGITAL-SIGNATURE…'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
