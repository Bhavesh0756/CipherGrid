import React, { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { Scissors, X } from 'lucide-react';

export interface LaserEdgeData {
  isActive?: boolean;
  inPath?: boolean;
  status?: 'accepted' | 'tampered' | 'idle';
  latency?: number;
  edgeColor?: string;
  sourceDeviceName?: string;
  targetDeviceName?: string;
  isSliceMode?: boolean;
  onDelete?: (id: string) => void;
}


export const LaserEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const edgeData = (data || {}) as LaserEdgeData;
  const {
    isActive = false,
    inPath = false,
    status = 'idle',
    latency = 12,
    edgeColor = '#334155',
  } = edgeData;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 16,
  });

  const isAccepted = status === 'accepted';
  const isTampered = status === 'tampered';
  const isSliceMode = Boolean(edgeData.isSliceMode);
  const [isHovered, setIsHovered] = useState(false);

  // Determine conduit coloring
  let conduitStroke = edgeColor;
  let conduitWidth = 1.8;
  let conduitOpacity = 0.6;

  if (isSliceMode) {
    conduitStroke = '#f43f5e';
    conduitWidth = 2.8;
    conduitOpacity = 0.95;
  } else if (isActive) {
    conduitStroke = isTampered ? '#f43f5e' : '#10b981';
    conduitWidth = 3;
    conduitOpacity = 1;
  } else if (inPath) {
    conduitStroke = '#3b82f6';
    conduitWidth = 2.2;
    conduitOpacity = 0.85;
  }


  // Unique SVG filter ID per edge to avoid collisions
  const filterId = `laser-glow-${id}`;
  const sparkId = `spark-filter-${id}`;

  return (
    <>
      <defs>
        {/* Glow filter for emerald laser */}
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur1" />
          <feGaussianBlur stdDeviation="7" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow filter for crimson attack sparks */}
        <filter id={sparkId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="sparkBlur" />
          <feComponentTransfer in="sparkBlur" result="sparkBoost">
            <feFuncA type="linear" slope="2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="sparkBoost" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Linear gradient for laser beam */}
        <linearGradient id={`laser-grad-${id}`} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isTampered ? '#fb7185' : '#34d399'} stopOpacity="0.9" />
          <stop offset="50%" stopColor={isTampered ? '#f43f5e' : '#06b6d4'} stopOpacity="1" />
          <stop offset="100%" stopColor={isTampered ? '#e11d48' : '#10b981'} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* 1. Underlying physical conduit / cable */}
      <path
        id={`${id}-conduit-base`}
        d={edgePath}
        fill="none"
        stroke="#0b1120"
        strokeWidth={conduitWidth + 4}
        strokeLinecap="round"
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: conduitStroke,
          strokeWidth: conduitWidth,
          strokeOpacity: conduitOpacity,
          strokeDasharray: inPath && !isActive ? '6 4' : undefined,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
        }}
      />

      {/* Slicing / Cut Hit-Area overlay for easy click & slice */}
      <path
        d={edgePath}
        fill="none"
        stroke={isSliceMode ? 'rgba(244, 63, 94, 0.3)' : 'transparent'}
        strokeWidth={isSliceMode ? 24 : 12}
        style={{
          cursor: isSliceMode ? 'crosshair' : 'pointer',
          pointerEvents: 'all',
        }}
        onClick={(e) => {
          if (isSliceMode) {
            e.stopPropagation();
            edgeData.onDelete?.(id);
          }
        }}
        className={isSliceMode ? 'hover:stroke-rose-500/60 transition-colors cursor-crosshair' : ''}
      />


      {/* 2. Active Neon Laser Beam & Glowing Plasma Overlay */}
      {isActive && (
        <>
          {/* Intense ambient bloom / neon glow halo */}
          <path
            d={edgePath}
            fill="none"
            stroke={isTampered ? '#f43f5e' : '#10b981'}
            strokeWidth={8}
            strokeOpacity={0.4}
            filter={`url(#${filterId})`}
            strokeLinecap="round"
          />

          {/* Core high-intensity laser line with animated dashoffset */}
          <path
            d={edgePath}
            fill="none"
            stroke={`url(#laser-grad-${id})`}
            strokeWidth={3.5}
            strokeDasharray="14 8"
            className="animate-laser-flow"
            strokeLinecap="round"
          />

          {/* Traveling energy photon packet (Primary particle) */}
          <g>
            <circle
              r={isTampered ? 5.5 : 4.5}
              fill={isTampered ? '#ffffff' : '#ecfeff'}
              stroke={isTampered ? '#f43f5e' : '#06b6d4'}
              strokeWidth={2}
              filter={`url(#${filterId})`}
            >
              <animateMotion
                dur={isTampered ? '0.7s' : '0.95s'}
                repeatCount="indefinite"
                path={edgePath}
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>

            {/* Trailing energy tail photon */}
            <circle
              r={2.8}
              fill={isTampered ? '#fda4af' : '#6ee7b7'}
              opacity={0.8}
            >
              <animateMotion
                dur={isTampered ? '0.7s' : '0.95s'}
                repeatCount="indefinite"
                path={edgePath}
                keyPoints="0;1"
                keyTimes="0;1"
                begin="0.08s"
              />
            </circle>

            <circle
              r={1.8}
              fill={isTampered ? '#f43f5e' : '#10b981'}
              opacity={0.6}
            >
              <animateMotion
                dur={isTampered ? '0.7s' : '0.95s'}
                repeatCount="indefinite"
                path={edgePath}
                keyPoints="0;1"
                keyTimes="0;1"
                begin="0.16s"
              />
            </circle>
          </g>

          {/* 3. Crimson Spark Explosion / Shockwave if Tampered/Attack detected */}
          {isTampered && (
            <g transform={`translate(${labelX}, ${labelY})`}>
              {/* Outer expanding shockwave ring */}
              <circle
                r={24}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2}
                className="animate-shockwave-ring"
              />
              <circle
                r={16}
                fill="#f43f5e"
                fillOpacity={0.25}
                stroke="#fb7185"
                strokeWidth={1.5}
                className="animate-ping"
              />
              {/* Radial spark burst rays */}
              <g className="animate-spark-burst" filter={`url(#${sparkId})`}>
                <line x1="-12" y1="-12" x2="-22" y2="-22" stroke="#fecdd3" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="-12" x2="22" y2="-22" stroke="#fecdd3" strokeWidth="2" strokeLinecap="round" />
                <line x1="-12" y1="12" x2="-22" y2="22" stroke="#fecdd3" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="12" x2="22" y2="22" stroke="#fecdd3" strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="-15" x2="0" y2="-25" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="0" y1="15" x2="0" y2="25" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="-15" y1="0" x2="-25" y2="0" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="15" y1="0" x2="25" y2="0" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
              </g>
              <circle r={6} fill="#ffffff" stroke="#e11d48" strokeWidth={2.5} />
            </g>
          )}
        </>
      )}

      {/* 4. Interactive HUD Edge Label (Latency / Status) */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isSliceMode ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                edgeData.onDelete?.(id);
              }}
              className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider shadow-lg flex items-center gap-1 transition-all transform hover:scale-110 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-rose-950/80 cursor-pointer animate-pulse"
              title="Slice & Delete this connection path"
            >
              <Scissors className="w-3 h-3 text-white" />
              <span>CUT</span>
            </button>
          ) : isActive ? (
            <div
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider shadow-lg flex items-center gap-1.5 transition-all transform scale-105 ${
                isTampered
                  ? 'bg-rose-950/95 text-rose-300 border border-rose-500 shadow-rose-950/80 animate-pulse'
                  : 'bg-emerald-950/95 text-emerald-300 border border-emerald-500 shadow-emerald-950/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTampered ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span>{isTampered ? 'TAMPER DROPPED' : 'LASER TRANSIT'}</span>
            </div>
          ) : (
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`group px-1.5 py-0.5 rounded-full text-[8.5px] font-mono transition-all border flex items-center gap-1 ${
                inPath
                  ? 'bg-blue-950/90 text-blue-300 border-blue-500/60 shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800'
              }`}
            >
              <span>{latency}ms</span>
              {edgeData.onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    edgeData.onDelete?.(id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 p-0.5 rounded transition-all cursor-pointer"
                  title="Cut connection"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

LaserEdge.displayName = 'LaserEdge';
