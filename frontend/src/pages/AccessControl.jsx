import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  KeyRound, 
  Network, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Server,
  Cpu,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

const Panel = ({ children, className = '', accent = 'from-teal-500/50 via-cyan-500/20 to-transparent' }) => (
  <div className={`bg-[#0a0f1d]/85 backdrop-blur-md border border-[#17253e] rounded-2xl p-6 shadow-xl shadow-black/40 relative overflow-hidden transition-all duration-300 hover:border-[#223556] ${className}`}>
    <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r ${accent}`} />
    {children}
  </div>
);

export const AccessControl = () => {
  const [rolesMeta, setRolesMeta] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [testAction, setTestAction] = useState('read_telemetry');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [eapActiveStep, setEapActiveStep] = useState(0);

  useEffect(() => {
    api.getRolesMeta().then(r => r.ok && setRolesMeta(r.data));
    api.getDevices().then(r => {
      if (r.ok && r.data?.devices?.length > 0) {
        setDevices(r.data.devices);
        setSelectedDeviceId(r.data.devices[0].id);
      }
    });
  }, []);

  const handleTestPolicy = async () => {
    if (!selectedDeviceId) return;
    setIsTesting(true);
    try {
      const res = await api.simulateDeviceMessage(selectedDeviceId, {
        action: testAction,
        payload: { command: 'POLICY_TEST_DRY_RUN' },
      });
      setTestResult(res.data);
    } finally {
      setIsTesting(false);
    }
  };

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const eapSteps = rolesMeta?.ieee_802_1x_workflow?.steps || [
    { step: 1, name: 'EAPOL-Start',          from: 'Supplicant (Device)',     to: 'Authenticator (Switch)',   description: 'Device requests link access upon powering on and sends EAPOL-Start frame.' },
    { step: 2, name: 'EAP-Request/Identity', from: 'Authenticator (Switch)',  to: 'Supplicant (Device)',      description: 'Switch prompts device for network identity via EAP-Request/Identity frame.' },
    { step: 3, name: 'EAP-Response/Identity',from: 'Supplicant (Device)',     to: 'Authenticator (Switch)',   description: 'Device supplies its hardware identifier in EAP-Response/Identity.' },
    { step: 4, name: 'RADIUS Access-Request',from: 'Authenticator (Switch)',  to: 'RADIUS Auth Server',       description: 'Switch encapsulates the EAP message and forwards to central RADIUS server.' },
    { step: 5, name: 'EAP-TLS Handshake',    from: 'Supplicant ↔ RADIUS',   to: 'Mutual Authentication',    description: 'Device and RADIUS server exchange X.509 certificates and negotiate session keys.' },
    { step: 6, name: 'RADIUS Access-Accept', from: 'RADIUS Auth Server',     to: 'Authenticator (Switch)',   description: 'RADIUS signals port admission — Access-Accept or Access-Reject packet.' },
    { step: 7, name: 'Port Authorized',       from: 'Authenticator (Switch)', to: 'SCADA Network',            description: 'Physical port opens — industrial telemetry frames are now permitted.' },
  ];

  const riskColorMap = {
    'read_telemetry':    'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
    'report_status':     'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
    'acknowledge_alarm': 'text-amber-400 border-amber-500/20 bg-amber-950/20',
    'set_setpoint':      'text-amber-400 border-amber-500/20 bg-amber-950/20',
    'calibrate_sensor':  'text-amber-400 border-amber-500/20 bg-amber-950/20',
    'reboot_plc':        'text-rose-400 border-rose-500/20 bg-rose-950/20',
    'config_update':     'text-rose-400 border-rose-500/20 bg-rose-950/20',
    'emergency_trip':    'text-rose-400 border-rose-500/20 bg-rose-950/20',
    'flash_firmware':    'text-rose-400 border-rose-500/20 bg-rose-950/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#0a0f1d]/90 backdrop-blur-md border border-[#17253e] rounded-2xl p-6 shadow-xl shadow-black/40">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-teal-500/0 via-teal-500/60 to-emerald-500/0" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-950/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Access Control & Authorization
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Zero-Trust Policy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Role-Based Access Control (RBAC) engine, least-privilege matrix enforcement, and IEEE 802.1X / EAP-TLS port-based network admission simulation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070b16] border border-[#1a263d] text-[11px] font-mono-code text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>RBAC Engine: Enforcing</span>
            </span>
          </div>
        </div>
      </div>

      {/* RBAC Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Policy Evaluator */}
        <Panel className="lg:col-span-5 flex flex-col justify-between" accent="from-teal-500/50 via-cyan-500/30 to-transparent">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-400" />
                Live Policy Evaluator
              </h3>
              <span className="text-[10px] font-mono-code text-teal-300 bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-500/30 shadow-sm">
                PoLP Decision Point
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Target Node Device</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-[#070b16] border border-[#1a263d] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-all cursor-pointer"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} — {d.name} ({d.role} | {d.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedDevice && (
              <div className="p-3.5 rounded-xl bg-[#070b16] border border-[#17253e] text-xs space-y-2.5 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned Role</span>
                  <span className="font-mono-code text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-500/20">{selectedDevice.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Admission State</span>
                  <Badge variant={selectedDevice.status} size="xs">{selectedDevice.status}</Badge>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Requested Operation Action</label>
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                className="w-full bg-[#070b16] border border-[#1a263d] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-all cursor-pointer"
              >
                {[
                  ['read_telemetry', 'LOW Risk'],
                  ['report_status', 'LOW Risk'],
                  ['acknowledge_alarm', 'MEDIUM Risk'],
                  ['set_setpoint', 'HIGH Risk'],
                  ['calibrate_sensor', 'HIGH Risk'],
                  ['reboot_plc', 'CRITICAL Risk'],
                  ['config_update', 'CRITICAL Risk'],
                  ['emergency_trip', 'CRITICAL Risk'],
                  ['flash_firmware', 'CRITICAL Risk'],
                ].map(([v, risk]) => (
                  <option key={v} value={v}>{v} ({risk})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTestPolicy}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Evaluating Decision…' : 'Evaluate Access Decision'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`mt-5 p-4 rounded-xl text-xs backdrop-blur-md border animate-fade-in ${
              testResult.status === 'ACCEPTED' 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-950/20' 
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300 shadow-lg shadow-rose-950/20'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1.5">
                {testResult.status === 'ACCEPTED'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                }
                <span className="tracking-wide">VERDICT: {testResult.status}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-85">{testResult.reason}</p>
              {testResult.details && (
                <div className="mt-2.5 text-[10px] font-mono-code text-slate-400 border-t border-slate-700/40 pt-2 flex items-center justify-between">
                  <span>Policy Engine: {testResult.details.policy || 'RBAC'}</span>
                  <span>Rule: {testResult.status === 'ACCEPTED' ? 'ALLOW' : 'DENY'}</span>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* RBAC Permission Matrix */}
        <Panel className="lg:col-span-7" accent="from-cyan-500/50 via-teal-500/20 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              SCADA Role Permission Matrix
            </h3>
            <span className="text-[10px] font-mono-code text-slate-400 bg-[#070b16] px-2.5 py-1 rounded-full border border-[#17253e]">
              Least-Privilege Enforcement
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#18253e] text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Role Name</th>
                  <th className="pb-3 font-semibold">Scope & Description</th>
                  <th className="pb-3 font-semibold">Permitted Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152035]">
                {rolesMeta?.roles ? (
                  rolesMeta.roles.map((r) => {
                    let perms = [];
                    try { perms = typeof r.default_permissions === 'string' ? JSON.parse(r.default_permissions) : r.default_permissions; } catch {}
                    return (
                      <tr key={r.name} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 font-bold font-mono-code text-cyan-300 text-[11px] whitespace-nowrap">{r.name}</td>
                        <td className="py-3.5 text-slate-400 text-[11px] max-w-[170px] leading-snug">{r.description}</td>
                        <td className="py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {perms.map((p) => (
                              <span key={p} className={`px-2 py-0.5 rounded-md text-[10px] font-mono-code border ${riskColorMap[p] || 'text-slate-400 border-slate-700 bg-slate-900/50'}`}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="3" className="text-center py-6 text-slate-500">Loading roles…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* IEEE 802.1X Conceptual Flow */}
      <div className="bg-[#0a0f1d]/85 backdrop-blur-md border border-[#17253e] rounded-2xl p-6 shadow-xl shadow-black/40 space-y-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-indigo-500/0" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#18253e] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-400" />
              IEEE 802.1X / EAP-TLS Port-Based Network Admission
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Three-party authentication topology: Supplicant → Authenticator (Switch) → RADIUS Auth Server
            </p>
          </div>
          <span className="text-[10px] font-mono-code text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-500/30 self-start sm:self-auto">
            Pedagogical Simulation
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
          <strong>Architecture Disclosure:</strong> This interactive sequence models the IEEE 802.1X/EAP-TLS state machine. In physical plants, 802.1X requires Port Access Entity (PAE) hardware switches and a dedicated RADIUS daemon.
        </div>

        {/* 3 Entities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Cpu,     color: 'border-blue-500/30 bg-blue-950/20 text-blue-400',   title: 'Supplicant',    sub: 'Virtual Industrial Device',   desc: 'Initiates link via EAPOL frames; holds local X.509 certificate and responds to identity requests.' },
            { icon: Network, color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400',   title: 'Authenticator', sub: 'ICS Managed Switch',          desc: 'Maintains port in "Unauthorized" state until RADIUS approves; encapsulates EAP in RADIUS.' },
            { icon: Server,  color: 'border-violet-500/30 bg-violet-950/20 text-violet-400', title: 'Auth Server', sub: 'RADIUS / EAP-TLS',        desc: 'Verifies device certificate against revocation lists and issues Access-Accept or Access-Reject.' },
          ].map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.title} className={`p-4 rounded-xl border ${e.color} text-xs space-y-1.5 transition-all hover:scale-[1.01]`}>
                <div className={`flex items-center gap-2 font-bold ${e.color.split(' ')[2]}`}>
                  <Icon className="w-4 h-4" />
                  <span>{e.title}</span>
                </div>
                <p className="text-slate-200 font-semibold text-[11px]">{e.sub}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">{e.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Step Sequence */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">Step Through 802.1X EAP-TLS Handshake:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {eapSteps.map((step, idx) => {
              const isSelected = eapActiveStep === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => setEapActiveStep(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-950/50 to-blue-950/40 border-cyan-500/60 text-cyan-200 shadow-lg shadow-cyan-950/30'
                      : 'bg-[#070b16] border-[#17253e] text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[9px] font-mono-code font-bold opacity-70">Step 0{step.step}</div>
                  <div className="text-[11px] font-semibold truncate mt-1">{step.name}</div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-[#070b16] border border-[#17253e] text-xs animate-fade-in" key={eapActiveStep}>
            <div className="flex items-center gap-2 font-bold text-cyan-300 font-mono-code mb-1.5">
              <span>Step {eapSteps[eapActiveStep]?.step}: {eapSteps[eapActiveStep]?.name}</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              <span className="text-slate-400 font-medium">Protocol Traffic:</span>{' '}
              <span className="font-mono-code text-cyan-400">{eapSteps[eapActiveStep]?.from}</span> <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-500" /> <span className="font-mono-code text-emerald-400">{eapSteps[eapActiveStep]?.to}</span>
            </p>
            <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">{eapSteps[eapActiveStep]?.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

