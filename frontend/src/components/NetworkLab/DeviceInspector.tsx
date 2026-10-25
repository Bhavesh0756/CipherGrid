import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Eye,
  HardDrive,
  Key,
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
import { computeKeyFingerprint } from '../../utils/cryptoUtils';

interface DeviceInspectorProps {
  device: Device;
  onClose: () => void;
}

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'Sensor': return <Thermometer className="w-5 h-5 text-blue-400" />;
    case 'PLC': return <Cpu className="w-5 h-5 text-blue-400" />;
    case 'SCADA Server': return <HardDrive className="w-5 h-5 text-blue-400" />;
    case 'Operator Workstation': return <Laptop className="w-5 h-5 text-slate-300" />;
    case 'Industrial Gateway': return <Network className="w-5 h-5 text-blue-400" />;
    case 'Ethernet Switch': return <Layers className="w-5 h-5 text-slate-300" />;
    case 'Router': return <RouterIcon className="w-5 h-5 text-slate-300" />;
    case 'Monitoring Server': return <Eye className="w-5 h-5 text-blue-400" />;
    case 'Untrusted Device': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    default: return <Activity className="w-5 h-5 text-slate-400" />;
  }
};

const getManufacturerAndModel = (type: DeviceType, name: string) => {
  switch (type) {
    case 'Ethernet Switch':
      return { manufacturer: 'Cisco Industrial', model: 'IE-3300 Rugged' };
    case 'PLC':
      return { manufacturer: 'Siemens SIMATIC', model: 'S7-1500 Fail-Safe' };
    case 'SCADA Server':
      return { manufacturer: 'Schneider Electric', model: 'EcoStruxure Foxboro' };
    case 'Operator Workstation':
      return { manufacturer: 'Dell Industrial', model: 'Precision 7920' };
    case 'Monitoring Server':
      return { manufacturer: 'Claroty OT', model: 'CTD-200 Deep Packet' };
    case 'Industrial Gateway':
      return { manufacturer: 'Moxa Technologies', model: 'MGate 5105-MB-EIP' };
    case 'Router':
      return { manufacturer: 'Cisco Systems', model: 'IR1101 Industrial Router' };
    case 'Sensor':
      return { manufacturer: 'Endress+Hauser', model: 'iTEMP TMT162' };
    case 'Untrusted Device':
      return { manufacturer: 'Rogue Hardware Tap', model: 'MITM Injection v2.1' };
    default:
      return { manufacturer: 'Industrial Vendor', model: 'OT-Spec V1' };
  }
};

