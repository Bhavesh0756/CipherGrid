import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Power, Shield, Network } from 'lucide-react';
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

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.ip_address.trim())) {
      setErrorMessage('Invalid IPv4 address format');
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
      setErrorMessage(err.message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete virtual device ${device.name}?`)) {
      await deleteDevice(device.id);
      onClose();
    }
  };

  const inputClass = "w-full px-2.5 py-[6px] border border-stone-200 rounded-md text-[12px] bg-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors outline-none";
  const selectClass = "w-full px-2 py-[6px] border border-stone-200 rounded-md text-[12px] bg-white focus:ring-1 focus:ring-cyan-500 outline-none";
  const labelClass = "block text-[11px] font-medium text-stone-600 mb-1";

  return (
    <div className="w-72 bg-white border-l border-stone-200/80 flex flex-col h-full select-text">
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold text-stone-700 uppercase tracking-wide">Inspector</h3>
          <p className="text-[10px] font-mono text-stone-400 truncate max-w-[180px] mt-0.5">{device.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 text-xs">
        {errorMessage && (
          <div className="p-2 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-md text-[10.5px]">
            {errorMessage}
          </div>
        )}
        {saveSuccess && (
          <div className="p-2 bg-emerald-50 border border-emerald-200/60 text-emerald-700 rounded-md text-[10.5px]">
            Configuration saved
          </div>
        )}

        <div>
          <label className={labelClass}>Device Label</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} required />
        </div>

        <div>
          <label className={labelClass}>Type</label>
          <div className="px-2.5 py-[6px] bg-stone-50 border border-stone-100 rounded-md text-stone-500 text-[12px] font-medium">{device.device_type}</div>
        </div>

        <div>
          <label className={labelClass}>IP Address</label>
          <input type="text" value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} className={`${inputClass} font-mono`} required />
        </div>

        <div>
          <label className={labelClass}>MAC Address</label>
          <div className="px-2.5 py-[6px] bg-stone-50 border border-stone-100 rounded-md font-mono text-[10.5px] text-stone-500">{device.mac_address}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Role</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as DeviceRole })} className={selectClass}>
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
            <label className={labelClass}>Trust</label>
            <select value={formData.trust_status} onChange={(e) => setFormData({ ...formData, trust_status: e.target.value as TrustStatus })} className={selectClass}>
              <option value="Trusted">Trusted</option>
              <option value="Untrusted">Untrusted</option>
              <option value="Quarantined">Quarantined</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Purdue Level</label>
          <select value={formData.purdue_level} onChange={(e) => setFormData({ ...formData, purdue_level: e.target.value as PurdueLevel })} className={selectClass}>
            <option value="Level 0">Level 0: Process</option>
            <option value="Level 1">Level 1: Basic Control</option>
            <option value="Level 2">Level 2: Supervisory</option>
            <option value="Level 3">Level 3: Operations</option>
            <option value="Level 3.5">Level 3.5: DMZ</option>
            <option value="Untrusted">Untrusted External</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Allowed Message Types</label>
          <input type="text" value={formData.allowed_actions} onChange={(e) => setFormData({ ...formData, allowed_actions: e.target.value })} placeholder="Sensor Reading, Device Status" className={inputClass} />
          <p className="text-[9px] text-stone-400 mt-0.5">Comma-separated</p>
        </div>

        {/* Status toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            <Power className={`w-3.5 h-3.5 ${formData.is_enabled ? 'text-emerald-500' : 'text-stone-400'}`} />
            <span className="text-[11px] font-medium text-stone-600">Status</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
            className={`px-2.5 py-[3px] rounded-full text-[10px] font-medium transition-colors ${
              formData.is_enabled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-stone-50 text-stone-500 border border-stone-200'
            }`}
          >
            {formData.is_enabled ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* Connections */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600 mb-1.5">
            <Network className="w-3 h-3 text-cyan-600" />
            <span>Links ({deviceConnections.length})</span>
          </div>
          {deviceConnections.length === 0 ? (
            <p className="text-[10px] text-stone-400 italic">No connections</p>
          ) : (
            <div className="space-y-1">
              {deviceConnections.map((c) => {
                const peerId = c.source_id === device.id ? c.target_id : c.source_id;
                return (
                  <div key={c.id} className="px-2 py-1 bg-stone-50 rounded-md flex justify-between items-center text-[10px] font-mono text-stone-600">
                    <span className="truncate max-w-[140px]">{peerId}</span>
                    <span className="text-stone-400">{c.latency_ms}ms</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Public key */}
        {device.public_key_pem && (
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600 mb-1">
              <Shield className="w-3 h-3 text-cyan-600" />
              <span>RSA-2048 Public Key</span>
            </div>
            <div className="bg-stone-900 text-stone-400 p-2 rounded-md font-mono text-[8.5px] overflow-x-auto max-h-16 leading-tight">
              {device.public_key_pem}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-stone-100 flex gap-2">
          <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-[6px] rounded-md transition-colors text-[11px]">
            <Save className="w-3 h-3" />
            Save
          </button>
          <button type="button" onClick={handleDelete} className="p-[6px] border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
