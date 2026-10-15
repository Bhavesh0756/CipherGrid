import React from 'react';

const variantMap = {
  // Status variants
  Authorized:    'bg-emerald-950/50 text-emerald-300 border-emerald-500/40',
  Suspended:     'bg-amber-950/50  text-amber-300  border-amber-500/40',
  Unauthorized:  'bg-rose-950/50   text-rose-300   border-rose-500/40',
  Revoked:       'bg-rose-950/70   text-rose-200   border-rose-600/50',
  // Severity
  INFO:          'bg-sky-950/50    text-sky-300    border-sky-500/40',
  WARNING:       'bg-amber-950/50  text-amber-300  border-amber-500/40',
  CRITICAL:      'bg-rose-950/50   text-rose-300   border-rose-500/40',
  // Outcome
  success:       'bg-emerald-950/50 text-emerald-300 border-emerald-500/40',
  failure:       'bg-rose-950/50    text-rose-300    border-rose-500/40',
  // Misc
  default:       'bg-slate-800/80  text-slate-300  border-slate-600/40',
};

const sizeMap = {
  xs:  'px-1.5 py-0.5 text-[10px]',
  sm:  'px-2 py-0.5 text-[11px]',
  md:  'px-2.5 py-1 text-xs',
};

export const Badge = ({ variant = 'default', size = 'xs', children, className = '' }) => {
  const cls = variantMap[variant] || variantMap.default;
  const sz  = sizeMap[size] || sizeMap.xs;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-mono-code font-semibold uppercase tracking-wider leading-none ${cls} ${sz} ${className}`}>
      {children}
    </span>
  );
};
