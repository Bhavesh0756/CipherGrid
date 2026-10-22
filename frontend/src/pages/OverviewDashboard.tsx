import React, { useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  LayoutDashboard,
  Lock,
  Network,
  Play,
  Radio,
  Send,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';

export const OverviewDashboard: React.FC = () => {
  const {
    dashboardStats,
    fetchDashboardStats,
    setActiveSection,
    setMessageModalOpen,
    runScenario,
  } = useSimulatorStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const stats = dashboardStats;
  const passRate = stats?.pass_rate ?? 0;
  const passRateBar = Math.min(100, passRate);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto select-text bg-[#070b14]">
      {/* Module Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  TELEMETRY OPERATIONS CENTER
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  REAL-TIME OT SOC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Continuous SCADA health, AEAD cryptographic assurance & Purdue network telemetry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveSection('network-lab')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-slate-400" />
              <span>Interactive Lab</span>
            </button>
            <button
              onClick={() => setMessageModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Packet</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'ACTIVE OT NODES',
              value: stats?.total_devices ?? 0,
              sub: `${stats?.devices_summary?.online ?? 0} Nodes Online`,
              icon: <Server className="w-4 h-4 text-blue-400" />,
              border: 'border-slate-800 hover:border-slate-700',
              glow: '',
              accent: 'text-blue-400',
              chip: 'Purdue L0-L3',
            },
            {
              label: 'RELATIONAL SESSIONS',
              value: stats?.total_sessions ?? 0,
              sub: 'Persisted in SQLite Engine',
              icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
              border: 'border-purple-500/30 hover:border-purple-500/60',
              glow: 'shadow-purple-500/10',
              accent: 'text-purple-400',
              chip: 'Replay Cache Active',
            },
            {
              label: 'MESSAGES DELIVERED',
              value: stats?.messages_delivered ?? 0,
              sub: 'Passed AES-GCM & RSA-PSS',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
              border: 'border-emerald-500/30 hover:border-emerald-500/60',
              glow: 'shadow-emerald-500/10',
              accent: 'text-emerald-400',
              chip: '100% Authenticated',
            },
            {
              label: 'THREATS NEUTRALIZED',
              value: stats?.messages_rejected ?? 0,
              sub: 'Blocked by RBAC / Tamper check',
              icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
              border: 'border-rose-500/30 hover:border-rose-500/60',
              glow: 'shadow-rose-500/10',
              accent: 'text-rose-400',
              chip: 'Policy Enforcement',
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`bg-[#0d1424] rounded-2xl border ${kpi.border} p-4.5 transition-all duration-200 shadow-lg ${kpi.glow} relative overflow-hidden group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                  {kpi.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {kpi.icon}
                </div>
              </div>
              <div className={`text-3xl font-bold font-mono ${kpi.accent} tracking-tight`}>
                {kpi.value}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10.5px]">
                <span className="text-slate-400 font-mono">{kpi.sub}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {kpi.chip}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Security Pass Rate Gauge */}
        <div className="bg-[#0d1424] rounded-2xl border border-slate-800/80 p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  CRYPTOGRAPHIC SECURITY POSTURE PASS RATE
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  Continuous validation across 9 repeatable SCADA threat scenarios
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {passRate}%
              </span>
            </div>
          </div>
          <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-700 bg-emerald-500"
              style={{ width: `${passRateBar}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[10.5px] font-mono text-slate-400">
            <div>AES-256-GCM AEAD: <span className="text-emerald-400 font-bold">ACTIVE</span></div>
            <div>RSA-PSS 2048-bit: <span className="text-emerald-400 font-bold">VERIFIED</span></div>
            <div>SHA-256 Digest: <span className="text-emerald-400 font-bold">MATCH</span></div>
            <div>Least-Privilege RBAC: <span className="text-emerald-400 font-bold">ENFORCED</span></div>
          </div>
        </div>

        {/* 2-Column Main Layout: Audit Events & Quick Scenarios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events Table */}
          <div className="lg:col-span-2 bg-[#0d1424] rounded-2xl border border-slate-800/80 flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#080d1a]/90">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  Recent Security Audit Stream
                </span>
              </div>
              <button
                onClick={() => setActiveSection('event-logs')}
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Full Audit Terminal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-auto max-h-80 font-mono text-xs">
              {(!stats?.security_events || stats.security_events.length === 0) ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500">
                  <ShieldCheck className="w-7 h-7 text-slate-600 mb-2" />
                  <p className="text-xs font-mono">No simulation events recorded yet</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Run a test scenario to populate the audit trail</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-[#080d1a]/50">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Event Classification</th>
                      <th className="py-2.5 px-4">Routing Path</th>
                      <th className="py-2.5 px-4 text-right">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {stats.security_events.slice(0, 8).map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-[10.5px] text-slate-400 whitespace-nowrap">
                          {ev.timestamp.replace('T', ' ').slice(11, 19)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-200 font-medium">{ev.event_type}</td>
                        <td className="py-2.5 px-4 text-[11px] text-slate-300 font-mono">
                          {ev.source_id} ➔ {ev.destination_id}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {ev.status === 'ACCEPTED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" /> ACCEPTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-2.5 h-2.5" /> REJECTED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: Quick Attack Scenario Workbench & ISA-95 */}
          <div className="space-y-4">
            <div className="bg-[#0d1424] rounded-2xl border border-slate-800/80 p-4.5 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display mb-3 flex items-center justify-between">
                <span>QUICK DEFENSE SCENARIOS</span>
                <span className="text-[9.5px] font-mono text-slate-400">1-CLICK AUDIT</span>
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'normal', label: 'Normal Secure Flow', color: 'text-blue-400', border: 'border-slate-800 hover:border-slate-700', desc: 'AES-256-GCM + RSA-PSS + RBAC' },
                  { id: 'tampering', label: 'Payload Tampering Attack', color: 'text-rose-400', border: 'border-rose-500/30', desc: 'Detects AEAD bit-flip in transit' },
                  { id: 'unauthorized_device', label: 'Unauthorized Device Injection', color: 'text-amber-400', border: 'border-amber-500/30', desc: 'Industrial RBAC admission control' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={async () => { await runScenario(t.id); setActiveSection('security-center'); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${t.border} bg-slate-900/80 hover:bg-slate-800 transition-all text-left group cursor-pointer`}
                  >
                    <div>
                      <div className={`text-xs font-bold font-display ${t.color}`}>{t.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.desc}</div>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ISA-95 Purdue Reference Matrix */}
            <div className="bg-[#080d1a] rounded-2xl border border-slate-800/80 p-4.5 shadow-xl">
              <div className="text-[11px] font-bold text-white mb-2.5 uppercase tracking-wider font-display flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>ISA-95 PURDUE MODEL ARCHITECTURE</span>
              </div>
              <div className="space-y-1.5 text-[10.5px] font-mono">
                {[
                  { level: 'Level 0', label: 'Physical Process & Sensors', dot: 'bg-amber-400' },
                  { level: 'Level 1', label: 'Basic Control (PLC / Switch)', dot: 'bg-blue-400' },
                  { level: 'Level 2', label: 'Supervisory SCADA & HMI', dot: 'bg-purple-400' },
                  { level: 'Level 3', label: 'Operations & SIEM Gateway', dot: 'bg-emerald-400' },
                  { level: 'Untrusted', label: 'Rogue External / Attacker Tap', dot: 'bg-rose-500' },
                ].map((l) => (
                  <div key={l.level} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${l.dot} shrink-0`} />
                      <span className="text-slate-300">{l.label}</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
