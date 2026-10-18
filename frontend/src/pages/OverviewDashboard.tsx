import React, { useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Network,
  Play,
  Send,
  Server,
  ShieldCheck,
  TrendingUp,
  XCircle,
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto select-text" style={{ background: '#fafaf9' }}>
      {/* Module header */}
      <div className="px-6 pt-5 pb-4 border-b border-stone-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Telemetry Overview</h1>
              <p className="text-[11px] text-stone-400 mt-0.5">Real-time metrics from the active simulation backend</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('network-lab')}
              className="flex items-center gap-1.5 px-3 py-[6px] bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 rounded-lg text-[11.5px] font-medium transition-colors"
            >
              <Network className="w-3.5 h-3.5 text-cyan-600" />
              Network Lab
            </button>
            <button
              onClick={() => setMessageModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-[6px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11.5px] font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Packet
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Active Devices',
              value: stats?.total_devices ?? 0,
              sub: `${stats?.devices_summary?.online ?? 0} online`,
              icon: <Server className="w-4 h-4 text-indigo-500" />,
              color: 'text-indigo-700',
              bg: 'bg-indigo-50',
            },
            {
              label: 'Sessions',
              value: stats?.total_sessions ?? 0,
              sub: 'Logged in SQLite',
              icon: <TrendingUp className="w-4 h-4 text-stone-400" />,
              color: 'text-stone-800',
              bg: 'bg-stone-50',
            },
            {
              label: 'Delivered',
              value: stats?.messages_delivered ?? 0,
              sub: 'Passed all checks',
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
              color: 'text-emerald-700',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Rejected',
              value: stats?.messages_rejected ?? 0,
              sub: 'Policy violations',
              icon: <XCircle className="w-4 h-4 text-rose-500" />,
              color: 'text-rose-700',
              bg: 'bg-rose-50',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-stone-200/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wide">{kpi.label}</span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>{kpi.icon}</div>
              </div>
              <div className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] text-stone-400 mt-1">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Security pass rate */}
        <div className="bg-white rounded-xl border border-stone-200/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-[12px] font-semibold text-stone-700">Security Pass Rate</span>
            </div>
            <span className="text-[13px] font-bold font-mono text-indigo-700">{passRate}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${passRateBar}%`,
                background: passRate >= 80 ? '#4f46e5' : passRate >= 50 ? '#d97706' : '#e11d48',
              }}
            />
          </div>
          <div className="text-[10px] text-stone-400 mt-1.5">
            Across automated test scenarios — AES-GCM, RSA-PSS, RBAC, Replay protection
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-3 gap-5">
          {/* Recent events table — 2 cols */}
          <div className="col-span-2 bg-white rounded-xl border border-stone-200/60 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-stone-700">Recent Security Events</span>
              <button
                onClick={() => setActiveSection('event-logs')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {(!stats?.security_events || stats.security_events.length === 0) ? (
                <div className="h-40 flex flex-col items-center justify-center text-stone-400">
                  <ShieldCheck className="w-6 h-6 text-stone-200 mb-2" />
                  <p className="text-[11px] font-medium">No audit events yet</p>
                  <p className="text-[10px] text-stone-300 mt-0.5">Run a scenario to populate logs</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-[10px] font-semibold uppercase tracking-wide">
                      <th className="py-2 px-4">Time</th>
                      <th className="py-2 px-4">Event</th>
                      <th className="py-2 px-4">Route</th>
                      <th className="py-2 px-4">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.security_events.slice(0, 8).map((ev) => (
                      <tr key={ev.id} className="border-b border-stone-50 hover:bg-stone-50/60 transition-colors">
                        <td className="py-2.5 px-4 text-[10.5px] font-mono text-stone-400 whitespace-nowrap">
                          {ev.timestamp.replace('T', ' ').slice(11, 19)}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] font-medium text-stone-700">{ev.event_type}</td>
                        <td className="py-2.5 px-4 text-[10.5px] font-mono text-stone-500">
                          {ev.source_id} → {ev.destination_id}
                        </td>
                        <td className="py-2.5 px-4">
                          {ev.status === 'ACCEPTED' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] font-medium border border-emerald-100">
                              <CheckCircle2 className="w-2.5 h-2.5" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full bg-rose-50 text-rose-700 text-[9.5px] font-medium border border-rose-100">
                              <XCircle className="w-2.5 h-2.5" /> Rejected
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

          {/* Right: quick tests + ISA-95 ref */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-200/60 p-4">
              <h3 className="text-[11.5px] font-semibold text-stone-700 mb-3">Quick Tests</h3>
              <div className="space-y-1.5">
                {[
                  { id: 'normal', label: 'Normal Secure Flow', color: 'text-indigo-600', desc: 'AES-GCM + RSA-PSS' },
                  { id: 'tampering', label: 'Tampering Attack', color: 'text-rose-600', desc: 'Ciphertext bit-flip' },
                  { id: 'unauthorized_device', label: 'RBAC Violation', color: 'text-amber-600', desc: 'Untrusted source' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={async () => { await runScenario(t.id); setActiveSection('security-center'); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50 transition-all text-left"
                  >
                    <div>
                      <div className={`text-[11px] font-medium ${t.color}`}>{t.label}</div>
                      <div className="text-[9.5px] text-stone-400 mt-[1px]">{t.desc}</div>
                    </div>
                    <Play className={`w-3 h-3 fill-current ${t.color} opacity-60`} />
                  </button>
                ))}
              </div>
            </div>

            {/* ISA-95 reference */}
            <div className="bg-stone-900 rounded-xl p-4">
              <div className="text-[10.5px] font-semibold text-white mb-2 uppercase tracking-wide">ISA-95 Purdue Model</div>
              <div className="space-y-1 text-[10px]">
                {[
                  { level: 'L0', label: 'Physical Process', dot: 'bg-amber-400' },
                  { level: 'L1', label: 'Basic Control (PLC)', dot: 'bg-blue-400' },
                  { level: 'L2', label: 'Supervisory (SCADA)', dot: 'bg-indigo-400' },
                  { level: 'L3', label: 'Site Operations', dot: 'bg-teal-400' },
                ].map((l) => (
                  <div key={l.level} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${l.dot} flex-shrink-0`} />
                    <span className="font-mono text-stone-500">{l.level}</span>
                    <span className="text-stone-500">{l.label}</span>
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
