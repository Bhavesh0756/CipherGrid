import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Send, 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  X,
  Lock,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

/* ─── Panel wrapper for consistent card appearance ─── */
const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0b1524] border border-[#14243b] rounded-2xl p-6 shadow-xl card-hover ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, badge, iconColor = 'text-cyan-400' }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-bold text-white flex items-center gap-2">
      <div className={`p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span>{title}</span>
    </h3>
    {badge && (
      <span className="text-[10px] font-mono-code text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
        {badge}
      </span>
    )}
  </div>
);

export const IndustrialDevices = () => {
  const [devices, setDevices] = useState([]);
  const [rolesMeta, setRolesMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [simulationAction, setSimulationAction] = useState('read_telemetry');
  const [telemetryPayload, setTelemetryPayload] = useState({
    temperature_c: 74.5,
    pressure_psi: 412.0,
    turbine_rpm: 3600,
    operational_state: 'NOMINAL',
  });
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    id: '',
    name: '',
    type: 'PLC',
    status: 'Authorized',
    role: 'operator',
    allowed_actions: ['read_telemetry', 'report_status', 'set_setpoint'],
    ip_address: '192.168.1.120',
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.getDevices();
      if (res.ok && res.data?.success) {
        setDevices(res.data.devices);
        if (!selectedDevice && res.data.devices.length > 0) {
          setSelectedDevice(res.data.devices[0]);
        }
      }
      const metaRes = await api.getRolesMeta();
      if (metaRes.ok && metaRes.data?.success) setRolesMeta(metaRes.data);
    } catch (err) {
      setError(err.message || 'Error loading devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const handleSimulate = async () => {
    if (!selectedDevice) return;
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.simulateDeviceMessage(selectedDevice.id, {
        action: simulationAction,
        payload: telemetryPayload,
      });
      setSimulationResult(res.data);
      fetchDevices();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStatusChange = async (device, newStatus) => {
    await api.updateDeviceStatus(device.id, newStatus);
    fetchDevices();
    if (selectedDevice?.id === device.id) {
      setSelectedDevice({ ...selectedDevice, status: newStatus });
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.id || !newDevice.name) return;
    const res = await api.createDevice(newDevice);
    if (res.ok && res.data?.success) {
      setShowAddModal(false);
      setNewDevice({
        id: '',
        name: '',
        type: 'PLC',
        status: 'Authorized',
        role: 'operator',
        allowed_actions: ['read_telemetry', 'report_status', 'set_setpoint'],
        ip_address: '192.168.1.120',
      });
      fetchDevices();
    }
  };

  const availableActions = [
    'read_telemetry',
    'report_status',
    'write_control',
    'set_setpoint',
    'emergency_trip',
    'firmware_update',
  ];

  return (
    <div className="space-y-6">
      {/* Header matching Reference */}
      <div className="relative overflow-hidden bg-[#0a1220] border border-[#14243b] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-[10px] font-mono-code uppercase tracking-wider text-cyan-400 font-semibold">
              SCADA Hardware Admission
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Industrial Device Registry & Admission
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Manage enrolled virtual industrial controllers (PLCs, RTUs, flow sensors). Enforce hardware identity keys and simulate end-to-end cryptographic telemetry transmission.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0e2a38]/85 hover:bg-[#13384a] text-cyan-300 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2 transition-all btn-press border border-cyan-500/50 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Enroll New Node</span>
          </button>
          <button
            onClick={fetchDevices}
            className="p-2.5 rounded-xl bg-[#0c1626] hover:bg-[#112036] text-slate-300 border border-[#162942] transition-colors btn-press shadow-sm cursor-pointer"
            title="Refresh Node Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Table */}
        <Panel className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <SectionHeader
              icon={Activity}
              title={`Enrolled SCADA Nodes (${devices.length})`}
              badge="Hardware Registry"
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="pb-3">Node ID</th>
                    <th className="pb-3">Architecture</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Admission State</th>
                    <th className="pb-3 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-code">
                  {devices.map((dev) => {
                    const isSelected = selectedDevice?.id === dev.id;
                    return (
                      <tr
                        key={dev.id}
                        onClick={() => setSelectedDevice(dev)}
                        className={`cursor-pointer table-row-hover transition-all ${
                          isSelected 
                            ? 'bg-cyan-500/10 text-white border-l-2 border-l-cyan-400' 
                            : 'text-slate-300'
                        }`}
                      >
                        <td className="py-3.5 pl-2 font-bold">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-600'}`} />
                            <div>
                              <div className="text-xs text-white">{dev.id}</div>
                              <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px] mt-0.5">{dev.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-400 text-[11px]">{dev.type}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-bold">
                            {dev.role}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <Badge variant={dev.status} size="xs">{dev.status}</Badge>
                        </td>
                        <td className="py-3.5 text-right font-sans">
                          <select
                            value={dev.status}
                            onChange={(e) => handleStatusChange(dev, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#090d16] border border-slate-700/80 text-slate-200 text-[10px] rounded-lg px-2 py-1 input-field focus:outline-none font-sans cursor-pointer"
                          >
                            <option value="Authorized">Authorized</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Unauthorized">Unauthorized</option>
                            <option value="Revoked">Revoked</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedDevice && (
            <div className="mt-5 p-4 rounded-xl bg-[#090d16] border border-[#1a253a] text-xs animate-fade-in">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-2">
                Permitted Least-Privilege Capabilities: <span className="text-cyan-400 font-mono-code">{selectedDevice.id}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(selectedDevice.allowed_actions) && selectedDevice.allowed_actions.length > 0 ? (
                  selectedDevice.allowed_actions.map((act) => (
                    <span key={act} className="px-2.5 py-0.5 rounded-md bg-cyan-950/40 text-cyan-300 text-[10px] font-mono-code border border-cyan-500/30">
                      ✓ {act}
                    </span>
                  ))
                ) : (
                  <span className="text-rose-400 text-[11px] font-semibold">No permissions active — device quarantined</span>
                )}
              </div>
            </div>
          )}
        </Panel>

        {/* Transmission Simulator Panel */}
        <Panel className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Radio className="w-4 h-4" />
                </div>
                <span>Simulate Node Transmission</span>
              </h3>
              {selectedDevice && (
                <Badge variant={selectedDevice.status} size="xs">{selectedDevice.id}</Badge>
              )}
            </div>

            {selectedDevice ? (
              <div className="space-y-4">
                {/* Action Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Target SCADA Command
                  </label>
                  <select
                    value={simulationAction}
                    onChange={(e) => setSimulationAction(e.target.value)}
                    className="w-full bg-[#090d16] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white input-field font-mono-code cursor-pointer"
                  >
                    {availableActions.map((act) => (
                      <option key={act} value={act}>
                        {act} {selectedDevice.allowed_actions?.includes(act) ? '(Permitted)' : '(Unauthorized)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sensor Readings Input */}
                <div className="bg-[#090d16] border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Live Synthetic Sensor Readings</span>
                    <span className="text-cyan-400 font-mono-code">Telemetry Buffer</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">Temperature (°C)</span>
                      <input
                        type="number"
                        value={telemetryPayload.temperature_c}
                        onChange={(e) => setTelemetryPayload({ ...telemetryPayload, temperature_c: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#0e1320] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code input-field"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">Pressure (PSI)</span>
                      <input
                        type="number"
                        value={telemetryPayload.pressure_psi}
                        onChange={(e) => setTelemetryPayload({ ...telemetryPayload, pressure_psi: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#0e1320] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Transmit Button */}
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all btn-press border border-cyan-400/30 disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isSimulating ? 'animate-pulse text-cyan-200' : ''}`} />
                  <span>{isSimulating ? 'Executing Cryptographic Pipeline…' : 'Transmit Through Security Pipeline'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500">
                Select a node from the registry to simulate transmission.
              </div>
            )}
          </div>

          {/* Simulation Result Output */}
          {simulationResult && (
            <div className="mt-5 pt-4 border-t border-slate-800 animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Ingress Verdict</span>
                <Badge variant={simulationResult.status === 'ACCEPTED' ? 'success' : 'failure'} size="sm">
                  {simulationResult.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#090d16] p-3 rounded-xl border border-slate-800">
                {simulationResult.reason}
              </p>

              {simulationResult.status === 'ACCEPTED' && simulationResult.security_pipeline && (
                <div className="space-y-2">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cryptographic Verification Artifacts</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 space-y-1.5 font-mono-code text-[10px]">
                    <div className="truncate">
                      <span className="text-cyan-400 font-semibold">AES-GCM Nonce: </span>
                      <span className="text-slate-300">{simulationResult.security_pipeline.symmetric_encryption.nonce_b64}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-teal-400 font-semibold">SHA-256 Digest: </span>
                      <span className="text-slate-300">{simulationResult.security_pipeline.integrity_digest.hash_hex}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-violet-400 font-semibold">RSA-PSS Sig: </span>
                      <span className="text-slate-300">{simulationResult.security_pipeline.digital_signature.signature_b64.slice(0, 36)}…</span>
                    </div>
                  </div>
                </div>
              )}

              {simulationResult.status === 'REJECTED' && (
                <div className="p-3 rounded-xl alert-critical text-rose-300 text-xs">
                  <strong>Access Policy Violation Logged</strong>
                  <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed">
                    Unauthorized command dropped at SCADA boundary. Security event written to immutable SQLite ledger.
                  </p>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Enroll Device Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0e1320] border border-[#1c263c] rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/80 animate-fade-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Enroll New SCADA Node</h3>
                <p className="text-xs text-slate-400 mt-0.5">Register an industrial endpoint into the admission ledger.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Hardware Device ID</label>
                <input
                  type="text" required
                  placeholder="e.g. PLC-TURBINE-02"
                  value={newDevice.id}
                  onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value.toUpperCase() })}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono-code input-field"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Location / Function Description</label>
                <input
                  type="text" required
                  placeholder="e.g. Secondary Steam Manifold Valve"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2 text-white input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Architecture</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-2.5 py-2 text-white input-field cursor-pointer"
                  >
                    <option>PLC</option>
                    <option>RTU</option>
                    <option>Smart Sensor</option>
                    <option>Actuator Controller</option>
                    <option>HMI Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Admission</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-2.5 py-2 text-white input-field cursor-pointer"
                  >
                    <option value="Authorized">Authorized</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Unauthorized">Unauthorized</option>
                    <option value="Revoked">Revoked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Role & Privilege Tier</label>
                <select
                  value={newDevice.role}
                  onChange={(e) => setNewDevice({ ...newDevice, role: e.target.value })}
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-2.5 py-2 text-white input-field cursor-pointer"
                >
                  <option value="operator">operator</option>
                  <option value="telemetry_node">telemetry_node</option>
                  <option value="maintenance_supervisor">maintenance_supervisor</option>
                  <option value="admin_controller">admin_controller</option>
                  <option value="untrusted_sensor">untrusted_sensor</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold transition-colors btn-press shadow-lg shadow-cyan-950/50"
                >
                  Enroll Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
