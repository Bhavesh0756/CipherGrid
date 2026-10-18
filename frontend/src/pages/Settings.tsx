import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Database,
  Info,
  Lock,
  RefreshCw,
  RotateCcw,
  Server,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useSimulatorStore } from '../store/useSimulatorStore';

export const Settings: React.FC = () => {
  const {
    playbackSpeed,
    setPlaybackSpeed,
    resetTopology,
    fetchTopology,
    isLoading,
  } = useSimulatorStore();

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetTopology = async () => {
    if (
      window.confirm(
        'Are you sure you want to restore the default industrial starter topology? This will reset the virtual devices and links to the initial state.'
      )
    ) {
      await resetTopology();
      setResetMessage('Topology restored to standard factory starter configuration.');
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-y-auto p-6 select-text">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          Simulator Settings & Engineering Parameters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure simulation engine playback, network baseline latency, and security suite parameters
        </p>
      </div>

      <div className="max-w-3xl space-y-5">
        {resetMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-medium">
            {resetMessage}
          </div>
        )}

        {/* Playback & Presentation Speed */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Simulation Playback & Presentation Speed</span>
          </div>
          <p className="text-xs text-slate-600">
            Adjust the hop-by-hop animation rate during message transmission playback. Note that changing the visualization speed does not alter the underlying deterministic cryptographic and routing calculations.
          </p>

          <div className="flex items-center gap-3 pt-1">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {spd}x Multiplier
              </button>
            ))}
          </div>
        </div>

        {/* Cryptographic Engine Profile */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Cryptographic Profile Specifications</span>
          </div>
          <p className="text-xs text-slate-600">
            Real backend Python Cryptography primitives executed for industrial message protection:
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="font-semibold text-slate-800">Symmetric Encryption</div>
              <div className="font-mono text-blue-700 text-[11px] mt-0.5">AES-256-GCM AEAD</div>
              <div className="text-[10px] text-slate-500 mt-1">96-bit random nonce, 128-bit authentication tag</div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="font-semibold text-slate-800">Digital Signatures</div>
              <div className="font-mono text-blue-700 text-[11px] mt-0.5">RSA-PSS 2048-bit</div>
              <div className="text-[10px] text-slate-500 mt-1">SHA-256 digest, MGF1 padding, salt length = digest</div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="font-semibold text-slate-800">Message Digest / Hash</div>
              <div className="font-mono text-blue-700 text-[11px] mt-0.5">SHA-256 (256-bit)</div>
              <div className="text-[10px] text-slate-500 mt-1">Canonical key-value string serialization</div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="font-semibold text-slate-800">Access Control & Nonce Storage</div>
              <div className="font-mono text-blue-700 text-[11px] mt-0.5">Role-Based Access Control (RBAC)</div>
              <div className="text-[10px] text-slate-500 mt-1">Persistent SQLite replay cache & Purdue model checks</div>
            </div>
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 uppercase tracking-wider">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Database & Topology Reset</span>
          </div>
          <p className="text-xs text-slate-600">
            Restore the network canvas to the standard sample starter topology:
            <br />
            <span className="font-mono text-[11px] text-slate-700">
              Sensor-01 → PLC-01 → Industrial-Switch → SCADA-Server (plus Operator-01 & Monitoring-Server)
            </span>
          </p>

          <button
            onClick={handleResetTopology}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Resetting...' : 'Restore Factory Starter Topology'}</span>
          </button>
        </div>

        {/* Educational Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Educational Simulator Statement</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            This simulator is designed for cybersecurity education and network engineering research. All devices, ports, MAC addresses, and packet streams represent virtual software models running in the local simulation engine. The application does not connect to physical industrial hardware or operational field controllers.
          </p>
        </div>
      </div>
    </div>
  );
};
