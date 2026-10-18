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

const DEVICE_CONFIG: Record<DeviceType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Sensor': {
    icon: <Thermometer className="w-4 h-4" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  'PLC': {
    icon: <Cpu className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  'SCADA Server': {
    icon: <HardDrive className="w-4 h-4" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  'Operator Workstation': {
    icon: <Laptop className="w-4 h-4" />,
    color: 'text-stone-700',
    bg: 'bg-stone-50',
    border: 'border-stone-200',
  },
  'Industrial Gateway': {
    icon: <Network className="w-4 h-4" />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  'Ethernet Switch': {
    icon: <Layers className="w-4 h-4" />,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  'Router': {
    icon: <RouterIcon className="w-4 h-4" />,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  'Monitoring Server': {
    icon: <Eye className="w-4 h-4" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'Untrusted Device': {
    icon: <ShieldAlert className="w-4 h-4" />,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
};

const getTrustBadge = (trust: string, enabled: boolean) => {
  if (!enabled) {
    return <span className="text-[9px] px-1.5 py-[1px] rounded-full bg-stone-100 text-stone-500 font-medium tracking-wide uppercase">Offline</span>;
  }
  switch (trust) {
    case 'Trusted':
      return <span className="text-[9px] px-1.5 py-[1px] rounded-full bg-emerald-50 text-emerald-700 font-medium tracking-wide uppercase">Trusted</span>;
    case 'Untrusted':
      return <span className="text-[9px] px-1.5 py-[1px] rounded-full bg-rose-50 text-rose-700 font-medium tracking-wide uppercase">Untrusted</span>;
    case 'Quarantined':
      return <span className="text-[9px] px-1.5 py-[1px] rounded-full bg-amber-50 text-amber-700 font-medium tracking-wide uppercase">Quarantine</span>;
    default:
      return null;
  }
};

export const IndustrialNode: React.FC<IndustrialNodeProps> = memo(({ data }) => {
  const { device, isSelected, isHighlighted, isActiveHop, isSource, isDestination } = data;
  const config = DEVICE_CONFIG[device.device_type] || { icon: <Activity className="w-4 h-4" />, color: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-200' };

  let containerClass = 'border-stone-200/80';
  let shadowClass = 'shadow-xs';

  if (isActiveHop) {
    containerClass = 'border-cyan-500 node-active-hop';
    shadowClass = 'shadow-md';
  } else if (isHighlighted) {
    containerClass = 'border-cyan-400/60';
    shadowClass = 'shadow-sm';
  } else if (isSelected) {
    containerClass = 'border-stone-400';
    shadowClass = 'shadow-sm';
  }

  const isOffline = !device.is_enabled;

  return (
    <div
      className={`relative w-[180px] bg-white rounded-lg border transition-all duration-200 ${containerClass} ${shadowClass} ${
        isOffline ? 'opacity-50' : ''
      }`}
    >
      {/* Connection handles — all 4 sides */}
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />

      {/* Node header — device icon + name */}
      <div className={`flex items-center gap-2 px-2.5 py-[7px] rounded-t-lg ${config.bg}`}>
        <div className={`flex-shrink-0 ${config.color}`}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-stone-800 truncate leading-tight" title={device.name}>
            {device.name}
          </div>
          <div className="text-[9.5px] text-stone-500 font-medium mt-[1px]">
            {device.device_type}
          </div>
        </div>
      </div>

      {/* Node body — key fields */}
      <div className="px-2.5 py-[6px] space-y-[3px] border-t border-stone-100">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-stone-400">IP</span>
          <span className="font-mono text-stone-700 bg-stone-50 px-1.5 py-[1px] rounded text-[9.5px]">{device.ip_address}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-stone-400">Purdue</span>
          <span className="font-mono text-stone-500 text-[9.5px]">{device.purdue_level}</span>
        </div>
        <div className="flex items-center justify-end pt-[2px]">
          {getTrustBadge(device.trust_status, device.is_enabled)}
        </div>
      </div>

      {/* Simulation role flags */}
      {isSource && (
        <div className="absolute -top-2 left-2 bg-cyan-600 text-white text-[8px] font-mono font-bold px-1.5 py-[2px] rounded-sm shadow-sm tracking-wider">
          SRC
        </div>
      )}
      {isDestination && (
        <div className="absolute -top-2 right-2 bg-emerald-600 text-white text-[8px] font-mono font-bold px-1.5 py-[2px] rounded-sm shadow-sm tracking-wider">
          DST
        </div>
      )}
    </div>
  );
});

IndustrialNode.displayName = 'IndustrialNode';
