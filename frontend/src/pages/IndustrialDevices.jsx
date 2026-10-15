import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Send, 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lock,
  Layers,
  Activity
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

export const IndustrialDevices = () => {
  const [devices, setDevices] = useState([]);
  const [rolesMeta, setRolesMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulation State
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

  // New Device Form State
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
      if (metaRes.ok && metaRes.data?.success) {
        setRolesMeta(metaRes.data);
      }
    } catch (err) {
      setError(err.message || 'Error loading devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

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
      fetchDevices(); // Refresh last_seen
    } catch (err) {
      setSimulationResult({ status: 'ERROR', error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStatusChange = async (device, newStatus) => {
    try {
      const res = await api.updateDevice(device.id, { ...device, status: newStatus });
      if (res.ok) {
        fetchDevices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.id || !newDevice.name) return;
    try {
      const res = await api.createDevice(newDevice);
      if (res.ok) {
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
      } else {
        alert(res.data?.error || 'Registration failed');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const availableActions = [
    'read_telemetry',
    'report_status',
    'set_setpoint',
    'acknowledge_alarm',
    'calibrate_sensor',
    'reboot_plc',
    'config_update',
    'emergency_trip',
    'flash_firmware',
  ];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1629]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Industrial Devices & Virtual Nodes (Module 3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage enrolled SCADA hardware endpoints, evaluate live RBAC policies, and simulate encrypted machine transmissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Device</span>
          </button>
          <button
            onClick={fetchDevices}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Devices"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Devices List and Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Registered Devices Table */}
        <div className="lg:col-span-7 bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                SCADA Device Registry ({devices.length})
              </h3>
              <span className="text-xs font-mono-code text-slate-400">
                Persisted in SQLite
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-medium">Device ID</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-code">
                  {devices.map((dev) => {
                    const isSelected = selectedDevice?.id === dev.id;
                    return (
                      <tr 
                        key={dev.id} 
                        onClick={() => setSelectedDevice(dev)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-950/30 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 font-bold">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                            <span>{dev.id}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans truncate max-w-[130px]">
                            {dev.name}
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-400">{dev.type}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] text-cyan-300 border border-slate-700/60">
                            {dev.role}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Badge variant={dev.status} size="xs">
                            {dev.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right font-sans">
                          <select
                            value={dev.status}
                            onChange={(e) => handleStatusChange(dev, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-cyan-500"
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
            <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Allowed Actions for {selectedDevice.id}:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Array.isArray(selectedDevice.allowed_actions) && selectedDevice.allowed_actions.length > 0 ? (
                  selectedDevice.allowed_actions.map((act) => (
                    <span key={act} className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 text-[11px] font-mono-code border border-slate-700">
                      {act}
                    </span>
                  ))
                ) : (
                  <span className="text-rose-400 text-xs">No permissions granted (Isolated)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Interactive Message Simulation & Security Pipeline */}
        <div className="lg:col-span-5 bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Simulate Device Message</span>
              </h3>
              {selectedDevice && (
                <Badge variant={selectedDevice.status} size="xs">
                  {selectedDevice.id}
                </Badge>
              )}
            </div>

            {selectedDevice ? (
              <div className="space-y-4">
                {/* Select Action */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Select Industrial Command / Action
                  </label>
                  <select
                    value={simulationAction}
                    onChange={(e) => setSimulationAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono-code"
                  >
                    {availableActions.map((act) => (
                      <option key={act} value={act}>
                        {act} {selectedDevice.allowed_actions?.includes(act) ? '✓ (Permitted)' : '⚠️ (Forbidden by Role)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sample Telemetry Parameters */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Synthetic Industrial Sensor Readings
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px]">Temperature (°C):</span>
                      <input
                        type="number"
                        value={telemetryPayload.temperature_c}
                        onChange={(e) => setTelemetryPayload({ ...telemetryPayload, temperature_c: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono-code"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Pressure (PSI):</span>
                      <input
                        type="number"
                        value={telemetryPayload.pressure_psi}
                        onChange={(e) => setTelemetryPayload({ ...telemetryPayload, pressure_psi: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono-code"
                      />
                    </div>
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : ''}`} />
                  <span>{isSimulating ? 'Processing Cryptographic Pipeline...' : 'Transmit Through Security Pipeline'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                Please select a device from the left panel to test transmission.
              </div>
            )}
          </div>

          {/* Simulation Output Result Box */}
          {simulationResult && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Transmission Verdict:</span>
                <Badge variant={simulationResult.status === 'ACCEPTED' ? 'success' : 'failure'} size="sm">
                  {simulationResult.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                {simulationResult.reason}
              </p>

              {simulationResult.status === 'ACCEPTED' && simulationResult.security_pipeline && (
                <div className="space-y-2 mt-2">
                  <div className="text-[11px] text-teal-400 font-semibold uppercase tracking-wider">
                    Cryptographic Artifacts Generated
                  </div>
                  <div className="p-2 rounded bg-[#070d19] border border-slate-800 space-y-1 font-mono-code text-[11px]">
                    <div className="truncate text-slate-400">
                      <span className="text-cyan-400">AES-GCM Nonce:</span> {simulationResult.security_pipeline.symmetric_encryption.nonce_b64}
                    </div>
                    <div className="truncate text-slate-400">
                      <span className="text-teal-400">SHA-256 Digest:</span> {simulationResult.security_pipeline.integrity_digest.hash_hex}
                    </div>
                    <div className="truncate text-slate-400">
                      <span className="text-indigo-400">RSA-PSS Sig:</span> {simulationResult.security_pipeline.digital_signature.signature_b64.slice(0, 32)}...
                    </div>
                  </div>
                </div>
              )}

              {simulationResult.status === 'REJECTED' && (
                <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs mt-2">
                  <strong>Access Policy Violation Logged:</strong>
                  <p className="text-[11px] text-rose-400/90 mt-1">
                    Event written to SQLite security audit table. Unpermitted commands are dropped at the SCADA gateway to maintain plant safety.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Enroll New Device */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1629] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Enroll New Industrial Device</h3>
            <p className="text-xs text-slate-400 mb-4">
              Register a virtual node with unique Hardware ID and assigned ICS role.
            </p>

            <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Device ID (Unique Identifier):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PLC-TURBINE-02"
                  value={newDevice.id}
                  onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono-code focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Device Name / Location:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auxiliary Steam Generator"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Device Type:</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PLC">PLC</option>
                    <option value="RTU">RTU</option>
                    <option value="Smart Sensor">Smart Sensor</option>
                    <option value="Actuator Controller">Actuator Controller</option>
                    <option value="HMI Gateway">HMI Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Authorization Status:</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Authorized">Authorized</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Unauthorized">Unauthorized</option>
                    <option value="Revoked">Revoked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assigned Role:</label>
                <select
                  value={newDevice.role}
                  onChange={(e) => setNewDevice({ ...newDevice, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="operator">operator</option>
                  <option value="telemetry_node">telemetry_node</option>
                  <option value="maintenance_supervisor">maintenance_supervisor</option>
                  <option value="admin_controller">admin_controller</option>
                  <option value="untrusted_sensor">untrusted_sensor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
