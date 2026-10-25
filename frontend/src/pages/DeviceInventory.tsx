import React, { useState } from 'react';
/**
 * DeviceInventory Component
 * Manages industrial field hardware asset tracking, IP allocation, Purdue level assignment, and operational statuses.
 */
import {
  Box,
  Check,
  CheckCircle,
  Copy,
  Filter,
  Key,
  Locate,
  Network,
  Power,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { Device, TrustStatus } from '../types';
import {
  computeKeyFingerprint,
  formatColonFingerprint,
  getShortFingerprint,
  extractUniqueModulusExcerpt,
} from '../utils/cryptoUtils';
import { Device3DModal } from '../components/ThreeD/Device3DModal';

export const DeviceInventory: React.FC = () => {
  const { devices, updateDevice, deleteDevice, setSelectedDevice, setActiveSection, fetchTopology } =
    useSimulatorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrust, setFilterTrust] = useState<string>('all');
  const [filterPurdue, setFilterPurdue] = useState<string>('all');
  const [selectedKeyDev, setSelectedKeyDev] = useState<Device | null>(null);
  const [copiedType, setCopiedType] = useState<'pem' | 'fingerprint' | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [digitalTwinDev, setDigitalTwinDev] = useState<Device | null>(null);

  const copyToClipboard = (text: string, type: 'pem' | 'fingerprint') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

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

  const selectClass = "px-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400";

  const getTrustBadge = (trust: TrustStatus) => {
    switch (trust) {
      case 'Trusted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-2.5 h-2.5" /> TRUSTED
          </span>
        );
      case 'Untrusted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-2.5 h-2.5" /> UNTRUSTED
          </span>
        );
      case 'Quarantined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            QUARANTINED
          </span>
        );
    }
  };

  const getPurdueColor = (level: string) => {
    switch (level) {
      case 'Level 0': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Level 1': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Level 2': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Level 3':
      case 'Level 3.5': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const levelCounts = ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Untrusted'].map((l) => ({
    level: l,
    count: devices.filter(
      (d) => d.purdue_level === l || (l === 'Level 3' && (d.purdue_level === 'Level 3' || d.purdue_level === 'Level 3.5'))
    ).length,
  }));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  PURDUE MODEL ASSET DIRECTORY
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {devices.length} HARDWARE ASSETS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Cryptographic keystore, hardware MAC addressing, administrative online state & zone segregation
              </p>
            </div>
          </div>

          {/* Level Summary Badges */}
          <div className="flex items-center gap-2">
            {levelCounts.filter((l) => l.count > 0).map((l) => (
              <span key={l.level} className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${getPurdueColor(l.level)}`}>
                {l.level === 'Untrusted' ? 'External' : l.level}: {l.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 bg-[#080d1a]/60 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-[9px]" />
          <input
            type="text"
            placeholder="Search by device name, IP, type or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select value={filterTrust} onChange={(e) => setFilterTrust(e.target.value)} className={selectClass}>
            <option value="all">All Trust Tiers</option>
            <option value="Trusted">Trusted</option>
            <option value="Untrusted">Untrusted</option>
            <option value="Quarantined">Quarantined</option>
          </select>
        </div>

        <select value={filterPurdue} onChange={(e) => setFilterPurdue(e.target.value)} className={selectClass}>
          <option value="all">All Purdue Zones</option>
          <option value="Level 0">L0: Field / Process</option>
          <option value="Level 1">L1: Basic Control</option>
          <option value="Level 2">L2: Supervisory SCADA</option>
          <option value="Level 3">L3: Site Operations</option>
          <option value="Level 3.5">L3.5: Industrial DMZ</option>
          <option value="Untrusted">External Untrusted</option>
        </select>

        <span className="text-xs text-amber-400 ml-auto font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          {filteredDevices.length} / {devices.length} Nodes Filtered
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {filteredDevices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-[#0d1424] rounded-2xl border border-slate-800 font-mono">
            <Server className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-xs font-bold text-slate-300">NO INDUSTRIAL ASSETS MATCH FILTER</p>
            <p className="text-[11px] text-slate-500 mt-1">Use the Network Lab palette to deploy new virtual nodes</p>
          </div>
        ) : (
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#080d1a] text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {['Device Name', 'Chassis Type', 'IP Address', 'Purdue Zone', 'Key Fingerprint (SHA-256)', 'RBAC Role', 'Trust Tier', 'Admin Link', 'Actions'].map((h) => (
                    <th key={h} className="py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-xs font-bold text-white font-display">{d.name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">{d.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.device_type}</td>
                    <td className="py-3 px-4">
                      <span className="text-cyan-300 font-bold bg-[#060913] px-2 py-1 rounded border border-slate-800">
                        {d.ip_address}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPurdueColor(d.purdue_level)}`}>
                        {d.purdue_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {d.public_key_pem ? (
                        <button
                          onClick={() => setSelectedKeyDev(d)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#060913] hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 text-amber-300 font-mono text-[10px] transition-all cursor-pointer group shadow-sm"
                          title="Click to inspect unique RSA-2048 identity key & cryptographic verification"
                        >
                          <Key className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="text-slate-500 font-bold">SHA256:</span>
                          <span className="text-cyan-300 font-mono font-bold group-hover:text-amber-200">
                            {getShortFingerprint(d.public_key_pem, d.key_fingerprint)}
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-600 italic text-[10px]">Not Provisioned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{d.role}</td>
                    <td className="py-3 px-4">{getTrustBadge(d.trust_status)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleDeviceState(d)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          d.is_enabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{d.is_enabled ? 'ONLINE' : 'OFFLINE'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {d.public_key_pem && (
                          <button
                            onClick={() => setSelectedKeyDev(d)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Inspect RSA-2048 Public Key"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDigitalTwinDev(d)}
                          className="px-2 py-1 text-[10.5px] font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1"
                          title="Inspect 3D Digital Twin Simulation"
                        >
                          <Box className="w-3 h-3 text-purple-400" />
                          <span>3D</span>
                        </button>
                        <button
                          onClick={() => handleInspectOnCanvas(d)}
                          className="px-2.5 py-1 text-[10.5px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Locate className="w-3 h-3" />
                          <span>Locate</span>
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete virtual device ${d.name}?`)) deleteDevice(d.id); }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete device"
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
      {selectedKeyDev && (() => {
        const devFp = selectedKeyDev.key_fingerprint || computeKeyFingerprint(selectedKeyDev.public_key_pem);
        const formattedFp = formatColonFingerprint(devFp);
        const modulusExcerpt = extractUniqueModulusExcerpt(selectedKeyDev.public_key_pem);

        return (
          <div className="fixed inset-0 z-50 bg-[#060913]/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0b101f] rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden font-mono animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080d1a]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white font-display tracking-wide">
                        RSA-2048 CRYPTOGRAPHIC IDENTITY KEY
                      </h3>
                      <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        VERIFIED UNIQUE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {selectedKeyDev.name} &bull; <span className="text-cyan-300 font-bold">{selectedKeyDev.ip_address}</span> &bull; <span className="text-amber-400 font-bold">{selectedKeyDev.purdue_level}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKeyDev(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Unique Cryptographic Fingerprint */}
                <div className="p-3.5 bg-[#060913] rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Cryptographic Key Fingerprint (SHA-256)</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(devFp, 'fingerprint')}
                      className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30 transition-all"
                    >
                      {copiedType === 'fingerprint' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Fingerprint</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-cyan-300 text-[11px] font-bold tracking-wider break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {formattedFp || 'N/A'}
                  </div>
                </div>

                {/* Key Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Algorithm</span>
                    <span className="text-xs text-white font-bold mt-0.5 block">RSA-2048</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Padding / Scheme</span>
                    <span className="text-xs text-amber-400 font-bold mt-0.5 block">RSA-PSS (SHA-256)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Public Exponent</span>
                    <span className="text-xs text-white font-bold mt-0.5 block">65537 (0x10001)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Trust Tier</span>
                    <span className="text-xs text-emerald-400 font-bold mt-0.5 block">{selectedKeyDev.trust_status}</span>
                  </div>
                </div>

                {/* Unique Modulus Excerpt */}
                {modulusExcerpt && (
                  <div className="p-3 bg-[#060913] rounded-xl border border-slate-800 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-bold">
                      <span>Distinct 2048-Bit Modulus Excerpt (First 32 bytes):</span>
                      <span className="text-[9px] text-amber-400 font-normal">Differs per device</span>
                    </div>
                    <div className="font-mono text-amber-300 text-[10.5px] font-bold break-all bg-slate-900/50 p-2 rounded border border-slate-800/80">
                      {modulusExcerpt}...
                    </div>
                  </div>
                )}


                {/* Raw PEM Keystore Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-bold uppercase tracking-wider">Raw SubjectPublicKeyInfo PEM Keystore:</span>
                    <button
                      onClick={() => copyToClipboard(selectedKeyDev.public_key_pem || '', 'pem')}
                      className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      {copiedType === 'pem' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied PEM!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy PEM</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#060913] text-amber-300/90 rounded-xl font-mono text-[9px] overflow-x-auto leading-relaxed border border-slate-800 max-h-44 selection:bg-amber-500/30 selection:text-white">
                    {selectedKeyDev.public_key_pem}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-[#080d1a] border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Stored in SQLite Keyring &bull; Used for RSA-PSS signature verification
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsRotating(true);
                      try {
                        const res = await api.rotateDeviceKeys(selectedKeyDev.id);
                        await fetchTopology();
                        if (res.public_key_pem) {
                          setSelectedKeyDev({
                            ...selectedKeyDev,
                            public_key_pem: res.public_key_pem,
                            key_fingerprint: res.fingerprint,
                          });
                        }
                      } catch {
                        // ignore
                      } finally {
                        setIsRotating(false);
                      }
                    }}
                    disabled={isRotating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                    <span>{isRotating ? 'Generating RSA-2048…' : 'Rotate Keypair'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedKeyDev(null)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Device 3D Digital Twin Modal */}
      {digitalTwinDev && (
        <Device3DModal
          device={digitalTwinDev}
          onClose={() => setDigitalTwinDev(null)}
        />
      )}
    </div>
  );
};
