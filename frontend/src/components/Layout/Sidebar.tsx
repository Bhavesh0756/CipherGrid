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

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'SIMULATION LAB',
    items: [
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
    ],
  },
  {
    title: 'SECURITY & AUDIT',
    items: [
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
    ],
  },
  {
    title: 'PLATFORM',
    items: [
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
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection } = useSimulatorStore();

  return (
    <aside className="w-[240px] bg-[#0c1322] border-r border-slate-800/80 flex flex-col h-full select-none shrink-0 z-20">
      {/* ─── Top Brand Logo & Header ─── */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-slate-800/80 shrink-0 bg-[#0a0f1d]/60">
        <div className="w-8 h-8 rounded-lg bg-blue-600/90 border border-blue-400/30 flex items-center justify-center text-white shadow-xs shrink-0">
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

      {/* ─── Middle Navigation: Vertically Distributed Sections ─── */}
      <nav className="flex-1 flex flex-col justify-between px-3 py-5 overflow-y-auto min-h-0">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {/* Category Header */}
            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider px-2.5 pb-1">
              {section.title}
            </div>

            {/* Navigation Items in Category */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left cursor-pointer focus:outline-none ${
                      isActive
                        ? 'bg-blue-600/15 text-white font-semibold border border-blue-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-blue-500" />
                    )}

                    <span
                      className={`transition-colors shrink-0 ${
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Bottom Grounded Product Footer ─── */}
      <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#090e1a]/90">
        <div className="bg-slate-900/60 border border-slate-800/70 rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-semibold text-slate-200 leading-tight truncate">
                ICS Simulator
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                v1.0.0
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
