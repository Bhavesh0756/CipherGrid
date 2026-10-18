import React from 'react';
import {
  Activity,
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
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'Sensor',
    label: 'Sensor',
    icon: <Thermometer className="w-4 h-4 text-amber-600" />,
    defaultPurdue: 'Level 0',
    role: 'Sensor',
  },
  {
    type: 'PLC',
    label: 'PLC / Controller',
    icon: <Cpu className="w-4 h-4 text-blue-600" />,
    defaultPurdue: 'Level 1',
    role: 'Controller',
  },
  {
    type: 'SCADA Server',
    label: 'SCADA Server',
    icon: <HardDrive className="w-4 h-4 text-indigo-600" />,
    defaultPurdue: 'Level 2',
    role: 'SCADA',
  },
  {
    type: 'Operator Workstation',
    label: 'Operator Workstation',
    icon: <Laptop className="w-4 h-4 text-slate-700" />,
    defaultPurdue: 'Level 2',
    role: 'Operator',
  },
  {
    type: 'Industrial Gateway',
    label: 'Industrial Gateway',
    icon: <Network className="w-4 h-4 text-teal-600" />,
    defaultPurdue: 'Level 3',
    role: 'Gateway',
  },
  {
    type: 'Ethernet Switch',
    label: 'Ethernet Switch',
    icon: <Layers className="w-4 h-4 text-slate-600" />,
    defaultPurdue: 'Level 1',
    role: 'Switch',
  },
  {
    type: 'Router',
    label: 'Router',
    icon: <RouterIcon className="w-4 h-4 text-cyan-700" />,
    defaultPurdue: 'Level 3',
    role: 'Router',
  },
  {
    type: 'Monitoring Server',
    label: 'Monitoring Server',
    icon: <Eye className="w-4 h-4 text-emerald-600" />,
    defaultPurdue: 'Level 3',
    role: 'Monitor',
  },
  {
    type: 'Untrusted Device',
    label: 'Untrusted Device',
    icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
    defaultPurdue: 'Untrusted',
    role: 'Untrusted',
  },
];

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
    <div className="w-56 bg-white border-r border-slate-200 flex flex-col h-full select-none">
      {/* Palette Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Device Palette</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Drag or click to deploy virtual nodes</p>
      </div>

      {/* Palette Items List */}
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1">
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onClick={() => onAddDevice(item)}
            className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-grab active:cursor-grabbing text-slate-800 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded bg-slate-100 group-hover:bg-white">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-800 truncate">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-mono">{item.defaultPurdue}</div>
              </div>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Add to canvas"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 text-center">
        Virtual models for simulation only. Not connected to physical hardware.
      </div>
    </div>
  );
};
