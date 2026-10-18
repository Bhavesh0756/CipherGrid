import React, { useState } from 'react';
import {
  Clock,
  Database,
  Info,
  Lock,
  RotateCcw,
  Settings as SettingsIcon,
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
    if (window.confirm('Restore the default industrial starter topology? Unsaved edits will be cleared.')) {
      await resetTopology();
      setResetMessage('Topology restored to standard factory starter configuration.');
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-stone-200/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[12px] font-semibold text-stone-700">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );

  const CRYPTO_SPECS = [
    { label: 'Symmetric Encryption', value: 'AES-256-GCM AEAD', detail: '96-bit nonce · 128-bit auth tag' },
    { label: 'Digital Signatures', value: 'RSA-PSS 2048-bit', detail: 'SHA-256 digest · MGF1 padding' },
    { label: 'Message Digest', value: 'SHA-256', detail: 'Canonical key-value serialization' },
    { label: 'Access Control', value: 'RBAC + Purdue Zones', detail: 'SQLite replay cache · nonce dedup' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto select-text" style={{ background: '#fafaf9' }}>
      {/* Module header */}
      <div className="px-6 pt-5 pb-5 border-b border-stone-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-stone-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Settings</h1>
            <p className="text-[11px] text-stone-400 mt-0.5">Simulation engine configuration & security parameters</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-2xl space-y-4">
          {resetMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 text-emerald-700 rounded-xl text-[11.5px] font-medium">
              {resetMessage}
            </div>
          )}

          {/* Playback speed */}
          <SectionCard icon={<Clock className="w-3.5 h-3.5 text-stone-500" />} title="Simulation Playback Speed">
            <p className="text-[11.5px] text-stone-500 leading-relaxed mb-4">
              Adjust the hop-by-hop animation rate. Speed changes do not alter the underlying deterministic cryptographic calculations.
            </p>
            <div className="flex items-center gap-2">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-4 py-2 rounded-lg text-[12px] font-mono font-medium border transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 mt-3">
              Current: <span className="font-mono text-stone-600 font-medium">{playbackSpeed}× multiplier</span>
            </p>
          </SectionCard>

          {/* Crypto specs */}
          <SectionCard icon={<Lock className="w-3.5 h-3.5 text-stone-500" />} title="Cryptographic Suite Specifications">
            <p className="text-[11.5px] text-stone-500 mb-4">
              Real Python Cryptography library primitives executed for every industrial message:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CRYPTO_SPECS.map((spec) => (
                <div key={spec.label} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="text-[10.5px] font-medium text-stone-500 mb-0.5">{spec.label}</div>
                  <div className="text-[11px] font-mono font-semibold text-stone-800">{spec.value}</div>
                  <div className="text-[9.5px] text-stone-400 mt-0.5">{spec.detail}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Database reset */}
          <SectionCard icon={<Database className="w-3.5 h-3.5 text-stone-500" />} title="Topology Reset">
            <p className="text-[11.5px] text-stone-500 leading-relaxed mb-2">
              Restore the standard starter topology:
            </p>
            <p className="text-[11px] font-mono text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100 mb-4">
              Sensor-01 → PLC-01 → Industrial-Switch → SCADA-Server
              <br />
              + Operator-01 + Monitoring-Server
            </p>
            <button
              onClick={handleResetTopology}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-[11.5px] font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isLoading ? 'Resetting…' : 'Restore Factory Topology'}
            </button>
          </SectionCard>

          {/* Educational note */}
          <div className="bg-stone-50/60 border border-stone-200/60 rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11.5px] font-semibold text-stone-600 mb-1">Educational Simulator Statement</div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                This simulator is designed for cybersecurity education and network engineering research. All devices, ports, MAC addresses, and packet streams are virtual software models. It does not connect to physical industrial hardware or operational field controllers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
