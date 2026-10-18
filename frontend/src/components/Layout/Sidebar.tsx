import React from 'react';
import {
  FileCheck2,
  LayoutDashboard,
  Network,
  Radio,
  ScrollText,
  Server,
  Settings,
  Shield,
} from 'lucide-react';
import { SectionType, useSimulatorStore } from '../../store/useSimulatorStore';

interface NavItem {
  id: SectionType;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  activeIconColor: string;
  activeBg: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'network-lab',
    label: 'Network Lab',
    icon: <Network className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-network)',
    activeIconColor: 'text-cyan-400',
    activeBg: 'bg-cyan-500/10',
  },
  {
    id: 'device-inventory',
    label: 'Device Inventory',
    icon: <Server className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-devices)',
    activeIconColor: 'text-amber-400',
    activeBg: 'bg-amber-500/10',
  },
  {
    id: 'packet-inspector',
    label: 'Packet Inspector',
    icon: <Radio className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-packets)',
    activeIconColor: 'text-violet-400',
    activeBg: 'bg-violet-500/10',
  },
  {
    id: 'security-center',
    label: 'Security Center',
    icon: <Shield className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-security)',
    activeIconColor: 'text-rose-400',
    activeBg: 'bg-rose-500/10',
  },
  {
    id: 'event-logs',
    label: 'Event Logs',
    icon: <ScrollText className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-events)',
    activeIconColor: 'text-blue-400',
    activeBg: 'bg-blue-500/10',
  },
  {
    id: 'lab-reports',
    label: 'Lab Reports',
    icon: <FileCheck2 className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-reports)',
    activeIconColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
  },
  {
    id: 'dashboard',
    label: 'Telemetry',
    icon: <LayoutDashboard className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-telemetry)',
    activeIconColor: 'text-indigo-400',
    activeBg: 'bg-indigo-500/10',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-[15px] h-[15px]" />,
    accentColor: 'var(--mod-settings)',
    activeIconColor: 'text-stone-400',
    activeBg: 'bg-stone-500/10',
  },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection } = useSimulatorStore();

  return (
    <aside className="w-[200px] bg-[#1c1917] flex flex-col justify-between select-none">
      <div className="pt-3 pb-2">
        <div className="px-4 pb-3 mb-1">
          <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-[0.08em]">
            Modules
          </div>
        </div>
        <nav className="space-y-0.5 px-2.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`group w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[12.5px] font-medium transition-all duration-150 text-left relative ${
                  isActive
                    ? `${item.activeBg} ${item.activeIconColor}`
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/40'
                }`}
                style={isActive ? { borderLeft: `2px solid ${item.accentColor}`, paddingLeft: '8px' } : {}}
              >
                <span className={`transition-colors ${isActive ? item.activeIconColor : 'text-stone-600 group-hover:text-stone-400'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer — compact Purdue ref */}
      <div className="p-3 border-t border-stone-800/60">
        <div className="text-[10px] text-stone-600 font-medium">ISA-95 / Purdue Model</div>
        <div className="text-[10px] text-stone-700 mt-0.5">L0–L3 Zone Simulation</div>
      </div>
    </aside>
  );
};
