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
  }
> = {
  'Sensor': {
    icon: <Thermometer className="w-3.5 h-3.5 text-slate-300" />,
  },
  'PLC': {
    icon: <Cpu className="w-3.5 h-3.5 text-blue-400" />,
  },
  'SCADA Server': {
    icon: <HardDrive className="w-3.5 h-3.5 text-blue-400" />,
  },
  'Operator Workstation': {
    icon: <Laptop className="w-3.5 h-3.5 text-slate-300" />,
  },
  'Industrial Gateway': {
    icon: <Network className="w-3.5 h-3.5 text-blue-400" />,
  },
  'Ethernet Switch': {
    icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
  },
  'Router': {
    icon: <RouterIcon className="w-3.5 h-3.5 text-blue-400" />,
  },
  'Monitoring Server': {
    icon: <Eye className="w-3.5 h-3.5 text-emerald-400" />,
  },
  'Untrusted Device': {
    icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
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

  const config = DEVICE_CONFIG[device.device_type] || {
    icon: <Activity className="w-3.5 h-3.5 text-slate-400" />,
  };

  const isTrusted = device.trust_status === 'Trusted';
  const isUntrusted = device.trust_status === 'Untrusted';
  const displayName = device.name.replace(/\s+PLC$/i, '').trim();

  // Linear Slate & Ice Blue: Calm, matte 1px hairline borders with subtle focus states
  let borderClasses = 'border-[#1E2430] hover:border-slate-600/80';
  let ringClasses = '';

  if (isActiveHop && isSimulating) {
    if (laserStatus === 'tampered') {
      borderClasses = 'border-rose-500/80 bg-[#161218]';
      ringClasses = 'ring-1 ring-rose-500/60 shadow-lg shadow-rose-950/40';
    } else {
      borderClasses = 'border-blue-500/90 bg-[#101724]';
      ringClasses = 'ring-1 ring-blue-500/60 shadow-lg shadow-blue-950/40';
    }
  } else if (isActiveHop) {
    borderClasses = 'border-blue-500/80 bg-[#101724]';
    ringClasses = 'ring-1 ring-blue-500/50';
  } else if (isSelected) {
    borderClasses = 'border-blue-500 shadow-md shadow-blue-950/40';
    ringClasses = 'ring-1 ring-blue-500/50';
  } else if (isHighlighted) {
    borderClasses = 'border-blue-500/50';
    ringClasses = 'ring-1 ring-blue-500/20';
  }

  return (
    <div
      style={{ width: 236, height: 82, boxSizing: 'border-box' }}
      className={`group relative bg-[#10131A] rounded-xl border transition-all duration-150 px-3 py-2 flex flex-col justify-between select-none shadow-md shadow-black/40 ${borderClasses} ${ringClasses} ${
        !device.is_enabled ? 'opacity-35 grayscale' : ''
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
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#161B26] border border-[#222B3C] shrink-0">
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
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/40 animate-pulse'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  laserStatus === 'tampered' ? 'bg-rose-400' : 'bg-blue-400'
                }`}
              />
              {laserStatus === 'tampered' ? 'DROP' : 'PACKET'}
            </span>
          ) : (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  device.is_enabled && isTrusted
                    ? 'bg-emerald-400'
                    : isUntrusted
                    ? 'bg-rose-400'
                    : 'bg-slate-500'
                }`}
              />
              <span
                className={`text-[8.5px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                  isTrusted
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : isUntrusted
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isTrusted ? 'TRUST' : isUntrusted ? 'ROGUE' : 'OFF'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom row: IP address and Purdue Level */}
      <div className="pt-1.5 border-t border-[#1E2430] flex items-center justify-between text-[10.5px]">
        <span className="font-mono text-slate-400 font-medium text-[10.5px] tracking-tight">
          {device.ip_address}
        </span>
        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#161B26] border border-[#222B3C] text-slate-400">
          {device.purdue_level}
        </span>
      </div>

      {/* Source / Destination flags */}
      {isSource && (
        <div className="absolute -top-2.5 left-3 bg-blue-600 border border-blue-400 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider">
          SRC
        </div>
      )}
      {isDestination && (
        <div className="absolute -top-2.5 right-3 bg-blue-600 border border-blue-400 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider">
          DST
        </div>
      )}
    </div>
  );
});

IndustrialNode.displayName = 'IndustrialNode';
