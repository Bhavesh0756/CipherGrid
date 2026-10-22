import React from 'react';
import {
  Activity,
  Cpu,
  FileCheck2,
  Lock,
  Network,
  Radio,
  ScrollText,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { SectionType, useSimulatorStore } from '../../store/useSimulatorStore';

interface NavItem {
  id: SectionType;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  accentColor: string;
  badge?: string;
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
        accentColor: '#3b82f6',
        icon: (active) => (
          <Network className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
        ),
      },
      {
        id: 'device-inventory',
        label: 'Device Inventory',
        accentColor: '#f59e0b',
        icon: (active) => (
          <Server className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
        ),
      },
      {
        id: 'packet-inspector',
        label: 'Packet Inspector',
        accentColor: '#a855f7',
        icon: (active) => (
          <Radio className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`} />
        ),
      },
    ],
  },
  {
    title: 'CYBER DEFENSE & AUDIT',
    items: [
      {
        id: 'security-center',
        label: 'Security Center',
        accentColor: '#f43f5e',
        badge: '9 Scenarios',
        icon: (active) => (
          <ShieldAlert className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-400'}`} />
        ),
      },
      {
        id: 'event-logs',
        label: 'Event Logs',
        accentColor: '#38bdf8',
        icon: (active) => (
          <ScrollText className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-400'}`} />
        ),
      },
      {
        id: 'lab-reports',
        label: 'Lab Reports',
        accentColor: '#10b981',
        icon: (active) => (
          <FileCheck2 className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
        ),
      },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      {
        id: 'dashboard',
        label: 'Telemetry Overview',
        accentColor: '#6366f1',
        icon: (active) => (
          <Activity className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
        ),
      },
      {
        id: 'settings',
        label: 'Settings',
        accentColor: '#94a3b8',
        icon: (active) => (
          <Settings className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
        ),
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, devices, isSimulating, triggerIntroAnimation } = useSimulatorStore();

  return (
    <aside className="w-56 bg-[#080d1a] border-r border-slate-800/80 flex flex-col h-full select-none shrink-0 z-20 shadow-xl shadow-black/60">
      {/* ─── Top Brand Header ─── */}
      <div className="h-15 px-3.5 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-[#060913]/90 backdrop-blur-md">
        <div
          onClick={() => triggerIntroAnimation()}
          title="Click to replay Entry Animation"
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
        >
          <div className="relative w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0 shadow-sm transition-all duration-200 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-4 h-4 text-blue-400 stroke-[2.2] transition-transform duration-200 group-hover:scale-110 group-hover:text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="text-[13.5px] font-bold text-white tracking-tight leading-tight font-display group-hover:text-cyan-300 transition-colors">
                CipherGrid
              </h1>
              <span className="px-1 py-0.2 rounded text-[8.5px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-cyan-500/40">
                PRO
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-mono tracking-wider uppercase leading-none mt-0.5 group-hover:text-slate-300">
              SCADA / OT Simulator
            </p>
          </div>
        </div>

        {isSimulating && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[9px] font-mono">
            <Zap className="w-2.5 h-2.5" />
            SIM
          </span>
        )}
      </div>

      {/* ─── Middle Navigation ─── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col justify-around min-h-0 space-y-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col">
            <div className="px-2.5 pb-1.5 text-[9.5px] font-bold text-slate-400 font-mono tracking-[0.16em] uppercase select-none flex items-center justify-between">
              <span>{section.title}</span>
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group relative w-full h-9 flex items-center justify-between px-2.5 rounded-lg text-[12px] font-medium transition-colors duration-150 text-left cursor-pointer focus:outline-none ${
                      isActive
                        ? 'bg-slate-800/80 text-white font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 hover:border-slate-700/50 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-500"
                      />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.icon(isActive)}
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/80 border border-slate-700/60 text-slate-400 group-hover:text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Bottom Grounded Product Footer & Telemetry Widget ─── */}
      <div className="p-2.5 border-t border-slate-800/80 shrink-0 bg-[#060913]/90 backdrop-blur-md mt-auto">
        <div className="bg-[#0e1628]/95 border border-slate-700/50 rounded-xl p-2.5 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10.5px] font-semibold text-slate-200 font-display">SIM ENGINE</span>
            </div>
            <span className="text-[9px] font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">
              AES-256-GCM
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
            <div>
              <div className="text-slate-400 text-[8.5px] uppercase">Topology</div>
              <div className="text-slate-200 font-semibold">{devices.length} Nodes</div>
            </div>
            <div>
              <div className="text-slate-400 text-[8.5px] uppercase">Engine</div>
              <div className="text-emerald-400 font-semibold">Active</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
