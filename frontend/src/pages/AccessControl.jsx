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

const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 card-hover ${className}`}>
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
    'read_telemetry':    'text-emerald-400',
    'report_status':     'text-emerald-400',
    'acknowledge_alarm': 'text-amber-400',
    'set_setpoint':      'text-amber-400',
    'calibrate_sensor':  'text-amber-400',
    'reboot_plc':        'text-rose-400',
    'config_update':     'text-rose-400',
    'emergency_trip':    'text-rose-400',
    'flash_firmware':    'text-rose-400',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 flowing-border">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          Access Control & Authorization
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Role-Based Access Control (RBAC) matrix, least privilege enforcement, and conceptual IEEE 802.1X / EAP-TLS port-based authentication.
        </p>
      </div>

      {/* RBAC Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Policy Evaluator */}
        <Panel className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-400" />
                Live Policy Evaluator
              </h3>
              <span className="text-[10px] font-mono-code text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-500/30">
                PoLP Engine
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Target Device</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono-code input-field"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} — {d.name} ({d.role} | {d.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedDevice && (
              <div className="p-3 rounded-lg bg-[#080f1e] border border-[#1a2844] text-xs space-y-2 animate-fade-in">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Role</span>
                  <span className="font-mono-code text-sky-300 font-bold">{selectedDevice.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Admission State</span>
                  <Badge variant={selectedDevice.status} size="xs">{selectedDevice.status}</Badge>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">Requested Action</label>
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono-code input-field"
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
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-950/40 flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Evaluating…' : 'Evaluate Access Decision'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg text-xs animate-fade-in ${
              testResult.status === 'ACCEPTED' ? 'alert-success text-emerald-300' : 'alert-critical text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1.5">
                {testResult.status === 'ACCEPTED'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <XCircle className="w-4 h-4 text-rose-400" />
                }
                <span>VERDICT: {testResult.status}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">{testResult.reason}</p>
              {testResult.details && (
                <div className="mt-2 text-[10px] font-mono-code text-slate-400 border-t border-slate-800/60 pt-1">
                  Policy: {testResult.details.policy || 'RBAC'}
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* RBAC Permission Matrix */}
        <Panel className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              SCADA Role Permission Matrix
            </h3>
            <span className="text-[10px] font-mono-code text-slate-500 bg-[#080f1e] px-2 py-0.5 rounded border border-[#1a2844]">
              Least Privilege
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a2844] text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Role</th>
                  <th className="pb-2.5 font-medium">Description</th>
                  <th className="pb-2.5 font-medium">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2844]">
                {rolesMeta?.roles ? (
                  rolesMeta.roles.map((r) => {
                    let perms = [];
                    try { perms = typeof r.default_permissions === 'string' ? JSON.parse(r.default_permissions) : r.default_permissions; } catch {}
                    return (
                      <tr key={r.name} className="table-row-hover">
                        <td className="py-3 font-bold font-mono-code text-sky-300 text-[11px]">{r.name}</td>
                        <td className="py-3 text-slate-500 text-[11px] max-w-[160px] leading-snug">{r.description}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {perms.map((p) => (
                              <span key={p} className={`px-1.5 py-0.5 rounded bg-[#080f1e] text-[9px] font-mono-code border border-[#1a2844] ${riskColorMap[p] || 'text-slate-400'}`}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="3" className="text-center py-6 text-slate-600">Loading roles…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* IEEE 802.1X Conceptual Flow */}
      <div className="bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 space-y-5 card-hover">
        <div className="flex items-center justify-between border-b border-[#1a2844] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-400" />
              IEEE 802.1X / EAP-TLS Port-Based Authentication
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Three-party authentication: Supplicant → Authenticator (Switch) → RADIUS Auth Server
            </p>
          </div>
          <span className="text-[10px] font-mono-code text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
            Conceptual Model
          </span>
        </div>

        <div className="p-3 rounded-lg alert-warning text-amber-300 text-xs">
          <strong>Disclosure:</strong> This visual flow simulates the theoretical 802.1X/EAP sequence. Physical 802.1X requires hardware port authorization (PAE), a managed switch, and a dedicated RADIUS server.
        </div>

        {/* 3 Entities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Cpu,     color: 'border-blue-500/30 bg-blue-950/20 text-blue-400',   title: 'Supplicant',    sub: 'Virtual Industrial Device',   desc: 'Initiates link via EAPOL frames; holds local X.509 certificate and responds to identity requests.' },
            { icon: Network, color: 'border-sky-500/30 bg-sky-950/20 text-sky-400',      title: 'Authenticator', sub: 'ICS Managed Switch',          desc: 'Maintains port in "Unauthorized" state until RADIUS approves; encapsulates EAP in RADIUS.' },
            { icon: Server,  color: 'border-violet-500/30 bg-violet-950/20 text-violet-400', title: 'Auth Server', sub: 'RADIUS / EAP-TLS',        desc: 'Verifies device certificate against revocation lists and sends Access-Accept or Reject.' },
          ].map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.title} className={`p-4 rounded-xl border ${e.color} text-xs space-y-1`}>
                <div className={`flex items-center gap-2 font-bold ${e.color.split(' ')[2]}`}>
                  <Icon className="w-4 h-4" />
                  <span>{e.title}</span>
                </div>
                <p className="text-slate-300 font-semibold text-[11px]">{e.sub}</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">{e.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Step Sequence */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Step Through 802.1X Handshake:</span>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
            {eapSteps.map((step, idx) => {
              const isSelected = eapActiveStep === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => setEapActiveStep(idx)}
                  className={`p-2.5 rounded-lg border text-left transition-all btn-press ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/50 text-sky-300'
                      : 'bg-[#080f1e] border-[#1a2844] text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  <div className="text-[9px] font-mono-code font-bold opacity-60">Step {step.step}</div>
                  <div className="text-[11px] font-semibold truncate mt-0.5">{step.name}</div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-[#080f1e] border border-[#1a2844] text-xs animate-fade-in" key={eapActiveStep}>
            <div className="flex items-center gap-2 font-bold text-sky-400 font-mono-code mb-1.5">
              <span>Step {eapSteps[eapActiveStep]?.step}: {eapSteps[eapActiveStep]?.name}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              <span className="text-slate-300 font-semibold">Traffic flow:</span>{' '}
              {eapSteps[eapActiveStep]?.from} <ArrowRight className="w-3 h-3 inline mx-1" /> {eapSteps[eapActiveStep]?.to}
            </p>
            <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{eapSteps[eapActiveStep]?.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
