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
  Activity
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

/* ─── Panel wrapper for consistent card appearance ─── */
const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 card-hover ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, badge, iconColor = 'text-sky-400' }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {title}
    </h3>
    {badge && (
      <span className="text-[10px] font-mono-code text-slate-500 bg-[#080f1e] px-2 py-0.5 rounded border border-[#1a2844]">
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
      setSimulationResult({ status: 'ERROR', error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStatusChange = async (device, newStatus) => {
    try {
      const res = await api.updateDevice(device.id, { ...device, status: newStatus });
      if (res.ok) fetchDevices();
    } catch (err) { console.error(err); }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.id || !newDevice.name) return;
    try {
      const res = await api.createDevice(newDevice);
      if (res.ok) {
        setShowAddModal(false);
        setNewDevice({
          id: '', name: '', type: 'PLC', status: 'Authorized', role: 'operator',
          allowed_actions: ['read_telemetry', 'report_status', 'set_setpoint'],
          ip_address: '192.168.1.120',
        });
        fetchDevices();
      } else {
        alert(res.data?.error || 'Registration failed');
      }
    } catch (err) { alert(err.message); }
  };

  const availableActions = [
    'read_telemetry', 'report_status', 'set_setpoint', 'acknowledge_alarm',
    'calibrate_sensor', 'reboot_plc', 'config_update', 'emergency_trip', 'flash_firmware',
  ];

  const statusColorMap = {
    Authorized:   'text-emerald-400',
    Suspended:    'text-amber-400',
    Unauthorized: 'text-rose-400',
    Revoked:      'text-rose-500',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 flowing-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              Industrial Device Registry
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage enrolled SCADA endpoints, evaluate live RBAC policies, and simulate encrypted machine transmissions.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-900/30 flex items-center gap-1.5 transition-all btn-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Device</span>
            </button>
            <button
              onClick={fetchDevices}
              className="p-2 rounded-lg bg-[#080f1e] hover:bg-slate-800 text-slate-400 border border-[#1a2844] transition-colors btn-press"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Device Table */}
        <Panel className="lg:col-span-7 flex flex-col">
          <SectionHeader
            icon={Activity}
            title={`SCADA Device Registry (${devices.length})`}
            badge="Persisted in SQLite"
          />

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a2844] text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Device ID</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium">Role</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2844] font-mono-code">
                {devices.map((dev) => {
                  const isSelected = selectedDevice?.id === dev.id;
                  return (
                    <tr
                      key={dev.id}
                      onClick={() => setSelectedDevice(dev)}
                      className={`cursor-pointer table-row-hover transition-colors ${
                        isSelected ? 'bg-sky-950/20 text-white' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-3 font-bold">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-sky-400' : (statusColorMap[dev.status] || 'bg-slate-600').replace('text-', 'bg-')}`} />
                          <div>
                            <div className="text-[11px]">{dev.id}</div>
                            <div className="text-[10px] text-slate-500 font-sans truncate max-w-[130px]">{dev.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">{dev.type}</td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 rounded bg-[#080f1e] text-[10px] text-sky-300 border border-[#1a2844]">
                          {dev.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant={dev.status} size="xs">{dev.status}</Badge>
                      </td>
                      <td className="py-3 text-right font-sans">
                        <select
                          value={dev.status}
                          onChange={(e) => handleStatusChange(dev, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#080f1e] border border-[#1a2844] text-slate-300 text-[10px] rounded-lg px-1.5 py-1 input-field focus:outline-none font-sans"
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

          {selectedDevice && (
            <div className="mt-4 p-3 rounded-lg bg-[#080f1e] border border-[#1a2844] text-xs animate-fade-in">
              <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">
                Permitted Actions for <span className="text-sky-400 font-mono-code">{selectedDevice.id}</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Array.isArray(selectedDevice.allowed_actions) && selectedDevice.allowed_actions.length > 0 ? (
                  selectedDevice.allowed_actions.map((act) => (
                    <span key={act} className="px-2 py-0.5 rounded-md bg-slate-800/60 text-teal-300 text-[10px] font-mono-code border border-[#1e3158]">
                      {act}
                    </span>
                  ))
                ) : (
                  <span className="text-rose-400 text-[11px]">No permissions — device isolated</span>
                )}
              </div>
            </div>
          )}
        </Panel>

        {/* Simulation Panel */}
        <Panel className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" />
                Simulate Device Transmission
              </h3>
              {selectedDevice && (
                <Badge variant={selectedDevice.status} size="xs">{selectedDevice.id}</Badge>
              )}
            </div>

            {selectedDevice ? (
              <div className="space-y-4">
                {/* Action Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Command / Action
                  </label>
                  <select
                    value={simulationAction}
                    onChange={(e) => setSimulationAction(e.target.value)}
                    className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-3 py-2 text-xs text-slate-200 input-field focus:outline-none font-mono-code"
                  >
                    {availableActions.map((act) => (
                      <option key={act} value={act}>
                        {act} {selectedDevice.allowed_actions?.includes(act) ? '✓' : '⚠️'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sensor Readings */}
                <div className="bg-[#080f1e] border border-[#1a2844] rounded-lg p-3 space-y-2">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Synthetic Sensor Readings
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600 text-[10px]">Temperature (°C)</span>
                      <input
                        type="number"
                        value={telemetryPayload.temperature_c}
                        onChange={(e) => setTelemetryPayload({ ...telemetryPayload, temperature_c: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#0c1428] border border-[#1e3158] rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono-code input-field mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 text-[10px]">Pressure (PSI)</span>
                      <input
                        type="number"
                        value={telemetryPayload.pressure_psi}
                        onChange={(e) => setTelemetryPayload({ ...telemetryPayload, pressure_psi: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#0c1428] border border-[#1e3158] rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono-code input-field mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Transmit Button */}
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-950/40 flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : ''}`} />
                  <span>{isSimulating ? 'Processing Security Pipeline...' : 'Transmit Through Security Pipeline'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-600">
                Select a device from the registry to test transmission.
              </div>
            )}
          </div>

          {/* Simulation Result */}
          {simulationResult && (
            <div className="mt-4 pt-4 border-t border-[#1a2844] animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Transmission Verdict</span>
                <Badge variant={simulationResult.status === 'ACCEPTED' ? 'success' : 'failure'} size="sm">
                  {simulationResult.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{simulationResult.reason}</p>

              {simulationResult.status === 'ACCEPTED' && simulationResult.security_pipeline && (
                <div className="space-y-2">
                  <div className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
                    Cryptographic Artifacts
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#030712] border border-[#1a2844] space-y-1 font-mono-code text-[10px]">
                    <div className="truncate">
                      <span className="text-sky-400">AES-GCM Nonce · </span>
                      <span className="text-slate-400">{simulationResult.security_pipeline.symmetric_encryption.nonce_b64}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-teal-400">SHA-256 Digest · </span>
                      <span className="text-slate-400">{simulationResult.security_pipeline.integrity_digest.hash_hex}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-violet-400">RSA-PSS Sig · </span>
                      <span className="text-slate-400">{simulationResult.security_pipeline.digital_signature.signature_b64.slice(0, 32)}…</span>
                    </div>
                  </div>
                </div>
              )}

              {simulationResult.status === 'REJECTED' && (
                <div className="p-3 rounded-lg alert-critical text-rose-300 text-xs">
                  <strong>Access Policy Violation Logged</strong>
                  <p className="text-[11px] text-rose-400/80 mt-1 leading-relaxed">
                    Event written to SQLite security audit table. Command dropped at SCADA gateway.
                  </p>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Enroll Device Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c1428] border border-[#1e3158] rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/60 animate-fade-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Enroll New Device</h3>
                <p className="text-xs text-slate-400 mt-0.5">Register a virtual ICS node with unique hardware ID and role.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Device ID (Unique Identifier)</label>
                <input
                  type="text" required
                  placeholder="e.g. PLC-TURBINE-02"
                  value={newDevice.id}
                  onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value.toUpperCase() })}
                  className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-3 py-2 text-slate-100 font-mono-code input-field"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Device Name / Location</label>
                <input
                  type="text" required
                  placeholder="e.g. Auxiliary Steam Generator"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-3 py-2 text-slate-100 input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Device Type</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-2.5 py-2 text-slate-100 input-field"
                  >
                    <option>PLC</option>
                    <option>RTU</option>
                    <option>Smart Sensor</option>
                    <option>Actuator Controller</option>
                    <option>HMI Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-2.5 py-2 text-slate-100 input-field"
                  >
                    <option>Authorized</option>
                    <option>Suspended</option>
                    <option>Unauthorized</option>
                    <option>Revoked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={newDevice.role}
                  onChange={(e) => setNewDevice({ ...newDevice, role: e.target.value })}
                  className="w-full bg-[#080f1e] border border-[#1a2844] rounded-lg px-2.5 py-2 text-slate-100 input-field"
                >
                  <option value="operator">operator</option>
                  <option value="telemetry_node">telemetry_node</option>
                  <option value="maintenance_supervisor">maintenance_supervisor</option>
                  <option value="admin_controller">admin_controller</option>
                  <option value="untrusted_sensor">untrusted_sensor</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors btn-press"
                >
                  Enroll Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
