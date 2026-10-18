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

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'Sensor':
      return <Thermometer className="w-5 h-5 text-amber-600" />;
    case 'PLC':
      return <Cpu className="w-5 h-5 text-blue-600" />;
    case 'SCADA Server':
      return <HardDrive className="w-5 h-5 text-indigo-600" />;
    case 'Operator Workstation':
      return <Laptop className="w-5 h-5 text-slate-700" />;
    case 'Industrial Gateway':
      return <Network className="w-5 h-5 text-teal-600" />;
    case 'Ethernet Switch':
      return <Layers className="w-5 h-5 text-slate-600" />;
    case 'Router':
      return <RouterIcon className="w-5 h-5 text-cyan-700" />;
    case 'Monitoring Server':
      return <Eye className="w-5 h-5 text-emerald-600" />;
    case 'Untrusted Device':
      return <ShieldAlert className="w-5 h-5 text-rose-600" />;
    default:
      return <Activity className="w-5 h-5 text-slate-600" />;
  }
};

const getTrustBadge = (trust: string, enabled: boolean) => {
  if (!enabled) {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">Disabled</span>;
  }
  switch (trust) {
    case 'Trusted':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Trusted</span>;
    case 'Untrusted':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">Untrusted</span>;
    case 'Quarantined':
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">Quarantine</span>;
    default:
      return null;
  }
};

export const IndustrialNode: React.FC<IndustrialNodeProps> = memo(({ data }) => {
  const { device, isSelected, isHighlighted, isActiveHop, isSource, isDestination } = data;

  let borderClass = 'border-slate-300';
  let ringClass = '';

  if (isActiveHop) {
    borderClass = 'border-blue-600';
    ringClass = 'ring-2 ring-blue-500/40 shadow-sm';
  } else if (isHighlighted) {
    borderClass = 'border-blue-400';
    ringClass = 'ring-1 ring-blue-300';
  } else if (isSelected) {
    borderClass = 'border-slate-700';
    ringClass = 'ring-2 ring-slate-400';
  }

  const isOffline = !device.is_enabled;

  return (
    <div
      className={`relative w-48 bg-white rounded-md border text-left shadow-sm transition-all duration-150 ${borderClass} ${ringClass} ${
        isOffline ? 'opacity-65' : ''
      }`}
    >
      {/* 4 Port Handles for connecting links */}
      <Handle type="target" position={Position.Top} id="t" className="!w-2 !h-2 !bg-slate-400 hover:!bg-blue-600" />
      <Handle type="source" position={Position.Bottom} id="b" className="!w-2 !h-2 !bg-slate-400 hover:!bg-blue-600" />
      <Handle type="target" position={Position.Left} id="l" className="!w-2 !h-2 !bg-slate-400 hover:!bg-blue-600" />
      <Handle type="source" position={Position.Right} id="r" className="!w-2 !h-2 !bg-slate-400 hover:!bg-blue-600" />

      {/* Node Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 bg-slate-50/70 rounded-t-md">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex-shrink-0">{getDeviceIcon(device.device_type)}</div>
          <span className="text-xs font-semibold text-slate-800 truncate" title={device.name}>
            {device.name}
          </span>
        </div>
        <div>{getTrustBadge(device.trust_status, device.is_enabled)}</div>
      </div>

      {/* Node Body */}
      <div className="px-2.5 py-2 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Type:</span>
          <span className="font-medium text-slate-700 truncate max-w-[100px]">{device.device_type}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>IP:</span>
          <span className="font-mono text-slate-800 text-[10px] bg-slate-100 px-1 rounded">{device.ip_address}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Purdue:</span>
          <span className="text-[10px] font-mono text-slate-600">{device.purdue_level}</span>
        </div>
      </div>

      {/* Simulation Role Flag Overlay */}
      {isSource && (
        <div className="absolute -top-2.5 left-2 bg-blue-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm">
          SRC
        </div>
      )}
      {isDestination && (
        <div className="absolute -top-2.5 right-2 bg-teal-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm">
          DST
        </div>
      )}
    </div>
  );
});

IndustrialNode.displayName = 'IndustrialNode';
