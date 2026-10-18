import React, { useState } from 'react';
import {
  Cpu,
  Eye,
  HardDrive,
  Laptop,
  Layers,
  Network,
  Plus,
  Radio,
  Router as RouterIcon,
  Search,
  ShieldAlert,
  Thermometer,
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
    <div className="w-[225px] bg-white border-r border-slate-200/90 flex flex-col h-full select-none shrink-0 shadow-2xs z-10">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 flex flex-col gap-1.5 shrink-0">
        <h2 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight">
          Device Palette
        </h2>
        <p className="text-[10.5px] text-slate-400">
          Drag devices to the canvas
        </p>

        {/* Search input with clean margins */}
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Categorized Device List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {CATEGORIES.map((cat) => {
          const items = filteredItems.filter((i) => i.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="text-[9.5px] font-bold text-slate-400 tracking-wider px-1 uppercase">
                {cat}
              </div>

              <div className="space-y-0.5">
                {items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onClick={() => onAddDevice(item)}
                    className="group flex items-center justify-between px-2 py-1.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 ${item.iconBg}`}
                      >
                        {item.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11.5px] font-semibold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                          {item.defaultPurdue}
                        </div>
                      </div>
                    </div>

                    <Plus className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
