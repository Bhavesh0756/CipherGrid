import React, { useState } from 'react';
import {
  Activity,
  CheckCircle,
  Filter,
  Key,
  Network,
  Power,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Trash2,
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-hidden">
      {/* Top filter toolbar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search devices by name, IP, type or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterTrust}
              onChange={(e) => setFilterTrust(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            >
              <option value="all">All Trust Levels</option>
              <option value="Trusted">Trusted</option>
              <option value="Untrusted">Untrusted</option>
              <option value="Quarantined">Quarantined</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={filterPurdue}
              onChange={(e) => setFilterPurdue(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            >
              <option value="all">All Purdue Levels</option>
              <option value="Level 0">Level 0: Process</option>
              <option value="Level 1">Level 1: Basic Control</option>
              <option value="Level 2">Level 2: Supervisory Control</option>
              <option value="Level 3">Level 3: Operations</option>
              <option value="Level 3.5">Level 3.5: DMZ</option>
              <option value="Untrusted">Untrusted External</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Showing {filteredDevices.length} of {devices.length} registered assets
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto p-4">
        {filteredDevices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-md">
            <Server className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium">No industrial devices match the query.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the Network Lab palette to deploy new nodes.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Device Label</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Purdue Model</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Trust State</th>
                  <th className="py-2.5 px-3">Admin State</th>
                  <th className="py-2.5 px-3">Allowed Ops</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{d.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{d.id}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{d.device_type}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{d.ip_address}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        {d.purdue_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{d.role}</td>
                    <td className="py-2.5 px-3">
                      {d.trust_status === 'Trusted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          <span>Trusted</span>
                        </span>
                      ) : d.trust_status === 'Untrusted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Untrusted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                          <span>Quarantine</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => toggleDeviceState(d)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                          d.is_enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to toggle administrative online/offline state"
                      >
                        <Power className="w-3 h-3" />
                        <span>{d.is_enabled ? 'Online' : 'Offline'}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {d.allowed_actions.map((act) => (
                          <span
                            key={act}
                            className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-mono"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.public_key_pem && (
                          <button
                            onClick={() => setSelectedKeyDev(d)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                            title="View Public Key"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleInspectOnCanvas(d)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                        >
                          Locate
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete virtual device ${d.name}?`)) {
                              deleteDevice(d.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Device"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-semibold text-slate-800">
                  RSA-2048 Public Key — {selectedKeyDev.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedKeyDev(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-2 text-xs">
              <p className="text-slate-600 text-[11px]">
                Cryptographically registered identity key used by the security engine to verify RSA-PSS digital signatures.
              </p>
              <pre className="p-3 bg-slate-900 text-slate-300 rounded font-mono text-[10px] overflow-x-auto leading-relaxed max-h-60">
                {selectedKeyDev.public_key_pem}
              </pre>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedKeyDev(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium"
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
