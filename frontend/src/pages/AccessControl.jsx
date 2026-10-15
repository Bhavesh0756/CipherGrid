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
  AlertTriangle,
  Server,
  Cpu,
  Radio,
  Sliders
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

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
    { step: 1, name: 'EAPOL-Start', from: 'Supplicant (Device)', to: 'Authenticator (Switch)', description: 'Device requests link access upon powering on.' },
    { step: 2, name: 'EAP-Request/Identity', from: 'Authenticator (Switch)', to: 'Supplicant (Device)', description: 'Switch prompts device for network identity.' },
    { step: 3, name: 'EAP-Response/Identity', from: 'Supplicant (Device)', to: 'Authenticator (Switch)', description: 'Device supplies hardware identifier.' },
    { step: 4, name: 'RADIUS Access-Request', from: 'Authenticator (Switch)', to: 'RADIUS Auth Server', description: 'Switch forwards identity to central RADIUS server.' },
    { step: 5, name: 'EAP-TLS Handshake', from: 'Supplicant <-> RADIUS', to: 'Mutual Authentication', description: 'Device and RADIUS server mutually verify X.509 certs.' },
    { step: 6, name: 'RADIUS Access-Accept', from: 'RADIUS Auth Server', to: 'Authenticator (Switch)', description: 'RADIUS verifies authorization and signals port admission.' },
    { step: 7, name: 'Port Authorized', from: 'Authenticator (Switch)', to: 'SCADA Network', description: 'Port opens; industrial telemetry frames permitted.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d1629]/70 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Industrial Access Control & RBAC (Module 3)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Role-Based Access Control matrix for SCADA operations, least privilege enforcement, and conceptual IEEE 802.1X / EAP-TLS port-based network authentication.
        </p>
      </div>

      {/* RBAC Matrix & Policy Engine Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive RBAC Policy Evaluator */}
        <div className="lg:col-span-5 bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Live Access Policy Evaluator</span>
              </h3>
              <span className="text-[11px] font-mono-code text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                PoLP Engine
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Select Target Device:</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} — {d.name} ({d.role} | {d.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedDevice && (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Role:</span>
                  <span className="font-mono-code text-cyan-300 font-bold">{selectedDevice.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admission State:</span>
                  <Badge variant={selectedDevice.status} size="xs">{selectedDevice.status}</Badge>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Requested Action to Test:</label>
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono-code focus:outline-none focus:border-cyan-500"
              >
                <option value="read_telemetry">read_telemetry (LOW Risk)</option>
                <option value="report_status">report_status (LOW Risk)</option>
                <option value="acknowledge_alarm">acknowledge_alarm (MEDIUM Risk)</option>
                <option value="set_setpoint">set_setpoint (HIGH Risk)</option>
                <option value="calibrate_sensor">calibrate_sensor (HIGH Risk)</option>
                <option value="reboot_plc">reboot_plc (CRITICAL Risk)</option>
                <option value="config_update">config_update (CRITICAL Risk)</option>
                <option value="emergency_trip">emergency_trip (CRITICAL Risk)</option>
                <option value="flash_firmware">flash_firmware (CRITICAL Risk)</option>
              </select>
            </div>

            <button
              onClick={handleTestPolicy}
              disabled={isTesting}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Evaluate Access Decision</span>
            </button>
          </div>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg border text-xs ${
              testResult.status === 'ACCEPTED'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {testResult.status === 'ACCEPTED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>VERDICT: {testResult.status}</span>
              </div>
              <p className="text-[11px] mt-1 leading-relaxed">{testResult.reason}</p>
              {testResult.details && (
                <div className="mt-2 text-[10px] font-mono-code text-slate-400 border-t border-slate-800/80 pt-1">
                  Policy: {testResult.details.policy || 'RBAC'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Roles & Permissions Matrix */}
        <div className="lg:col-span-7 bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>SCADA Role-Based Permission Matrix</span>
            </h3>
            <span className="text-xs font-mono-code text-slate-400">
              Least Privilege Matrix
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rolesMeta?.roles ? (
                  rolesMeta.roles.map((r) => {
                    let perms = [];
                    try {
                      perms = typeof r.default_permissions === 'string' ? JSON.parse(r.default_permissions) : r.default_permissions;
                    } catch {}
                    return (
                      <tr key={r.name} className="hover:bg-slate-900/40">
                        <td className="py-2.5 font-bold font-mono-code text-cyan-300">
                          {r.name}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px] max-w-[200px]">
                          {r.description}
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {perms.map((p) => (
                              <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono-code text-slate-300 border border-slate-700">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-slate-500">Loading roles...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conceptual IEEE 802.1X / EAP Workflow Section */}
      <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Conceptual IEEE 802.1X / EAP-TLS Port-Based Authentication</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Three-party authentication model: Supplicant → Authenticator (Switch) → Authentication Server (RADIUS).
            </p>
          </div>
          <span className="text-[11px] font-mono-code text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
            Educational Conceptual Model
          </span>
        </div>

        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs">
          <strong>Mandatory Disclosure:</strong> This visual flow simulates the theoretical 802.1X/EAP sequence. Physical IEEE 802.1X requires hardware port authorization (PAE), a managed switch, and a dedicated RADIUS server.
        </div>

        {/* 3 Main Entities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-blue-500/30 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <Cpu className="w-4 h-4" />
              <span>Supplicant</span>
            </div>
            <p className="text-slate-300 font-semibold text-[11px]">Virtual Industrial Device</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Initiates link connection via EAPOL frames; holds local certificate and responds to identity requests.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <Network className="w-4 h-4" />
              <span>Authenticator</span>
            </div>
            <p className="text-slate-300 font-semibold text-[11px]">ICS Managed Switch</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Maintains physical port in 'Unauthorized' state until RADIUS approves; encapsulates EAP in RADIUS frames.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-indigo-500/30 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-400">
              <Server className="w-4 h-4" />
              <span>Auth Server</span>
            </div>
            <p className="text-slate-300 font-semibold text-[11px]">Central RADIUS / EAP-TLS</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Verifies certificate against revocation lists and sends Access-Accept or Access-Reject packet.
            </p>
          </div>
        </div>

        {/* Interactive Step Sequence */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Click Steps to Step Through Handshake:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-1.5">
            {eapSteps.map((step, idx) => {
              const isSelected = eapActiveStep === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => setEapActiveStep(idx)}
                  className={`p-2 rounded border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-mono-code font-bold">Step {step.step}</div>
                  <div className="text-[11px] font-semibold truncate">{step.name}</div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-lg bg-[#070d19] border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-bold text-cyan-400 font-mono-code">
              <span>Step {eapSteps[eapActiveStep]?.step}: {eapSteps[eapActiveStep]?.name}</span>
            </div>
            <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
              <strong>Traffic:</strong> {eapSteps[eapActiveStep]?.from} → {eapSteps[eapActiveStep]?.to}
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {eapSteps[eapActiveStep]?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
