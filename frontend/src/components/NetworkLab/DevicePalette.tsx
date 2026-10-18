import React from 'react';
import {
  Cpu,
  Eye,
  HardDrive,
  Laptop,
  Layers,
  Network,
  Plus,
  Router as RouterIcon,
  ShieldAlert,
  Thermometer,
} from 'lucide-react';
import { DeviceType, PurdueLevel } from '../../types';

interface PaletteItem {
  type: DeviceType;
  label: string;
  icon: React.ReactNode;
  defaultPurdue: PurdueLevel;
  role: string;
  category: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'Sensor', label: 'Sensor', icon: <Thermometer className="w-3.5 h-3.5 text-amber-600" />, defaultPurdue: 'Level 0', role: 'Sensor', category: 'Field Devices' },
  { type: 'PLC', label: 'PLC / Controller', icon: <Cpu className="w-3.5 h-3.5 text-blue-600" />, defaultPurdue: 'Level 1', role: 'Controller', category: 'Field Devices' },
  { type: 'Ethernet Switch', label: 'Ethernet Switch', icon: <Layers className="w-3.5 h-3.5 text-slate-600" />, defaultPurdue: 'Level 1', role: 'Switch', category: 'Network' },
  { type: 'Router', label: 'Router', icon: <RouterIcon className="w-3.5 h-3.5 text-cyan-700" />, defaultPurdue: 'Level 3', role: 'Router', category: 'Network' },
  { type: 'Industrial Gateway', label: 'Industrial Gateway', icon: <Network className="w-3.5 h-3.5 text-teal-600" />, defaultPurdue: 'Level 3', role: 'Gateway', category: 'Network' },
  { type: 'SCADA Server', label: 'SCADA Server', icon: <HardDrive className="w-3.5 h-3.5 text-indigo-600" />, defaultPurdue: 'Level 2', role: 'SCADA', category: 'Supervisory' },
  { type: 'Operator Workstation', label: 'Operator Workstation', icon: <Laptop className="w-3.5 h-3.5 text-stone-700" />, defaultPurdue: 'Level 2', role: 'Operator', category: 'Supervisory' },
  { type: 'Monitoring Server', label: 'Monitoring Server', icon: <Eye className="w-3.5 h-3.5 text-emerald-600" />, defaultPurdue: 'Level 3', role: 'Monitor', category: 'Supervisory' },
  { type: 'Untrusted Device', label: 'Untrusted Device', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />, defaultPurdue: 'Untrusted', role: 'Untrusted', category: 'External' },
];

// Group by category
const categories = ['Field Devices', 'Network', 'Supervisory', 'External'];

interface DevicePaletteProps {
  onAddDevice: (item: PaletteItem) => void;
}

export const DevicePalette: React.FC<DevicePaletteProps> = ({ onAddDevice }) => {
  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/reactflow-type', item.type);
    event.dataTransfer.setData('application/palette-item', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-52 bg-white border-r border-stone-200/80 flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-stone-100">
        <h3 className="text-[11px] font-semibold text-stone-800 tracking-wide">Device Palette</h3>
        <p className="text-[10px] text-stone-400 mt-0.5">Drag onto canvas or click to add</p>
      </div>

      {/* Categorized items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3">
        {categories.map((cat) => {
          const items = PALETTE_ITEMS.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="text-[9px] font-semibold text-stone-400 uppercase tracking-[0.06em] px-1 mb-1.5">{cat}</div>
              <div className="space-y-1">
                {items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    onClick={() => onAddDevice(item)}
                    className="group flex items-center gap-2 px-2 py-[6px] rounded-md border border-transparent hover:border-stone-200 hover:bg-stone-50/80 transition-all duration-150 cursor-grab active:cursor-grabbing"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-md bg-stone-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-xs transition-all">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-stone-700 truncate leading-tight">{item.label}</div>
                      <div className="text-[9px] text-stone-400 font-mono">{item.defaultPurdue}</div>
                    </div>
                    <Plus className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-stone-100 text-[9px] text-stone-400 text-center">
        Virtual models — not physical hardware
      </div>
    </div>
  );
};
