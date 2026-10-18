import React, { useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Layers,
  Network,
  Play,
  Radio,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-y-auto p-6 select-text">
      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Operational Telemetry & Simulation Status
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time backend metrics derived from the active industrial network state and SQLite logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('network-lab')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Network Lab</span>
          </button>
          <button
            onClick={() => setMessageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Packet</span>
          </button>
        </div>
      </div>

      {/* Metrics Row: Restrained, purposeful cards */}
      <div className="grid grid-cols-5 gap-3.5 mb-6">
        <div className="p-3.5 bg-white border border-slate-200 rounded-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Devices</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats?.total_devices ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {stats?.devices_summary?.online ?? 0} online / {stats?.devices_summary?.offline ?? 0} offline
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Simulation Sessions</span>
            <Radio className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats?.total_sessions ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Logged in SQLite database</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-md">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-medium uppercase tracking-wider">Packets Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono">
            {stats?.messages_delivered ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Passed integrity & RBAC</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-md">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-medium uppercase tracking-wider">Packets Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800 mt-1 font-mono">
            {stats?.messages_rejected ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Tampering or policy violations</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-md">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-medium uppercase tracking-wider">Security Pass Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1 font-mono">
            {stats?.pass_rate ?? 0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Automated test scenarios</div>
        </div>
      </div>

      {/* Main Grid: Shortcuts & Recent Security Events */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left 2 Cols: Recent Security Events Table */}
        <div className="col-span-2 bg-white border border-slate-200 rounded-md flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Recent Security Audit Events
              </h2>
            </div>
            <button
              onClick={() => setActiveSection('event-logs')}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
            >
              <span>View Full Log</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {(!stats?.security_events || stats.security_events.length === 0) ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                <ShieldCheck className="w-6 h-6 text-slate-300 mb-1" />
                <p className="text-xs font-medium">No recorded audit events in SQLite yet.</p>
                <p className="text-[11px] text-slate-400">Run a test scenario to populate security audit logs.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Event</th>
                    <th className="py-2 px-3">Source → Target</th>
                    <th className="py-2 px-3">Decision</th>
                    <th className="py-2 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {stats.security_events.slice(0, 8).map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {ev.timestamp.replace('T', ' ').slice(11, 19)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{ev.event_type}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {ev.source_id} → {ev.destination_id}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {ev.status === 'ACCEPTED' ? (
                          <span className="text-emerald-700 font-medium">ACCEPTED</span>
                        ) : (
                          <span className="text-rose-700 font-medium">REJECTED</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 truncate max-w-xs">
                        {ev.rejection_reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: Quick Security Verification Shortcuts */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Quick Security Tests
            </h3>
            <p className="text-xs text-slate-600">
              Trigger repeatable backend cryptographic test scenarios directly:
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={async () => {
                  await runScenario('normal');
                  setActiveSection('security-center');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 transition-colors text-left"
              >
                <div>
                  <div className="font-medium">1. Normal Secure Message</div>
                  <div className="text-[10px] text-slate-500">AES-GCM + RSA-PSS valid flow</div>
                </div>
                <Play className="w-3.5 h-3.5 text-blue-600 fill-current" />
              </button>

              <button
                onClick={async () => {
                  await runScenario('tampering');
                  setActiveSection('security-center');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-rose-700">2. Message Tampering Test</div>
                  <div className="text-[10px] text-slate-500">In-transit ciphertext bit flip</div>
                </div>
                <Play className="w-3.5 h-3.5 text-rose-600 fill-current" />
              </button>

              <button
                onClick={async () => {
                  await runScenario('unauthorized_device');
                  setActiveSection('security-center');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-amber-700">4. Unauthorized Device (RBAC)</div>
                  <div className="text-[10px] text-slate-500">Untrusted source policy denial</div>
                </div>
                <Play className="w-3.5 h-3.5 text-amber-600 fill-current" />
              </button>
            </div>
          </div>

          {/* Purdue Architecture Reference Box */}
          <div className="bg-slate-900 text-slate-300 rounded-md p-4 space-y-2 text-xs">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>ISA-95 Industrial Hierarchy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Industrial operations segment devices into Purdue Levels: Level 0 (Sensors), Level 1 (PLCs), Level 2 (SCADA & HMI), and Level 3 (Site Operations). Protected communication prevents unauthorized cross-zone access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
