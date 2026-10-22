import React, { useState } from 'react';
import {
  Cpu,
  Eye,
  HardDrive,
  Laptop,
  Layers,
  Network,
  Plus,
  Router as RouterIcon,
  Search,
  ShieldAlert,
  Thermometer,
  X,
} from 'lucide-react';
import { DeviceType, PurdueLevel } from '../../types';

export interface PaletteItem {
  type: DeviceType;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  defaultPurdue: PurdueLevel;
  role: string;
  category: 'FIELD DEVICES' | 'NETWORK DEVICES' | 'SUPERVISORY' | 'EXTERNAL';
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Field Devices
  {
    type: 'Sensor',
    label: 'Telemetry Sensor',
    icon: <Thermometer className="w-3.5 h-3.5 text-slate-300" />,
    iconBg: 'bg-[#161B26] text-slate-300 border-[#222B3C]',
    defaultPurdue: 'Level 0',
    role: 'Sensor',
    category: 'FIELD DEVICES',
  },
  {
    type: 'PLC',
    label: 'Industrial PLC',
    icon: <Cpu className="w-3.5 h-3.5 text-blue-400" />,
    iconBg: 'bg-[#161B26] text-blue-400 border-[#222B3C]',
    defaultPurdue: 'Level 1',
    role: 'Controller',
    category: 'FIELD DEVICES',
  },
  {
    type: 'SCADA Server',
    label: 'SCADA Server',
    icon: <HardDrive className="w-3.5 h-3.5 text-blue-400" />,
    iconBg: 'bg-[#161B26] text-blue-400 border-[#222B3C]',
    defaultPurdue: 'Level 2',
    role: 'SCADA',
    category: 'FIELD DEVICES',
  },
  {
    type: 'Operator Workstation',
    label: 'HMI Workstation',
    icon: <Laptop className="w-3.5 h-3.5 text-slate-300" />,
    iconBg: 'bg-[#161B26] text-slate-300 border-[#222B3C]',
    defaultPurdue: 'Level 2',
    role: 'Operator',
    category: 'FIELD DEVICES',
  },

  // Network Devices
  {
    type: 'Industrial Gateway',
    label: 'Secured Gateway',
    icon: <Network className="w-3.5 h-3.5 text-blue-400" />,
    iconBg: 'bg-[#161B26] text-blue-400 border-[#222B3C]',
    defaultPurdue: 'Level 3',
    role: 'Gateway',
    category: 'NETWORK DEVICES',
  },
  {
    type: 'Ethernet Switch',
    label: 'OT Core Switch',
    icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
    iconBg: 'bg-[#161B26] text-blue-400 border-[#222B3C]',
    defaultPurdue: 'Level 1',
    role: 'Switch',
    category: 'NETWORK DEVICES',
  },
  {
    type: 'Router',
    label: 'Industrial Router',
    icon: <RouterIcon className="w-3.5 h-3.5 text-blue-400" />,
    iconBg: 'bg-[#161B26] text-blue-400 border-[#222B3C]',
    defaultPurdue: 'Level 3',
    role: 'Router',
    category: 'NETWORK DEVICES',
  },

  // Supervisory
  {
    type: 'Monitoring Server',
    label: 'Audit SIEM Server',
    icon: <Eye className="w-3.5 h-3.5 text-emerald-400" />,
    iconBg: 'bg-[#161B26] text-emerald-400 border-[#222B3C]',
    defaultPurdue: 'Level 3',
    role: 'Monitor',
    category: 'SUPERVISORY',
  },

  // External
  {
    type: 'Untrusted Device',
    label: 'Rogue Probe (MITM)',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
    iconBg: 'bg-[#161B26] text-rose-400 border-[#222B3C]',
    defaultPurdue: 'Untrusted',
    role: 'Untrusted',
    category: 'EXTERNAL',
  },
];

const CATEGORIES: ('FIELD DEVICES' | 'NETWORK DEVICES' | 'SUPERVISORY' | 'EXTERNAL')[] = [
  'FIELD DEVICES',
  'NETWORK DEVICES',
  'SUPERVISORY',
  'EXTERNAL',
];

interface DevicePaletteProps {
  onAddDevice: (item: PaletteItem) => void;
  onClose?: () => void;
}

export const DevicePalette: React.FC<DevicePaletteProps> = ({ onAddDevice, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow-type', item.type);
    event.dataTransfer.setData('application/palette-item', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.defaultPurdue.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="w-[245px] bg-[#0D1017] border-r border-[#1E2430] flex flex-col h-full select-none shrink-0 z-10 shadow-2xl">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-[#1E2430] bg-[#090A0F] flex flex-col shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-white tracking-tight leading-tight font-display">
              Device Palette
            </h2>
            <span className="text-[10px] font-mono text-slate-300 bg-[#161B26] border border-[#222B3C] px-1.5 py-0.5 rounded-md font-medium">
              {filteredItems.length}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#161B26] transition-colors cursor-pointer"
              title="Close Device Palette"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[10.5px] text-slate-400 mt-0.5">
          Drag to canvas or click to add
        </p>


        {/* Cyber Search Bar */}
        <div className="mt-2.5 flex items-center gap-2 px-2.5 h-8 bg-[#141824] border border-[#1E2430] rounded-lg text-slate-200 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categorized Device List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORIES.map((cat) => {
          const items = filteredItems.filter((i) => i.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-1.5">
              <div className="px-1 flex items-center justify-between text-[9.5px] font-mono font-bold text-slate-400 tracking-[0.14em] uppercase select-none">
                <span>{cat}</span>
                <span className="text-[9px] font-mono text-slate-400 bg-[#161B26] px-1.5 py-0.2 rounded border border-[#222B3C]">
                  {items.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onClick={() => onAddDevice(item)}
                    className="group relative flex items-center justify-between p-2 rounded-xl bg-[#10131A] hover:bg-[#141824] border border-[#1E2430] hover:border-slate-600/70 transition-colors duration-150 cursor-grab active:cursor-grabbing shadow-sm"
                    title={`Click or drag to add ${item.label}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-inner shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}
                      >
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-xs font-medium text-slate-200 truncate leading-snug group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono leading-none mt-0.5">
                          {item.defaultPurdue}
                        </span>
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shrink-0">
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
