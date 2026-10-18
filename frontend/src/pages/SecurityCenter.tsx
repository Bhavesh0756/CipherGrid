import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCheck,
  FileCode2,
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
} from 'lucide-react';
import { api } from '../services/api';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { SecurityScenarioResult } from '../types';

const SCENARIO_DEFS = [
  { id: 'normal', name: '1. Normal Secure Communication', objective: 'Deliver authorized telemetry with AES-GCM encryption and RSA signature.' },
  { id: 'tampering', name: '2. Message Tampering', objective: 'Detect bit alteration of ciphertext in-transit via SHA-256 and AEAD tag.' },
  { id: 'bad_signature', name: '3. Invalid Digital Signature', objective: 'Reject forged or corrupted RSA-PSS signature.' },
  { id: 'unauthorized_device', name: '4. Unauthorized Device (RBAC)', objective: 'Reject communication originating from an untrusted or non-whitelisted device.' },
  { id: 'replay_attempt', name: '5. Replay Attack Detection', objective: 'Detect and reject repeated submission of previously processed message IDs.' },
  { id: 'bad_auth_tag', name: '6. Invalid AES-GCM Auth Tag', objective: 'Reject message when MAC authentication tag does not match ciphertext.' },
  { id: 'missing_path', name: '7. Missing Network Route', objective: 'Verify graph traversal detects unreachable destination before cryptographic validation.' },
  { id: 'disabled_destination', name: '8. Administratively Disabled Destination', objective: 'Reject message transmission when target device is administratively offline.' },
  { id: 'recovery', name: '9. Recovery After Rejected Attempt', objective: 'Verify network recovers cleanly to deliver valid payload following a security violation.' },
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
    // If no scenarios have been run yet, run scenario 1 by default
    if (scenarioResults.length === 0) {
      runScenario('normal');
    }
  }, []);

  const activeResult = selectedScenario || scenarioResults[0] || null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-hidden">
      {/* Header Tabs */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'scenarios'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Security Test Scenarios ({scenarioResults.length}/9 Run)
          </button>
          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'workbench'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cryptographic Workbench & Side-by-Side Analysis
          </button>
        </div>

        {activeTab === 'scenarios' && (
          <button
            onClick={runAllScenarios}
            disabled={isRunningScenarios}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunningScenarios ? 'Executing Scenarios...' : 'Run All 9 Test Scenarios'}</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'scenarios' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Scenarios list */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Automated Test Scenarios
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Backend Engine</span>
            </div>

            <div className="divide-y divide-slate-100">
              {SCENARIO_DEFS.map((def) => {
                const res = scenarioResults.find((r) => r.scenario_id === def.id);
                const isSelected = activeResult?.scenario_id === def.id;

                return (
                  <div
                    key={def.id}
                    onClick={() => {
                      if (res) setSelectedScenario(res);
                      else runScenario(def.id);
                    }}
                    className={`p-3 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-slate-800">{def.name}</span>
                      {res ? (
                        res.pass_status ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PASS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>FAIL</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Pending</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{def.objective}</p>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runScenario(def.id);
                        }}
                        disabled={isRunningScenarios}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Run Test</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Scenario Result Inspection */}
          <div className="flex-1 overflow-y-auto p-5 select-text">
            {activeResult ? (
              <div className="space-y-4 max-w-4xl">
                {/* Result Status Card */}
                <div
                  className={`p-4 rounded-md border ${
                    activeResult.pass_status
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeResult.pass_status ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <h2 className="text-sm font-bold text-slate-900">{activeResult.name}</h2>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        activeResult.pass_status
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {activeResult.pass_status ? 'TEST PASSED' : 'TEST FAILED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 font-medium">
                    Objective: <span className="text-slate-600 font-normal">{activeResult.objective}</span>
                  </p>
                </div>

                {/* Expected vs Actual Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-md">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Expected Outcome
                    </div>
                    <p className="text-xs text-slate-800 font-medium">{activeResult.expected_outcome}</p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-md">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Actual Simulator Outcome
                    </div>
                    <p className="text-xs text-slate-800 font-medium">{activeResult.actual_outcome}</p>
                  </div>
                </div>

                {/* Reason / Technical Analysis */}
                <div className="p-4 bg-white border border-slate-200 rounded-md space-y-2">
                  <div className="text-xs font-bold text-slate-800">Defensive Decision Explanation</div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100 font-mono text-[11px]">
                    {activeResult.reason}
                  </p>
                </div>

                {/* Checks Executed */}
                <div className="p-4 bg-white border border-slate-200 rounded-md space-y-2">
                  <div className="text-xs font-bold text-slate-800">Security Verification Gates Executed</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {activeResult.checks_executed?.map((chk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-slate-800 font-mono text-[11px]">{chk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Record Metadata if present */}
                {activeResult.security_record && (
                  <div className="p-4 bg-white border border-slate-200 rounded-md space-y-2">
                    <div className="text-xs font-bold text-slate-800">Cryptographic Digest & Signature Record</div>
                    <pre className="p-3 bg-slate-900 text-slate-300 rounded font-mono text-[10px] overflow-x-auto leading-relaxed">
                      {JSON.stringify(activeResult.security_record, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Shield className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Select a test scenario from the list to view its evaluation.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Workbench: Side-by-Side Comparison */
        <div className="flex-1 overflow-y-auto p-5 select-text space-y-5">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Comparative Cryptographic Transformation Workbench</span>
            </h3>
            <p className="text-xs text-slate-600">
              Direct side-by-side analysis comparing the sender's plaintext payload, wire-transmitted AES-256-GCM ciphertext + AEAD MAC tag, recovered decrypted plaintext, SHA-256 digests, and RSA-PSS signatures.
            </p>
          </div>

          {/* 3-Column Comparison: Plaintext -> Wire AEAD -> Recovered */}
          <div className="grid grid-cols-3 gap-4">
            {/* Box 1: Plaintext Sender Payload */}
            <div className="bg-white border border-slate-200 rounded-md flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                <span>1. Original Sender Message</span>
                <span className="text-[10px] font-mono text-blue-600">Plaintext</span>
              </div>
              <div className="p-3.5 flex-1 space-y-2 text-xs">
                <div className="text-slate-500 text-[11px]">Structured Payload:</div>
                <pre className="p-2.5 bg-slate-100 text-slate-800 rounded font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {lastResult?.message_record?.payload || 'temperature=42.5;pressure=101.3;unit=celsius'}
                </pre>
                <div className="text-[10px] text-slate-500 pt-1">
                  Canonical Message ID: <span className="font-mono text-slate-700">{lastResult?.message_id || 'msg_demo_001'}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Wire Ciphertext + Nonce + Tag */}
            <div className="bg-white border border-slate-200 rounded-md flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                <span>2. Wire Representation</span>
                <span className="text-[10px] font-mono text-amber-600">AES-256-GCM</span>
              </div>
              <div className="p-3.5 flex-1 space-y-2 text-xs">
                <div className="text-slate-500 text-[11px]">96-bit Random Nonce (IV):</div>
                <div className="p-1.5 bg-slate-900 text-teal-400 rounded font-mono text-[10px] truncate">
                  {lastResult?.security_record?.nonce || '9a4f21b7c891e30a55219f80'}
                </div>

                <div className="text-slate-500 text-[11px]">Ciphertext (Base64):</div>
                <pre className="p-2 bg-slate-900 text-amber-300 rounded font-mono text-[10px] overflow-x-auto truncate">
                  {lastResult?.security_record?.ciphertext || '7k9+12BvM1A9cXxk09LL1mNx4kQ=='}
                </pre>

                <div className="text-slate-500 text-[11px]">128-bit MAC Tag (Auth Tag):</div>
                <div className="p-1.5 bg-slate-900 text-amber-400 rounded font-mono text-[10px] truncate">
                  {lastResult?.security_record?.tag || 'b381ec8027da5f18709e20a45b901a14'}
                </div>
              </div>
            </div>

            {/* Box 3: Decrypted / Recovered Message */}
            <div className="bg-white border border-slate-200 rounded-md flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                <span>3. Receiver Recovery</span>
                <span className="text-[10px] font-mono text-emerald-600">Authenticated</span>
              </div>
              <div className="p-3.5 flex-1 space-y-2 text-xs">
                <div className="text-slate-500 text-[11px]">Decrypted Payload:</div>
                <pre className="p-2.5 bg-slate-100 text-emerald-900 rounded font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {lastResult?.delivered !== false
                    ? lastResult?.message_record?.payload || 'temperature=42.5;pressure=101.3;unit=celsius'
                    : '[RECOVERY ABORTED: Security Check Failed]'}
                </pre>
                <div className="text-[10px] text-slate-500 pt-1">
                  Tag Verification: <span className="font-mono text-emerald-700 font-semibold">VALID MATCH</span>
                </div>
              </div>
            </div>
          </div>

          {/* SHA-256 Digest vs Recomputed */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <div className="text-xs font-bold text-slate-800">
              SHA-256 Message Integrity Verification
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Original Sender Digest:</span>
                <div className="mt-1 p-2 bg-slate-900 text-purple-300 font-mono text-[10px] rounded truncate">
                  {lastResult?.security_record?.digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Receiver Recomputed Digest:</span>
                <div className="mt-1 p-2 bg-slate-900 text-purple-300 font-mono text-[10px] rounded truncate">
                  {lastResult?.security_record?.digest || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Note: A cryptographic hash ensures the message content has not been unintentionally corrupted or tampered with, but does not identify the sender without a corresponding digital signature.
            </p>
          </div>

          {/* RSA-PSS Digital Signature */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-2">
            <div className="text-xs font-bold text-slate-800">
              RSA-PSS 2048-bit Digital Signature (Identity & Non-repudiation)
            </div>
            <p className="text-xs text-slate-600">
              The sender signs the canonical representation using their private RSA key. The receiver or industrial gateway verifies the signature using the registered sender's public key.
            </p>
            <div className="p-2.5 bg-slate-900 text-slate-300 font-mono text-[10px] rounded overflow-x-auto truncate">
              {lastResult?.security_record?.signature || '3a401c...RSA-PSS-SHA256-DIGITAL-SIGNATURE...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
