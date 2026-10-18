import React, { useState } from 'react';
import {
  CheckCircle,
  Filter,
  Key,
  Network,
  Power,
  Search,
  Server,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { Device, TrustStatus } from '../types';

export const DeviceInventory: React.FC = () => {
  const { devices, updateDevice, deleteDevice, setSelectedDevice, setActiveSection } =
    useSimulatorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrust, setFilterTrust] = useState<string>('all');
  const [filterPurdue, setFilterPurdue] = useState<string>('all');
  const [selectedKeyDev, setSelectedKeyDev] = useState<Device | null>(null);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip_address.includes(searchTerm) ||
      d.device_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTrust = filterTrust === 'all' || d.trust_status === filterTrust;
    const matchesPurdue = filterPurdue === 'all' || d.purdue_level === filterPurdue;

    return matchesSearch && matchesTrust && matchesPurdue;
  });

  const toggleDeviceState = async (d: Device) => {
    await updateDevice(d.id, { is_enabled: !d.is_enabled });
  };

  const handleInspectOnCanvas = (d: Device) => {
    setSelectedDevice(d);
    setActiveSection('network-lab');
  };

  const selectClass = "px-2.5 py-[6px] border border-stone-200 rounded-lg text-[11.5px] bg-white focus:ring-1 focus:ring-amber-500 outline-none";

  const getTrustBadge = (trust: TrustStatus) => {
    switch (trust) {
      case 'Trusted':
        return <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-2.5 h-2.5" /> Trusted</span>;
      case 'Untrusted':
        return <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9.5px] font-medium bg-rose-50 text-rose-700 border border-rose-100"><ShieldAlert className="w-2.5 h-2.5" /> Untrusted</span>;
      case 'Quarantined':
        return <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9.5px] font-medium bg-amber-50 text-amber-700 border border-amber-100">Quarantine</span>;
    }
  };

  const getPurdueColor = (level: string) => {
    switch (level) {
      case 'Level 0': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Level 1': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Level 2': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Level 3':
      case 'Level 3.5': return 'bg-teal-50 text-teal-700 border-teal-100';
      default: return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  // Counts by purdue level for overview
  const levelCounts = ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Untrusted'].map(l => ({
    level: l,
    count: devices.filter(d => d.purdue_level === l || (l === 'Level 3' && (d.purdue_level === 'Level 3' || d.purdue_level === 'Level 3.5'))).length,
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fafaf9' }}>
      {/* Module header */}
      <div className="px-6 pt-5 pb-4 border-b border-stone-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Server className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Device Inventory</h1>
              <p className="text-[11px] text-stone-400 mt-0.5">Purdue Model asset registry — {devices.length} registered devices</p>
            </div>
          </div>

          {/* Purdue level summary pills */}
          <div className="flex items-center gap-1.5">
            {levelCounts.filter(l => l.count > 0).map(l => (
              <span key={l.level} className={`px-2 py-[2px] rounded-full text-[9.5px] font-medium border ${getPurdueColor(l.level)}`}>
                {l.level === 'Untrusted' ? 'External' : l.level}: {l.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-3 bg-white border-b border-stone-100 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-[7px]" />
          <input
            type="text"
            placeholder="Search by name, IP, type or role…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-[6px] border border-stone-200 rounded-lg text-[11.5px] bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-stone-400" />
          <select value={filterTrust} onChange={(e) => setFilterTrust(e.target.value)} className={selectClass}>
            <option value="all">All Trust</option>
            <option value="Trusted">Trusted</option>
            <option value="Untrusted">Untrusted</option>
            <option value="Quarantined">Quarantined</option>
          </select>
        </div>

        <select value={filterPurdue} onChange={(e) => setFilterPurdue(e.target.value)} className={selectClass}>
          <option value="all">All Levels</option>
          <option value="Level 0">L0: Process</option>
          <option value="Level 1">L1: Basic Control</option>
          <option value="Level 2">L2: Supervisory</option>
          <option value="Level 3">L3: Operations</option>
          <option value="Level 3.5">L3.5: DMZ</option>
          <option value="Untrusted">External</option>
        </select>

        <span className="text-[11px] text-stone-400 ml-auto font-mono">
          {filteredDevices.length}/{devices.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filteredDevices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-stone-400 bg-white rounded-xl border border-stone-200/60">
            <Server className="w-8 h-8 text-stone-200 mb-3" />
            <p className="text-[12px] font-medium text-stone-500">No devices match your filters</p>
            <p className="text-[11px] text-stone-400 mt-1">Use the Network Lab palette to deploy virtual nodes</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200/60 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  {['Device', 'Type', 'IP Address', 'Level', 'Role', 'Trust', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-[10px] font-semibold text-stone-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="border-b border-stone-50 hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="text-[12px] font-semibold text-stone-800">{d.name}</div>
                      <div className="text-[9.5px] font-mono text-stone-400 mt-[1px] truncate max-w-[120px]">{d.id}</div>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-stone-600 font-medium">{d.device_type}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[11px] text-stone-800 bg-stone-50 px-1.5 py-[2px] rounded-md border border-stone-100">{d.ip_address}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[9.5px] font-medium px-1.5 py-[2px] rounded-md border ${getPurdueColor(d.purdue_level)}`}>
                        {d.purdue_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-stone-600">{d.role}</td>
                    <td className="py-2.5 px-4">{getTrustBadge(d.trust_status)}</td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => toggleDeviceState(d)}
                        className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9.5px] font-medium border transition-colors ${
                          d.is_enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Power className="w-2.5 h-2.5" />
                        {d.is_enabled ? 'Online' : 'Offline'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {d.public_key_pem && (
                          <button
                            onClick={() => setSelectedKeyDev(d)}
                            className="p-1 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="View Public Key"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleInspectOnCanvas(d)}
                          className="px-2 py-[3px] text-[10.5px] font-medium text-stone-600 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-md border border-stone-200 transition-colors"
                        >
                          Locate
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete ${d.name}?`)) deleteDevice(d.id); }}
                          className="p-1 rounded-md text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Public Key Modal */}
      {selectedKeyDev && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-[12px] font-semibold text-stone-800">RSA-2048 Public Key</h3>
                  <p className="text-[10px] text-stone-400">{selectedKeyDev.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedKeyDev(null)} className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[11px] text-stone-500">
                Cryptographic identity key used by the security engine to verify RSA-PSS digital signatures from this device.
              </p>
              <pre className="p-3 bg-stone-900 text-stone-400 rounded-lg font-mono text-[9.5px] overflow-x-auto leading-relaxed max-h-56">
                {selectedKeyDev.public_key_pem}
              </pre>
            </div>
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedKeyDev(null)}
                className="px-3 py-[6px] bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-[11.5px] font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
