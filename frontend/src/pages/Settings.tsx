import React, { useState } from 'react';
import {
  Clock,
  Cpu,
  Database,
  Info,
  Key,
  Lock,
  RotateCcw,
  Settings as SettingsIcon,
  Shield,
  Zap,
} from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';

export const Settings: React.FC = () => {
  const {
    playbackSpeed,
    setPlaybackSpeed,
    resetTopology,
    isLoading,
  } = useSimulatorStore();

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetTopology = async () => {
    if (window.confirm('Restore the default industrial starter topology? Custom node positions and additions will reset.')) {
      await resetTopology();
      setResetMessage('Topology restored to standard factory starter configuration.');
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="bg-[#0d1424] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-3 bg-[#080d1a]/80">
        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-bold text-white uppercase tracking-wider font-display">{title}</span>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );

  const CRYPTO_SPECS = [
    { label: 'Symmetric Encryption', value: 'AES-256-GCM AEAD', detail: '96-bit nonce · 128-bit MAC auth tag', color: 'text-amber-400' },
    { label: 'Digital Signatures', value: 'RSA-PSS 2048-bit', detail: 'SHA-256 digest · MGF1 mask generation', color: 'text-purple-400' },
    { label: 'Integrity Digest', value: 'SHA-256 Digest', detail: 'Deterministic canonical serialization', color: 'text-blue-400' },
    { label: 'Access Control', value: 'Industrial RBAC + Purdue', detail: 'Role policy & SQLite replay prevention', color: 'text-emerald-400' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto select-text bg-[#070b14]">
      {/* Header */}
      <div className="px-6 pt-5 pb-5 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
            <SettingsIcon className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                SIMULATION PLATFORM SETTINGS
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                CONFIG V1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Playback clock speed, cryptographic security specifications & factory topology restore
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-3xl space-y-5">
          {resetMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono">
              {resetMessage}
            </div>
          )}

          {/* Playback Speed */}
          <SectionCard icon={<Clock className="w-4 h-4 text-blue-400" />} title="Hop Playback Clock Speed">
            <p className="text-xs text-slate-400 leading-relaxed mb-4 font-mono">
              Controls hop-by-hop packet traversal animation speed across the React Flow topology canvas.
            </p>
            <div className="flex items-center gap-2.5">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-medium border transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {spd}× Speed
                </button>
              ))}
            </div>
            <p className="text-[10.5px] text-slate-500 font-mono mt-3">
              Active Multiplier: <span className="text-blue-400 font-semibold">{playbackSpeed}× Clock Rate</span>
            </p>
          </SectionCard>

          {/* Cryptographic Primitives */}
          <SectionCard icon={<Lock className="w-4 h-4 text-purple-400" />} title="Cryptographic Engine Specifications">
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Live mathematical cryptography library primitives executed for every industrial packet:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              {CRYPTO_SPECS.map((spec) => (
                <div key={spec.label} className="p-3.5 bg-[#060913] rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{spec.label}</div>
                  <div className={`text-xs font-bold ${spec.color}`}>{spec.value}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{spec.detail}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Topology Reset */}
          <SectionCard icon={<Database className="w-4 h-4 text-amber-400" />} title="Factory Starter Topology Reset">
            <p className="text-xs text-slate-400 leading-relaxed mb-3 font-mono">
              Restore the standard validated OT baseline architecture:
            </p>
            <p className="text-xs font-mono text-slate-300 bg-[#060913] p-3 rounded-xl border border-slate-800 mb-4 leading-relaxed">
              Sensor-01 ➔ PLC-01 ➔ OT-Switch-01 ➔ SCADA-Server
              <br />
              + Operator-01 + Monitoring-Server + Rogue-Probe
            </p>
            <button
              onClick={handleResetTopology}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-mono font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Resetting…' : 'Restore Factory Baseline Topology'}</span>
            </button>
          </SectionCard>

          {/* Educational Note */}
          <div className="bg-[#080d1a] border border-slate-800 rounded-2xl p-4.5 flex gap-3.5 shadow-xl">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white mb-1 font-display uppercase tracking-wider">
                Industrial Simulation Sandbox Statement
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                This simulator is designed for cybersecurity education and OT engineering research. All devices, network conduits, MAC addresses, and packet streams run inside a secure virtual software model and do not expose operational control signals to physical machinery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
