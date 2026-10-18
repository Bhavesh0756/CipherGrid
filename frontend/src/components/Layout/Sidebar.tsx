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
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col h-full select-none shrink-0 z-20 shadow-xl shadow-black/20">
      {/* ─── Top Brand Header ─── */}
      <div className="h-16 px-4.5 flex items-center gap-3.5 border-b border-slate-800/60 shrink-0 bg-[#070b14]/70">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0">
          <Shield className="w-4.5 h-4.5 text-white stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[14px] font-bold text-slate-100 tracking-tight leading-tight">
            CipherGrid
          </h1>
          <p className="text-[10px] text-blue-400/85 font-mono font-semibold tracking-wider uppercase leading-none mt-1">
            ICS Simulator
          </p>
        </div>
      </div>

      {/* ─── Middle Navigation: Spaciously Distributed & Stylish ─── */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col justify-around min-h-0">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col">
            {/* Category Heading with stylish letter-spacing and tone */}
            <div className="px-3 pb-2.5 text-[10px] font-bold text-slate-400/90 tracking-[0.14em] uppercase select-none">
              {section.title}
            </div>

            {/* Navigation Rows with spacious h-11 height and 8px gap */}
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group relative w-full h-11 flex items-center gap-3.5 px-3.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 ${
                      isActive
                        ? 'bg-blue-600/[0.14] text-white font-semibold border border-blue-500/30 shadow-xs shadow-blue-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 hover:border-slate-700/40 border border-transparent'
                    }`}
                  >
                    {/* Active Left Indicator Bar with subtle luminous glow */}
                    {isActive && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
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
      <div className="p-3.5 border-t border-slate-800/70 shrink-0 bg-[#070b14]/80 mt-auto">
        <div className="bg-[#0e1628]/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-slate-200 leading-tight truncate">
                ICS Simulator
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                v1.0.0
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