const getDefaultDescription = (type: DeviceType, name: string, purdue: string) => {
  switch (type) {
    case 'Ethernet Switch':
      return 'Core switch handling communications between OT devices in Level 1 network with hardware port isolation.';
    case 'PLC':
      return 'Deterministic programmable logic controller orchestrating high-speed closed-loop turbine telemetry.';
    case 'SCADA Server':
      return 'Central supervisory host aggregating process telemetry and enforcing RSA-PSS signed command authorization.';
    case 'Operator Workstation':
      return 'Human-Machine Interface (HMI) for authorized plant operations engineers with RBAC least-privilege tokens.';
    case 'Monitoring Server':
      return 'Passive OT intrusion detection engine analyzing mirrored mirror packets for cryptographic anomalies.';
    case 'Industrial Gateway':
      return 'Perimeter conduit enforcing Purdue Level 3.5 DMZ boundary isolation and protocol sanitization.';
    case 'Sensor':
      return 'Continuous physical process sensor measuring temperature/pressure and streaming AES-GCM encrypted telemetry.';
    case 'Untrusted Device':
      return 'Unauthorized rogue tap hardware attempting replay attacks and unauthenticated write injections.';
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
    'w-full px-2.5 py-1.5 border border-[#1E2430] rounded-lg text-xs bg-[#141824] text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors font-mono';
  const selectClass =
    'w-full px-2 py-1.5 border border-[#1E2430] rounded-lg text-xs bg-[#141824] text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-mono';
  const labelClass = 'block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider';

  return (
    <aside className="w-[310px] bg-[#0D1017] border-l border-[#1E2430] flex flex-col h-full select-text shrink-0 z-10 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="h-12 px-4 border-b border-[#1E2430] flex items-center justify-between shrink-0 bg-[#090A0F]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-xs bg-blue-500" />
          <h2 className="text-xs font-bold text-white tracking-tight font-display uppercase">
            DEVICE INSPECTOR
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#161B26] transition-colors cursor-pointer"
          title="Close inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Device Overview Banner */}
      <div className="px-4 py-3.5 border-b border-[#1E2430] flex items-center justify-between shrink-0 bg-[#10131A]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#161B26] border border-[#222B3C] flex items-center justify-center shrink-0 shadow-inner">
            {getDeviceIcon(device.device_type)}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-xs font-bold text-slate-100 truncate leading-snug font-display"
              title={device.name}
            >
              {device.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {device.device_type}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0 ml-2">
          <span
            className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
              device.trust_status === 'Trusted'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {device.trust_status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E2430] px-4 text-xs font-medium shrink-0 gap-6 bg-[#090A0F]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`py-2 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
            activeTab === 'ports'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ports ({deviceConnections.length})
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className={`py-2 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
            activeTab === 'configuration'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Config
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-[#1E2430]/60">
                <span className="text-slate-400 text-[11px] shrink-0">IP Address</span>
                <span className="font-mono text-slate-200 font-medium text-[11px] ml-2 text-right">
                  {device.ip_address}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1E2430]/60">
                <span className="text-slate-400 text-[11px] shrink-0">Purdue Level</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141824] text-slate-300 border border-[#1E2430]">
                  {device.purdue_level}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1E2430]/60">
                <span className="text-slate-400 text-[11px] shrink-0">MAC Hardware</span>
                <span className="font-mono text-slate-300 text-[10.5px] ml-2 text-right">
                  {device.mac_address || '00:1B:44:11:3A:B7'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1E2430]/60">
                <span className="text-slate-400 text-[11px] shrink-0">Hardware OEM</span>
                <span className="text-slate-200 text-[11px] ml-2 text-right font-medium">{manufacturer}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#1E2430]/60">
                <span className="text-slate-400 text-[11px] shrink-0">Chassis Model</span>
                <span className="text-slate-200 text-[11px] ml-2 text-right font-medium">{model}</span>
              </div>
            </div>

            {/* Public Key Fingerprint */}
            <div className="p-2.5 bg-[#10131A] border border-[#1E2430] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-medium uppercase">
                  <Key className="w-3 h-3" />
                  <span>RSA-2048 Public Key</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Unique Key
                </span>
              </div>
              <div className="font-mono text-[9.5px] bg-[#090A0F] p-2 rounded border border-[#1E2430] space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[9px]">
                  <span>SHA-256 Fingerprint:</span>
                  <span className="text-cyan-400 font-bold">2048-bit PSS</span>
                </div>
                <div className="text-amber-300 text-[9.5px] font-bold break-all">
                  {device.public_key_pem
                    ? `SHA256:${(device.key_fingerprint || computeKeyFingerprint(device.public_key_pem)).slice(0, 24)}...`
                    : 'Key Not Provisioned'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-2">
              <span className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Operational Role
              </span>
              <div className="p-2.5 bg-[#10131A] border border-[#1E2430] rounded-lg text-slate-300 text-[11px] leading-relaxed">
                {description}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ports' && (
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Virtual Conduits
            </div>
            {deviceConnections.length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic bg-[#10131A]/40 rounded-lg border border-dashed border-[#1E2430] text-xs font-mono">
                No active links to this node.
              </div>
            ) : (
              <div className="space-y-2">
                {deviceConnections.map((c) => {
                  const peerId = c.source_id === device.id ? c.target_id : c.source_id;
                  const port = c.source_id === device.id ? c.source_port : c.target_port;
                  return (
                    <div
                      key={c.id}
                      className="p-2.5 bg-[#10131A] border border-[#1E2430] rounded-lg flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-200 text-xs truncate">
                          {peerId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          Port: {port || 'eth0'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#141824] text-slate-300 border border-[#1E2430] text-[10px] font-mono shrink-0">
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
          <form onSubmit={handleSave} className="space-y-3">
            {errorMessage && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-[11px] font-mono">
                {errorMessage}
              </div>
            )}
            {saveSuccess && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-mono">
                Updated successfully!
              </div>
            )}

            <div>
              <label className={labelClass}>Device Hostname</label>
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
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>RBAC Role</label>
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
                <label className={labelClass}>Trust Tier</label>
                <select
                  value={formData.trust_status}
                  onChange={(e) => setFormData({ ...formData, trust_status: e.target.value as TrustStatus })}
                  className={selectClass}
                >
                  <option value="Trusted">Trusted</option>
                  <option value="Untrusted">Untrusted</option>
                  <option value="Quarantined">Quarantined</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Purdue Model Zone</label>
              <select
                value={formData.purdue_level}
                onChange={(e) => setFormData({ ...formData, purdue_level: e.target.value as PurdueLevel })}
                className={selectClass}
              >
                <option value="Level 0">Level 0: Field / Process</option>
                <option value="Level 1">Level 1: Basic Control</option>
                <option value="Level 2">Level 2: Supervisory SCADA</option>
                <option value="Level 3">Level 3: Operations & SIEM</option>
                <option value="Level 3.5">Level 3.5: Industrial DMZ</option>
                <option value="Untrusted">Untrusted External Zone</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>RBAC Allowed Actions</label>
              <input
                type="text"
                value={formData.allowed_actions}
                onChange={(e) => setFormData({ ...formData, allowed_actions: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E2430]">
              <div className="flex items-center gap-2">
                <Power className={`w-3.5 h-3.5 ${formData.is_enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-[11px] font-mono text-slate-300">Administrative Link</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  formData.is_enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-[#141824] text-slate-400 border border-[#1E2430]'
                }`}
              >
                {formData.is_enabled ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>

            {/* Save & Delete */}
            <div className="pt-2 border-t border-[#1E2430] flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 rounded-lg transition-colors text-xs shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
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
