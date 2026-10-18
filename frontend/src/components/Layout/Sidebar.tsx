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
    icon: <Network className="w-4 h-4" />,
  },
  {
    id: 'device-inventory',
    label: 'Device Inventory',
    icon: <Server className="w-4 h-4" />,
  },
  {
    id: 'packet-inspector',
    label: 'Packet Inspector',
    icon: <Radio className="w-4 h-4" />,
  },
  {
    id: 'security-center',
    label: 'Security Center',
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    id: 'event-logs',
    label: 'Event Logs',
    icon: <ScrollText className="w-4 h-4" />,
  },
  {
    id: 'lab-reports',
    label: 'Lab Reports',
    icon: <FileCheck2 className="w-4 h-4" />,
  },
  {
    id: 'dashboard',
    label: 'Telemetry Overview',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection } = useSimulatorStore();

  return (
    <aside className="w-60 bg-[#0c1322] border-r border-slate-900 flex flex-col justify-between select-none h-screen shrink-0 relative overflow-hidden">
      {/* Top Brand Logo Area */}
      <div>
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/40 relative">
            {/* Hexagonal shield logo icon */}
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight">
              CipherGrid
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              ICS Simulator
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-left relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
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
      </div>

      {/* Industrial Plant Silhouette Illustration & Footer */}
      <div className="relative pt-6 pb-4 px-3.5 mt-auto">
        {/* Subtle plant SVG skyline */}
        <div className="absolute inset-x-0 bottom-16 pointer-events-none opacity-20 overflow-hidden h-28 flex items-end">
          <svg
            viewBox="0 0 240 100"
            className="w-full text-blue-300 fill-current"
            preserveAspectRatio="none"
          >
            <path d="M0,100 L0,70 L20,70 L20,50 L25,50 L25,70 L40,70 L40,30 L45,30 L45,70 L60,70 L60,85 L80,85 L80,45 L85,45 L85,85 L110,85 L110,20 L115,20 L115,85 L130,85 L140,65 L150,65 L160,85 L180,85 L180,40 L185,40 L185,85 L200,85 L200,60 L205,60 L205,85 L240,85 L240,100 Z" />
          </svg>
        </div>

        {/* Footer Card */}
        <div className="relative bg-[#111c33] border border-blue-950/80 rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-900/50 border border-blue-700/40 flex items-center justify-center text-blue-300">
              <Network className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-semibold text-white leading-tight truncate">
                ICS Simulator
              </div>
              <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                v1.0.0
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
