import React from 'react';
import {
  Activity,
  FileCheck2,
  FileText,
  Key,
  LayoutDashboard,
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
    icon: <Shield className="w-4 h-4" />,
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
    icon: <LayoutDashboard className="w-4 h-4" />,
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
    <aside className="w-48 bg-[#131722] border-r border-slate-800 flex flex-col justify-between select-none">
      <div className="py-2.5">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Workspace Modules
        </div>
        <nav className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Industrial Purdue standard banner */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-[10px] text-slate-500">
        <div className="font-semibold text-slate-400">ISA-95 / Purdue Model</div>
        <div className="mt-0.5 text-slate-500">L0-L3 Zone Simulation</div>
      </div>
    </aside>
  );
};
