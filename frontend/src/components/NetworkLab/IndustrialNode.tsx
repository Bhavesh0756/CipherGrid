import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Activity,
  Cpu,
  Eye,
  HardDrive,
  Laptop,
  Layers,
  Network,
  Radio,
  Router as RouterIcon,
  ShieldAlert,
  Thermometer,
} from 'lucide-react';
import { Device, DeviceType } from '../../types';

interface IndustrialNodeProps {
  data: {
    device: Device;
    isSelected?: boolean;
    isHighlighted?: boolean;
    isActiveHop?: boolean;
    isSource?: boolean;
    isDestination?: boolean;
  };
}

const DEVICE_CONFIG: Record<
  DeviceType,
  {
    icon: React.ReactNode;
    iconBg: string;
    borderAccent: string;
    edgeColor: string;
  }
> = {
  'Sensor': {
    icon: <Thermometer className="w-4 h-4 text-amber-600" />,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    borderAccent: 'border-l-amber-500',
    edgeColor: '#f59e0b',
  },
  'PLC': {
    icon: <Cpu className="w-4 h-4 text-blue-600" />,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    borderAccent: 'border-l-blue-600',
    edgeColor: '#2563eb',
  },
  'SCADA Server': {
    icon: <HardDrive className="w-4 h-4 text-purple-600" />,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200/80',
    borderAccent: 'border-l-purple-600',
    edgeColor: '#9333ea',
  },
  'Operator Workstation': {
    icon: <Laptop className="w-4 h-4 text-amber-600" />,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    borderAccent: 'border-l-amber-500',
    edgeColor: '#f59e0b',
  },
  'Industrial Gateway': {
    icon: <Network className="w-4 h-4 text-emerald-600" />,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    borderAccent: 'border-l-emerald-600',
    edgeColor: '#10b981',
  },
  'Ethernet Switch': {
    icon: <Layers className="w-4 h-4 text-blue-600" />,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    borderAccent: 'border-l-blue-600',
    edgeColor: '#2563eb',
  },
  'Router': {
    icon: <RouterIcon className="w-4 h-4 text-cyan-600" />,
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
    borderAccent: 'border-l-cyan-600',
    edgeColor: '#06b6d4',
  },
  'Monitoring Server': {
    icon: <Eye className="w-4 h-4 text-emerald-600" />,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    borderAccent: 'border-l-emerald-600',
    edgeColor: '#10b981',
  },
  'Untrusted Device': {
    icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
    borderAccent: 'border-l-rose-600',
    edgeColor: '#e11d48',
  },
};

export const IndustrialNode: React.FC<IndustrialNodeProps> = memo(({ data }) => {
  const { device, isSelected, isHighlighted, isActiveHop, isSource, isDestination } = data;
  const config =
    DEVICE_CONFIG[device.device_type] || {
      icon: <Activity className="w-4 h-4 text-slate-600" />,
      iconBg: 'bg-slate-50 text-slate-600 border-slate-200',
      borderAccent: 'border-l-slate-400',
      edgeColor: '#64748b',
    };

  const isTrusted = device.trust_status === 'Trusted';
  const isUntrusted = device.trust_status === 'Untrusted';

  // Clean display name
  const displayName = device.name.replace(/\s+PLC$/i, '').trim();

  let borderClasses = `border-l-4 ${config.borderAccent} border-slate-200`;
  let shadowClasses = 'shadow-xs hover:shadow-md';

  if (isActiveHop) {
    borderClasses = 'border-l-4 border-l-blue-600 border-blue-500 ring-2 ring-blue-500/50 node-active-hop';
    shadowClasses = 'shadow-lg';
  } else if (isSelected) {
    borderClasses = 'border-l-4 border-l-blue-600 border-blue-500 ring-2 ring-blue-500/40';
    shadowClasses = 'shadow-md';
  } else if (isHighlighted) {
    borderClasses = `border-l-4 ${config.borderAccent} border-blue-400 ring-1 ring-blue-400/30`;
    shadowClasses = 'shadow-sm';
  }

  return (
    <div
      style={{ width: 240, height: 86, boxSizing: 'border-box' }}
      className={`relative bg-white rounded-xl border transition-all duration-200 px-3 py-2.5 flex flex-col justify-between select-none ${borderClasses} ${shadowClasses} ${
        !device.is_enabled ? 'opacity-60' : ''
      }`}
    >
      {/* Port handles on all 4 sides */}
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />

      {/* Top row: Icon, Name, Type, Trust Status Badge */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-[12px] font-bold text-slate-900 truncate leading-snug tracking-tight"
              title={displayName}
            >
              {displayName}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate">
              {device.device_type}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          {isTrusted && (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Trusted
            </span>
          )}
          {isUntrusted && (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Untrusted
            </span>
          )}
          {device.trust_status === 'Quarantined' && (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Quarantined
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: IP address and Purdue Level completely inside the card border */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
        <span className="font-mono text-slate-700 font-medium">
          {device.ip_address}
        </span>
        <span className="text-slate-500 font-medium text-[10px]">
          {device.purdue_level}
        </span>
      </div>

      {/* Source / Destination flags during simulation */}
      {isSource && (
        <div className="absolute -top-2 left-3 bg-blue-600 text-white text-[8px] font-mono font-bold px-1.5 py-[2px] rounded-sm shadow-xs tracking-wider">
          SRC
        </div>
      )}
      {isDestination && (
        <div className="absolute -top-2 right-3 bg-emerald-600 text-white text-[8px] font-mono font-bold px-1.5 py-[2px] rounded-sm shadow-xs tracking-wider">
          DST
        </div>
      )}
    </div>
  );
});

IndustrialNode.displayName = 'IndustrialNode';

