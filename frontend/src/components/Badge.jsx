import React from 'react';

const variantMap = {
  // Status variants
  Authorized:    {
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    dot: 'bg-emerald-400',
  },
  Suspended:     {
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    dot: 'bg-amber-400',
  },
  Unauthorized:  {
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    dot: 'bg-rose-400',
  },
  Revoked:       {
    badge: 'bg-rose-950/60 text-rose-200 border-rose-700/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    dot: 'bg-rose-500',
  },
  // Severity
  INFO:          {
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    dot: 'bg-cyan-400',
  },
  WARNING:       {
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    dot: 'bg-amber-400',
  },
  CRITICAL:      {
    badge: 'bg-rose-500/15 text-rose-200 border-rose-500/40 shadow-[0_0_14px_rgba(244,63,94,0.25)]',
    dot: 'bg-rose-400 animate-pulse',
  },
  // Outcome
  success:       {
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    dot: 'bg-emerald-400',
  },
  failure:       {
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    dot: 'bg-rose-400',
  },
  // Default
  default:       {
    badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    dot: 'bg-slate-400',
  },
};

const sizeMap = {
  xs:  'px-2 py-0.5 text-[10px]',
  sm:  'px-2.5 py-0.5 text-[11px]',
  md:  'px-3 py-1 text-xs',
};

export const Badge = ({ variant = 'default', size = 'xs', children, className = '', showDot = true }) => {
  const cfg = variantMap[variant] || variantMap.default;
  const sz  = sizeMap[size] || sizeMap.xs;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono-code font-semibold uppercase tracking-wider leading-none backdrop-blur-sm ${cfg.badge} ${sz} ${className}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      )}
      <span>{children}</span>
    </span>
  );
};
