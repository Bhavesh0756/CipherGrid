import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Eye,
  HardDrive,
  Laptop,
  Layers,
  Network,
  Power,
  Radio,
  Router as RouterIcon,
  Save,
  Shield,
  ShieldAlert,
  Thermometer,
  Trash2,
  X,
} from 'lucide-react';
import { Device, DeviceRole, DeviceType, PurdueLevel, TrustStatus } from '../../types';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface DeviceInspectorProps {
  device: Device;
  onClose: () => void;
}

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'Sensor': return <Thermometer className="w-5 h-5" />;
    case 'PLC': return <Cpu className="w-5 h-5" />;
    case 'SCADA Server': return <HardDrive className="w-5 h-5" />;
    case 'Operator Workstation': return <Laptop className="w-5 h-5" />;
    case 'Industrial Gateway': return <Network className="w-5 h-5" />;
    case 'Ethernet Switch': return <Layers className="w-5 h-5" />;
    case 'Router': return <RouterIcon className="w-5 h-5" />;
    case 'Monitoring Server': return <Eye className="w-5 h-5" />;
    case 'Untrusted Device': return <ShieldAlert className="w-5 h-5" />;
    default: return <Activity className="w-5 h-5" />;
  }
};

const getManufacturerAndModel = (type: DeviceType, name: string) => {
  switch (type) {
    case 'Ethernet Switch':
      return { manufacturer: 'Cisco', model: 'IE-3300' };
    case 'PLC':
      return { manufacturer: 'Siemens', model: 'S7-1500' };
    case 'SCADA Server':
      return { manufacturer: 'Schneider', model: 'Foxboro' };
    case 'Operator Workstation':
      return { manufacturer: 'Dell', model: 'Precision' };
    case 'Monitoring Server':
      return { manufacturer: 'Claroty', model: 'CTD-200' };
    case 'Industrial Gateway':
      return { manufacturer: 'Moxa', model: 'MGate' };
    case 'Router':
      return { manufacturer: 'Cisco', model: 'IR1101' };
    case 'Sensor':
      return { manufacturer: 'Endress', model: 'iTEMP' };
    case 'Untrusted Device':
      return { manufacturer: 'Rogue Tap', model: 'Tap v1' };
    default:
      return { manufacturer: 'Vendor', model: 'Standard' };
  }
};

const getDefaultDescription = (type: DeviceType, name: string, purdue: string) => {
  switch (type) {
    case 'Ethernet Switch':
      return 'Core switch handling communications between OT devices in Level 1 network.';
    case 'PLC':
      return 'Programmable logic controller orchestrating closed-loop turbine telemetry and control actuators.';
    case 'SCADA Server':
      return 'Central supervisory control host aggregating process telemetry and issuing operational commands.';
    case 'Operator Workstation':
      return 'Human-Machine Interface workstation for authorized OT plant engineers and operators.';
    case 'Monitoring Server':
      return 'Passive OT network security and anomaly detection monitor analyzing industrial traffic.';
    case 'Industrial Gateway':
      return 'Perimeter conduit enforcing industrial DMZ separation and protocol conversion.';
    case 'Sensor':
      return 'Continuous field sensor measuring process physical variables and streaming telemetric data.';
    case 'Untrusted Device':
      return 'Unauthorized rogue tap device attempting unauthenticated ingress into the OT subnet.';
    default:
      return `Industrial control system node operating within ${purdue}.`;
  }
};

