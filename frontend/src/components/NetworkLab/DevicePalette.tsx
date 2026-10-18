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
    label: 'Sensor',
    icon: <Thermometer className="w-3.5 h-3.5 text-amber-500" />,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    defaultPurdue: 'Level 0',
    role: 'Sensor',
    category: 'FIELD DEVICES',
  },
  {
    type: 'PLC',
    label: 'PLC / Controller',
    icon: <Cpu className="w-3.5 h-3.5 text-blue-600" />,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    defaultPurdue: 'Level 1',
    role: 'Controller',
    category: 'FIELD DEVICES',
  },
  {
    type: 'SCADA Server',
    label: 'SCADA Server',
    icon: <HardDrive className="w-3.5 h-3.5 text-purple-600" />,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200/80',
    defaultPurdue: 'Level 2',
    role: 'SCADA',
    category: 'FIELD DEVICES',
  },
  {
    type: 'Operator Workstation',
    label: 'Operator Workstation',
    icon: <Laptop className="w-3.5 h-3.5 text-indigo-600" />,
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    defaultPurdue: 'Level 2',
    role: 'Operator',
    category: 'FIELD DEVICES',
  },

  // Network Devices
  {
    type: 'Industrial Gateway',
    label: 'Industrial Gateway',
    icon: <Network className="w-3.5 h-3.5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    defaultPurdue: 'Level 3',
    role: 'Gateway',
    category: 'NETWORK DEVICES',
  },
  {
    type: 'Ethernet Switch',
    label: 'Ethernet Switch',
    icon: <Layers className="w-3.5 h-3.5 text-blue-600" />,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    defaultPurdue: 'Level 1',
    role: 'Switch',
    category: 'NETWORK DEVICES',
  },
  {
    type: 'Router',
    label: 'Router',
    icon: <RouterIcon className="w-3.5 h-3.5 text-cyan-600" />,
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
    defaultPurdue: 'Level 3',
    role: 'Router',
    category: 'NETWORK DEVICES',
  },

  // Supervisory
  {
    type: 'Monitoring Server',
    label: 'Monitoring Server',
    icon: <Eye className="w-3.5 h-3.5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    defaultPurdue: 'Level 3',
    role: 'Monitor',
    category: 'SUPERVISORY',
  },

  // External
  {
    type: 'Untrusted Device',
    label: 'Untrusted Device',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
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
}

export const DevicePalette: React.FC<DevicePaletteProps> = ({ onAddDevice }) => {
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
    <aside className="w-[245px] bg-slate-50/40 border-r border-slate-200/90 flex flex-col h-full select-none shrink-0 z-10">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-200/80 bg-white flex flex-col shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight">
            Device Palette
          </h2>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-medium">
            {filteredItems.length} types
          </span>
        </div>
        <p className="text-[10.5px] text-slate-400 mt-0.5">
          Drag to canvas or click to add
        </p>

        {/* Clean search bar that cannot collide or collapse */}
        <div className="mt-2.5 flex items-center gap-2 px-2.5 h-8 bg-slate-50 border border-slate-200/90 rounded-lg text-slate-800 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-2xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categorized Device List with Comfortable Spacing */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {CATEGORIES.map((cat) => {
          const items = filteredItems.filter((i) => i.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-2">
              {/* Category Heading with subtle counter */}
              <div className="px-1 flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-[0.12em] uppercase select-none">
                <span>{cat}</span>
                <span className="text-[9.5px] font-mono font-medium text-slate-400/80 bg-slate-200/60 px-1.5 py-0.2 rounded">
                  {items.length}
                </span>
              </div>

              {/* Stylish Card Items with generous breathing room */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onClick={() => onAddDevice(item)}
                    className="group relative flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-300 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-xs"
                    title={`Click or drag to add ${item.label}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}
                      >
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-xs font-semibold text-slate-800 truncate leading-snug group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono leading-none mt-1">
                          {item.defaultPurdue}
                        </span>
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-200/60 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shrink-0 shadow-2xs">
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
