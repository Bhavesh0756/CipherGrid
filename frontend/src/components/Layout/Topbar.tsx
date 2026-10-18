import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export const Topbar: React.FC = () => {
  const {
    saveTopology,
    resetTopology,
    isLoading,
    setMessageModalOpen,
    activeSection,
  } = useSimulatorStore();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setBackendStatus('connected');
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (window.confirm('Reset network topology to standard industrial starter configuration? Any unsaved edits will be cleared.')) {
      await resetTopology();
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'network-lab': return 'Network Lab';
      case 'device-inventory': return 'Device Inventory';
      case 'packet-inspector': return 'Packet Inspector';
      case 'security-center': return 'Security Center';
      case 'event-logs': return 'Event Logs';
      case 'lab-reports': return 'Lab Reports';
      case 'dashboard': return 'Telemetry Overview';
      case 'settings': return 'Settings';
      default: return 'ICS Simulator';
    }
  };

  const getSectionSubtitle = () => {
    switch (activeSection) {
      case 'network-lab': return 'Interactive Industrial Topology';
      case 'device-inventory': return 'Purdue Model Asset Directory';
      case 'packet-inspector': return 'Deep Simulation Event Analysis';
      case 'security-center': return 'Cryptographic & Access Control Workbench';
      case 'event-logs': return 'Persistent System & Audit Records';
      case 'lab-reports': return 'Security Evaluation & Technical Audit';
      case 'dashboard': return 'System Telemetry & Statistics';
      case 'settings': return 'Configuration & Security Parameters';
      default: return '';
    }
  };

  return (
    <header className="h-11 bg-[#1c1917] px-4 flex items-center justify-between text-stone-300 select-none z-20 shrink-0">
      {/* Left: Brand + Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-md bg-cyan-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-[11.5px] text-stone-200 tracking-wide">
            CipherGrid
          </span>
        </div>

        <div className="h-3.5 w-px bg-stone-700/60" />

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-medium text-stone-300 truncate">
            {getSectionTitle()}
          </span>
          <span className="text-[11px] text-stone-600 truncate hidden lg:inline">
            — {getSectionSubtitle()}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Backend health */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-800/50 text-[10.5px] font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-400'
                : backendStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-400'
            }`}
          />
          <span className="text-stone-400">
            {backendStatus === 'connected' ? 'Online' : backendStatus === 'checking' ? 'Connecting' : 'Offline'}
          </span>
        </div>

        {activeSection === 'network-lab' && (
          <>
            <button
              onClick={() => setMessageModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-[5px] bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[11.5px] font-medium transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Simulate</span>
            </button>

            <button
              onClick={saveTopology}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-[5px] bg-stone-800 hover:bg-stone-700 border border-stone-700/60 text-stone-300 rounded-md text-[11.5px] font-medium transition-colors"
              title="Save current topology state"
            >
              <Save className="w-3 h-3" />
              <span>Save</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-[5px] bg-stone-800 hover:bg-stone-700 border border-stone-700/60 text-stone-400 rounded-md text-[11.5px] font-medium transition-colors"
              title="Restore standard sample starter topology"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
