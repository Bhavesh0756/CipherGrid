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
    laserStatus?: 'accepted' | 'tampered' | 'idle';
    isSimulating?: boolean;
  };
}

const DEVICE_CONFIG: Record<
  DeviceType,
  {
    icon: React.ReactNode;
    iconBg: string;
    borderAccent: string;
    levelColor: string;
  }
> = {
  'Sensor': {
    icon: <Thermometer className="w-4 h-4 text-amber-400" />,
    iconBg: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
    borderAccent: 'border-l-amber-500',
    levelColor: 'text-amber-300/90 bg-amber-950/30 border-amber-800/40',
  },
  'PLC': {
    icon: <Cpu className="w-4 h-4 text-blue-400" />,
    iconBg: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
    borderAccent: 'border-l-blue-500',
    levelColor: 'text-blue-300/90 bg-blue-950/30 border-blue-800/40',
  },
  'SCADA Server': {
    icon: <HardDrive className="w-4 h-4 text-purple-400" />,
    iconBg: 'bg-purple-950/40 text-purple-400 border-purple-800/40',
    borderAccent: 'border-l-purple-500',
    levelColor: 'text-purple-300/90 bg-purple-950/30 border-purple-800/40',
  },
  'Operator Workstation': {
    icon: <Laptop className="w-4 h-4 text-amber-400" />,
    iconBg: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
    borderAccent: 'border-l-amber-500',
    levelColor: 'text-amber-300/90 bg-amber-950/30 border-amber-800/40',
  },
  'Industrial Gateway': {
    icon: <Network className="w-4 h-4 text-emerald-400" />,
    iconBg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
    borderAccent: 'border-l-emerald-500',
    levelColor: 'text-emerald-300/90 bg-emerald-950/30 border-emerald-800/40',
  },
  'Ethernet Switch': {
    icon: <Layers className="w-4 h-4 text-blue-400" />,
    iconBg: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
    borderAccent: 'border-l-blue-500',
    levelColor: 'text-blue-300/90 bg-blue-950/30 border-blue-800/40',
  },
  'Router': {
    icon: <RouterIcon className="w-4 h-4 text-sky-400" />,
    iconBg: 'bg-sky-950/40 text-sky-400 border-sky-800/40',
    borderAccent: 'border-l-sky-500',
    levelColor: 'text-sky-300/90 bg-sky-950/30 border-sky-800/40',
  },
  'Monitoring Server': {
    icon: <Eye className="w-4 h-4 text-emerald-400" />,
    iconBg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
    borderAccent: 'border-l-emerald-500',
    levelColor: 'text-emerald-300/90 bg-emerald-950/30 border-emerald-800/40',
  },
  'Untrusted Device': {
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    iconBg: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
    borderAccent: 'border-l-rose-500',
    levelColor: 'text-rose-300/90 bg-rose-950/30 border-rose-800/40',
  },
};

export const IndustrialNode: React.FC<IndustrialNodeProps> = memo(({ data }) => {
  const {
    device,
    isSelected,
    isHighlighted,
    isActiveHop,
    isSource,
    isDestination,
    laserStatus = 'idle',
    isSimulating = false,
  } = data;
  const config =
    DEVICE_CONFIG[device.device_type] || {
      icon: <Activity className="w-4 h-4 text-slate-400" />,
      iconBg: 'bg-slate-800 text-slate-400 border-slate-700',
      borderAccent: 'border-l-slate-500',
      levelColor: 'text-slate-400 bg-slate-800 border-slate-700',
    };

  const isTrusted = device.trust_status === 'Trusted';
  const isUntrusted = device.trust_status === 'Untrusted';

  const displayName = device.name.replace(/\s+PLC$/i, '').trim();

  // Subtle clean border styles or energetic laser resonance
  let borderClasses = `border-l-4 ${config.borderAccent} border-slate-800`;
  let ringClasses = '';

  if (isActiveHop && isSimulating) {
    if (laserStatus === 'tampered') {
      borderClasses = 'border-l-4 border-l-rose-500 border-rose-500';
      ringClasses = 'ring-2 ring-rose-500/80 node-laser-tampered';
    } else {
      borderClasses = 'border-l-4 border-l-emerald-400 border-emerald-500';
      ringClasses = 'ring-2 ring-emerald-500/80 node-laser-accepted';
    }
  } else if (isActiveHop) {
    borderClasses = 'border-l-4 border-l-blue-400 border-blue-500';
    ringClasses = 'ring-2 ring-blue-500/60 node-active-hop';
  } else if (isSelected) {
    borderClasses = 'border-l-4 border-l-blue-500 border-slate-600';
    ringClasses = 'ring-1 ring-blue-500/50';
  } else if (isHighlighted) {
    borderClasses = `border-l-4 ${config.borderAccent} border-blue-500/60`;
    ringClasses = 'ring-1 ring-blue-500/30';
  }

  return (
    <div
      style={{ width: 240, height: 86, boxSizing: 'border-box' }}
      className={`group relative bg-[#0e1422] rounded-xl border transition-all duration-150 px-3 py-2 flex flex-col justify-between select-none shadow-md shadow-black/40 ${borderClasses} ${ringClasses} ${
        !device.is_enabled ? 'opacity-40 grayscale' : ''
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
            className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-[12px] font-semibold text-slate-100 truncate leading-snug tracking-tight font-display"
              title={displayName}
            >
              {displayName}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate">
              {device.device_type}
            </p>
          </div>
        </div>

        {/* Status Pill or Active Laser Transit Indicator */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isActiveHop && isSimulating ? (
            <span
              className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                laserStatus === 'tampered'
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse'
                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-500 animate-pulse'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  laserStatus === 'tampered' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              {laserStatus === 'tampered' ? 'TAMPER' : 'LASER'}
            </span>
          ) : (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  device.is_enabled && isTrusted
                    ? 'bg-emerald-500'
                    : isUntrusted
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span
                className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                  isTrusted
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                    : isUntrusted
                    ? 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                }`}
              >
                {isTrusted ? 'TRUST' : isUntrusted ? 'ROGUE' : 'STANDBY'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom row: IP address and Purdue Level */}
      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px]">
        <span className="font-mono text-slate-300 font-medium text-[11px] tracking-tight">
          {device.ip_address}
        </span>
        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded border ${config.levelColor}`}>
          {device.purdue_level}
        </span>
      </div>

      {/* Source / Destination flags */}
      {isSource && (
        <div className="absolute -top-2.5 left-3 bg-blue-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider">
          SRC
        </div>
      )}
      {isDestination && (
        <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider">
          DST
        </div>
      )}
    </div>
  );
});

IndustrialNode.displayName = 'IndustrialNode';
