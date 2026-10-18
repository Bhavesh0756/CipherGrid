import React, { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Play,
  Save,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export const Topbar: React.FC = () => {
  const {
    saveTopology,
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
      default: return 'Network Lab';
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
      default: return 'Interactive Industrial Topology';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between text-slate-700 select-none z-20 shrink-0">
      {/* Left: Section Context Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
          <span className="text-[15px] font-bold text-slate-900 tracking-tight">
            {getSectionTitle()}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <span className="text-slate-300 font-light text-sm mx-1">|</span>

        <span className="text-[13px] text-slate-500 font-normal truncate">
          {getSectionSubtitle()}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Online/Offline Status Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                : backendStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span>{backendStatus === 'connected' ? 'Online' : backendStatus === 'checking' ? 'Connecting' : 'Offline'}</span>
        </div>

        {/* Primary Action: Simulate */}
        <button
          onClick={() => setMessageModalOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate</span>
        </button>

        {/* Secondary Action: Save */}
        <button
          onClick={saveTopology}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer"
          title="Save current topology state"
        >
          <Save className="w-3.5 h-3.5 text-slate-600" />
          <span>Save</span>
        </button>

        {/* Notifications Icon */}
        <button
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">1</span>
        </button>

        {/* User Avatar Circle */}
        <div
          className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs select-none cursor-pointer hover:ring-2 hover:ring-blue-500/40 transition-all"
          title="Bhavesh Gambhirrao"
        >
          BG
        </div>
      </div>
    </header>
  );
};
