import React from 'react';
import {
  Activity,
  FileCheck2,
  Network,
  Radio,
  ScrollText,
  Server,
  Settings,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { SectionType, useSimulatorStore } from '../../store/useSimulatorStore';

interface NavItem {
  id: SectionType;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'network-lab',
    label: 'Network Lab',
    icon: <Network className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'device-inventory',
    label: 'Device Inventory',
    icon: <Server className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'packet-inspector',
    label: 'Packet Inspector',
    icon: <Radio className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'security-center',
    label: 'Security Center',
    icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'event-logs',
    label: 'Event Logs',
    icon: <ScrollText className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'lab-reports',
    label: 'Lab Reports',
    icon: <FileCheck2 className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'dashboard',
    label: 'Telemetry Overview',
    icon: <Activity className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4 shrink-0" />,
  },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection } = useSimulatorStore();

  return (
    <aside className="w-[240px] bg-[#0c1322] border-r border-slate-800/80 flex flex-col h-full select-none shrink-0 z-20">
      {/* ─── Top Brand Logo & Title ─── */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-slate-800/80 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[13.5px] font-bold text-white tracking-tight leading-tight">
            CipherGrid
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            ICS Simulator
          </p>
        </div>
      </div>

      {/* ─── Navigation Items ─── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span
                className={`transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── Compact Functional Footer ─── */}
      <div className="p-3 border-t border-slate-800/80 shrink-0 mt-auto">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold text-slate-200 leading-tight truncate">
              ICS Simulator
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              v1.0.0
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium text-emerald-400">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
