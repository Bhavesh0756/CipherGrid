import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  Database,
  Network,
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
      case 'network-lab':
        return 'Network Lab — Interactive Industrial Topology';
      case 'device-inventory':
        return 'Device Inventory — Purdue Model Asset Directory';
      case 'packet-inspector':
        return 'Packet Inspector — Deep Simulation Event Analysis';
      case 'security-center':
        return 'Security Center — Cryptographic & Access Control Workbench';
      case 'event-logs':
        return 'Event Logs — Persistent System & Audit Records';
      case 'lab-reports':
        return 'Lab Reports — Security Evaluation & Technical Audit';
      case 'dashboard':
        return 'Operational Dashboard — System Telemetry & Statistics';
      case 'settings':
        return 'Simulator Configuration & Security Parameters';
      default:
        return 'Secure ICS Simulator';
    }
  };

  return (
    <header className="h-12 bg-[#131722] border-b border-slate-800 px-4 flex items-center justify-between text-slate-200 select-none z-20">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-semibold text-xs text-white tracking-wide uppercase">
            ICS Simulator
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <span className="text-xs text-slate-400 font-medium truncate max-w-md">
          {getSectionTitle()}
        </span>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2.5">
        {/* Backend health status badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-500'
                : backendStatus === 'checking'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300">
            {backendStatus === 'connected' ? 'Core Online' : backendStatus === 'checking' ? 'Connecting...' : 'Core Offline'}
          </span>
        </div>

        {activeSection === 'network-lab' && (
          <>
            <button
              onClick={() => setMessageModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate</span>
            </button>

            <button
              onClick={saveTopology}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              title="Save current topology state"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
              title="Restore standard sample starter topology"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Starter</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
