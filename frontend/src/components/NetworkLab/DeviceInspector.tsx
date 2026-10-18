import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Power, Shield, Activity, Network } from 'lucide-react';
import { Device, DeviceRole, TrustStatus, PurdueLevel } from '../../types';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface DeviceInspectorProps {
  device: Device;
  onClose: () => void;
}

export const DeviceInspector: React.FC<DeviceInspectorProps> = ({ device, onClose }) => {
  const { updateDevice, deleteDevice, connections } = useSimulatorStore();

  const [formData, setFormData] = useState({
    name: device.name,
    ip_address: device.ip_address,
    mac_address: device.mac_address,
    role: device.role,
    trust_status: device.trust_status,
    purdue_level: device.purdue_level,
    is_enabled: device.is_enabled,
    allowed_actions: device.allowed_actions.join(', '),
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: device.name,
      ip_address: device.ip_address,
      mac_address: device.mac_address,
      role: device.role,
      trust_status: device.trust_status,
      purdue_level: device.purdue_level,
      is_enabled: device.is_enabled,
      allowed_actions: device.allowed_actions.join(', '),
    });
    setErrorMessage(null);
    setSaveSuccess(false);
  }, [device]);

  const deviceConnections = connections.filter(
    (c) => c.source_id === device.id || c.target_id === device.id
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate IP address format (simple regex)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.ip_address.trim())) {
      setErrorMessage('Invalid IPv4 address format (e.g., 192.168.10.50)');
      return;
    }

    try {
      const actionsList = formData.allowed_actions
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      await updateDevice(device.id, {
        name: formData.name.trim(),
        ip_address: formData.ip_address.trim(),
        role: formData.role as DeviceRole,
        trust_status: formData.trust_status as TrustStatus,
        purdue_level: formData.purdue_level as PurdueLevel,
        is_enabled: formData.is_enabled,
        allowed_actions: actionsList,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update device configuration');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete virtual device ${device.name}?`)) {
      await deleteDevice(device.id);
      onClose();
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full select-text shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Device Inspector</h3>
          <p className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">{device.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {errorMessage && (
          <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px]">
            {errorMessage}
          </div>
        )}

        {saveSuccess && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[11px]">
            Device configuration successfully saved!
          </div>
        )}

        <div>
          <label className="block font-medium text-slate-700 mb-1">Device Label</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Device Type</label>
          <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-medium">
            {device.device_type}
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">IP Address (IPv4)</label>
          <input
            type="text"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Hardware MAC Address</label>
          <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] text-slate-600">
            {device.mac_address}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as DeviceRole })}
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="Sensor">Sensor</option>
              <option value="Controller">Controller</option>
              <option value="SCADA">SCADA</option>
              <option value="Operator">Operator</option>
              <option value="Gateway">Gateway</option>
              <option value="Switch">Switch</option>
              <option value="Router">Router</option>
              <option value="Monitor">Monitor</option>
              <option value="Untrusted">Untrusted</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Trust Status</label>
            <select
              value={formData.trust_status}
              onChange={(e) => setFormData({ ...formData, trust_status: e.target.value as TrustStatus })}
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="Trusted">Trusted</option>
              <option value="Untrusted">Untrusted</option>
              <option value="Quarantined">Quarantined</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Purdue Model Level</label>
          <select
            value={formData.purdue_level}
            onChange={(e) => setFormData({ ...formData, purdue_level: e.target.value as PurdueLevel })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="Level 0">Level 0: Process</option>
            <option value="Level 1">Level 1: Basic Control</option>
            <option value="Level 2">Level 2: Supervisory Control</option>
            <option value="Level 3">Level 3: Site Operations</option>
            <option value="Level 3.5">Level 3.5: Industrial DMZ</option>
            <option value="Untrusted">Untrusted External</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Allowed Message Types</label>
          <input
            type="text"
            value={formData.allowed_actions}
            onChange={(e) => setFormData({ ...formData, allowed_actions: e.target.value })}
            placeholder="Sensor Reading, Device Status..."
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">Comma-separated allowed operation types</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Power className={`w-4 h-4 ${formData.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="font-medium text-slate-700">Administrative Status</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              formData.is_enabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            {formData.is_enabled ? 'Online / Enabled' : 'Offline / Disabled'}
          </button>
        </div>

        {/* Active Link Connections */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-2">
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>Connected Interfaces ({deviceConnections.length})</span>
          </div>
          {deviceConnections.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No links wired to this node.</p>
          ) : (
            <div className="space-y-1">
              {deviceConnections.map((c) => {
                const isSrc = c.source_id === device.id;
                const peerId = isSrc ? c.target_id : c.source_id;
                return (
                  <div key={c.id} className="p-1.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-700 truncate max-w-[150px]">To: {peerId}</span>
                    <span className="text-slate-400">{c.latency_ms}ms</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Public Key Display */}
        {device.public_key_pem && (
          <div className="pt-2 border-t border-slate-200">
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>RSA-2048 Public Key (PEM)</span>
            </label>
            <div className="bg-slate-900 text-slate-300 p-2 rounded font-mono text-[9px] overflow-x-auto max-h-20 leading-tight">
              {device.public_key_pem}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex gap-2">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center p-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete virtual device"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
