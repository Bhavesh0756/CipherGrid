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
    levelTag: string;
    levelColor: string;
  }
> = {
  'Sensor': {
    icon: <Thermometer className="w-4 h-4 text-amber-500" />,
    iconBg: 'bg-amber-500/10 text-amber-600 border-amber-300/40',
    borderAccent: 'border-l-amber-500',
    edgeColor: '#f59e0b',
    levelTag: 'L0 · FIELD',
    levelColor: 'bg-amber-50/80 text-amber-700 border-amber-200/90',
  },
  'PLC': {
    icon: <Cpu className="w-4 h-4 text-blue-500" />,
    iconBg: 'bg-blue-500/10 text-blue-600 border-blue-300/40',
    borderAccent: 'border-l-blue-600',
    edgeColor: '#2563eb',
    levelTag: 'L1 · CONTROL',
    levelColor: 'bg-blue-50/80 text-blue-700 border-blue-200/90',
  },
  'SCADA Server': {
    icon: <HardDrive className="w-4 h-4 text-purple-500" />,
    iconBg: 'bg-purple-500/10 text-purple-600 border-purple-300/40',
    borderAccent: 'border-l-purple-600',
    edgeColor: '#9333ea',
    levelTag: 'L2 · SCADA',
    levelColor: 'bg-purple-50/80 text-purple-700 border-purple-200/90',
  },
  'Operator Workstation': {
    icon: <Laptop className="w-4 h-4 text-amber-500" />,
    iconBg: 'bg-amber-500/10 text-amber-600 border-amber-300/40',
    borderAccent: 'border-l-amber-500',
    edgeColor: '#f59e0b',
    levelTag: 'L2 · HMI',
    levelColor: 'bg-amber-50/80 text-amber-700 border-amber-200/90',
  },
  'Industrial Gateway': {
    icon: <Network className="w-4 h-4 text-emerald-500" />,
    iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-300/40',
    borderAccent: 'border-l-emerald-600',
    edgeColor: '#10b981',
    levelTag: 'L3 · GATEWAY',
    levelColor: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/90',
  },
  'Ethernet Switch': {
    icon: <Layers className="w-4 h-4 text-blue-500" />,
    iconBg: 'bg-blue-500/10 text-blue-600 border-blue-300/40',
    borderAccent: 'border-l-blue-600',
    edgeColor: '#2563eb',
    levelTag: 'L1 · SWITCH',
    levelColor: 'bg-blue-50/80 text-blue-700 border-blue-200/90',
  },
  'Router': {
    icon: <RouterIcon className="w-4 h-4 text-cyan-500" />,
    iconBg: 'bg-cyan-500/10 text-cyan-600 border-cyan-300/40',
    borderAccent: 'border-l-cyan-600',
    edgeColor: '#06b6d4',
    levelTag: 'L3 · ROUTER',
    levelColor: 'bg-cyan-50/80 text-cyan-700 border-cyan-200/90',
  },
  'Monitoring Server': {
    icon: <Eye className="w-4 h-4 text-emerald-500" />,
    iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-300/40',
    borderAccent: 'border-l-emerald-600',
    edgeColor: '#10b981',
    levelTag: 'L3 · SOC',
    levelColor: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/90',
  },
  'Untrusted Device': {
    icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
    iconBg: 'bg-rose-500/10 text-rose-600 border-rose-300/40',
    borderAccent: 'border-l-rose-600',
    edgeColor: '#e11d48',
    levelTag: 'DMZ · UNTRUSTED',
    levelColor: 'bg-rose-50/80 text-rose-700 border-rose-200/90',
  },
};

export const IndustrialNode: React.FC<IndustrialNodeProps> = memo(({ data }) => {
  const { device, isSelected, isHighlighted, isActiveHop, isSource, isDestination } = data;
  const config =
    DEVICE_CONFIG[device.device_type] || {
      icon: <Activity className="w-4 h-4 text-slate-500" />,
      iconBg: 'bg-slate-500/10 text-slate-600 border-slate-300/40',
      borderAccent: 'border-l-slate-400',
      edgeColor: '#64748b',
      levelTag: 'ICS DEVICE',
      levelColor: 'bg-slate-50 text-slate-700 border-slate-200',
    };

  const isTrusted = device.trust_status === 'Trusted';
  const isUntrusted = device.trust_status === 'Untrusted';
  const isQuarantined = device.trust_status === 'Quarantined';

  // Clean display name
  const displayName = device.name.replace(/\s+PLC$/i, '').trim();

  let stateClasses = 'border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5';

  if (isActiveHop) {
    stateClasses =
      'border-blue-500 ring-4 ring-blue-500/35 shadow-[0_0_30px_rgba(37,99,235,0.4)] node-active-hop';
  } else if (isSelected) {
    stateClasses =
      'border-blue-500 ring-2 ring-blue-500/40 shadow-[0_4px_20px_rgba(37,99,235,0.22)] -translate-y-0.5';
  } else if (isHighlighted) {
    stateClasses =
      'border-blue-400 ring-1 ring-blue-400/30 shadow-[0_2px_14px_rgba(59,130,246,0.15)]';
  }

  return (
    <div
      style={{ width: 250, height: 92, boxSizing: 'border-box' }}
      className={`group relative bg-white/95 backdrop-blur-md rounded-xl border border-l-[3.5px] ${config.borderAccent} transition-all duration-200 px-3 py-2 flex flex-col justify-between select-none ${stateClasses} ${
        !device.is_enabled ? 'opacity-60' : ''
      }`}
    >
      {/* Port handles on all 4 sides with high-tech glowing style */}
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />

      {/* Top row: Icon, Name, Type, Live Telemetry Radar Beacon */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Futuristic silicon chip container */}
          <div
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105 ${config.iconBg}`}
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

        {/* Live Radar Ping Status Pill */}
        <div className="shrink-0 flex items-center">
          {isTrusted && (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Trusted
            </span>
          )}
          {isUntrusted && (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
              Untrusted
            </span>
          )}
          {isQuarantined && (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              Quarantined
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: High-tech LED Terminal IP & Purdue Level Tag */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
        {/* LED Terminal Readout */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee] animate-pulse"></span>
          <span className="font-mono text-[10px] text-cyan-300 font-semibold tracking-wide">
            {device.ip_address}
          </span>
        </div>

        {/* Purdue Tag */}
        <span
          className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded border shadow-2xs tracking-tight ${config.levelColor}`}
        >
          {config.levelTag}
        </span>
      </div>

      {/* Source / Destination flags during simulation */}
      {isSource && (
        <div className="absolute -top-2 left-3 bg-blue-600 text-white text-[8px] font-mono font-bold px-1.5 py-[2px] rounded shadow-[0_0_8px_rgba(37,99,235,0.6)] tracking-wider">
          SRC · ORIGIN
        </div>
      )}
      {isDestination && (
        <div className="absolute -top-2 right-3 bg-emerald-600 text-white text-[8px] font-mono font-bold px-1.5 py-[2px] rounded shadow-[0_0_8px_rgba(16,185,129,0.6)] tracking-wider">
          DST · TARGET
        </div>
      )}
    </div>
  );
});

IndustrialNode.displayName = 'IndustrialNode';