export const DeviceInspector: React.FC<DeviceInspectorProps> = ({ device, onClose }) => {
  const { updateDevice, deleteDevice, connections } = useSimulatorStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'configuration'>('overview');

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

  const { manufacturer, model } = getManufacturerAndModel(device.device_type, device.name);
  const description = getDefaultDescription(device.device_type, device.name, device.purdue_level);

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

  const inputClass =
    'w-full px-2.5 py-1 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';
  const selectClass =
    'w-full px-2 py-1 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500 transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-0.5';

  return (
    <aside className="w-[290px] bg-white border-l border-slate-200 flex flex-col h-full select-text shrink-0 z-10 overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold text-slate-900 tracking-tight">
          Node Details
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Device Overview Banner */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            {getDeviceIcon(device.device_type)}
          </div>
          <div className="min-w-0">
            <h3
              className="text-xs font-bold text-slate-900 truncate leading-snug"
              title={device.name}
            >
              {device.name}
            </h3>
            <p className="text-[10.5px] text-slate-400 font-medium">
              {device.device_type}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0 ml-1">
          {device.trust_status === 'Trusted' && (
            <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Trusted
            </span>
          )}
          {device.trust_status === 'Untrusted' && (
            <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Untrusted
            </span>
          )}
          {device.trust_status === 'Quarantined' && (
            <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Quarantined
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-3 text-xs font-medium shrink-0 justify-between">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-1 border-b-2 text-[11.5px] transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`py-2 px-1 border-b-2 text-[11.5px] transition-all cursor-pointer ${
            activeTab === 'ports'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ports ({deviceConnections.length})
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className={`py-2 px-1 border-b-2 text-[11.5px] transition-all cursor-pointer ${
            activeTab === 'configuration'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Configuration
        </button>
      </div>

      {/* Tab Contents - Scrollable internal area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Key-Value Pairs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">Name</span>
                <span className="text-slate-900 font-semibold text-[11.5px] truncate ml-2 text-right">
                  {device.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">Type</span>
                <span className="text-slate-900 font-medium text-[11.5px] ml-2 text-right">
                  {device.device_type}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">IP Address</span>
                <span className="font-mono text-slate-900 font-medium text-[11px] ml-2 text-right">
                  {device.ip_address}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">Purdue Level</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold">
                  {device.purdue_level}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">Trust Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    device.trust_status === 'Trusted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {device.trust_status}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">MAC Address</span>
                <span className="font-mono text-slate-700 text-[10.5px] ml-2 text-right">
                  {device.mac_address || '00:1B:44:11:3A:B7'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">Manufacturer</span>
                <span className="text-slate-900 font-medium text-[11.5px] ml-2 text-right">{manufacturer}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-[11px] shrink-0">Model</span>
                <span className="text-slate-900 font-medium text-[11.5px] ml-2 text-right">{model}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-2.5">
              <span className="block text-slate-500 font-medium text-[11px] mb-1">
                Description
              </span>
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-600 text-[11px] leading-relaxed break-words">
                {description}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ports' && (
          <div className="space-y-2.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Attached Conduits & Links
            </div>
            {deviceConnections.length === 0 ? (
              <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs">
                No active connections.
              </div>
            ) : (
              <div className="space-y-1.5">
                {deviceConnections.map((c) => {
                  const peerId = c.source_id === device.id ? c.target_id : c.source_id;
                  const port = c.source_id === device.id ? c.source_port : c.target_port;
                  return (
                    <div
                      key={c.id}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-800 text-[11.5px] truncate">
                          {peerId}
                        </div>
                        <div className="text-[9.5px] text-slate-400 font-mono mt-0.5 truncate">
                          Port: {port || 'eth0'}
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9.5px] font-semibold shrink-0">
                        {c.latency_ms} ms
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'configuration' && (
          <form onSubmit={handleSave} className="space-y-2.5">
            {errorMessage && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[11px] font-medium">
                {errorMessage}
              </div>
            )}
            {saveSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[11px] font-medium">
                Saved successfully!
              </div>
            )}

            <div>
              <label className={labelClass}>Device Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>IP Address</label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className={`${inputClass} font-mono`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as DeviceRole })}
                  className={selectClass}
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
                <label className={labelClass}>Trust</label>
                <select
                  value={formData.trust_status}
                  onChange={(e) => setFormData({ ...formData, trust_status: e.target.value as TrustStatus })}
                  className={selectClass}
                >
                  <option value="Trusted">Trusted</option>
                  <option value="Untrusted">Untrusted</option>
                  <option value="Quarantined">Quarantine</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Purdue Level</label>
              <select
                value={formData.purdue_level}
                onChange={(e) => setFormData({ ...formData, purdue_level: e.target.value as PurdueLevel })}
                className={selectClass}
              >
                <option value="Level 0">Level 0: Process</option>
                <option value="Level 1">Level 1: Basic Control</option>
                <option value="Level 2">Level 2: Supervisory</option>
                <option value="Level 3">Level 3: Operations</option>
                <option value="Level 3.5">Level 3.5: DMZ</option>
                <option value="Untrusted">Untrusted</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Allowed Actions</label>
              <input
                type="text"
                value={formData.allowed_actions}
                onChange={(e) => setFormData({ ...formData, allowed_actions: e.target.value })}
                className={inputClass}
              />
              <span className="text-[9.5px] text-slate-400 block mt-0.5">Comma-separated</span>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Power className={`w-3.5 h-3.5 ${formData.is_enabled ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[11.5px] font-semibold text-slate-700">Online State</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer ${
                  formData.is_enabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {formData.is_enabled ? 'Online' : 'Offline'}
              </button>
            </div>

            {/* Save & Delete Buttons */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded-md transition-all text-xs shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                title="Delete device"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
};
