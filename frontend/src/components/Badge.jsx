import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const baseClasses = 'inline-flex items-center font-medium font-mono-code rounded-md border';

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[11px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }[size] || 'px-2 py-0.5 text-xs';

  const variantClasses = {
    // Status
    authorized: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    unauthorized: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
    suspended: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
    revoked: 'bg-red-950/50 text-red-400 border-red-500/40',
    
    // Severity
    info: 'bg-blue-950/40 text-blue-300 border-blue-500/30',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
    critical: 'bg-rose-950/50 text-rose-300 border-rose-500/40',

    // Results
    success: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    failure: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
    allow: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    deny: 'bg-rose-950/40 text-rose-300 border-rose-500/30',

    // Protocol / Tech
    cyan: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30',
    teal: 'bg-teal-950/40 text-teal-300 border-teal-500/30',
    indigo: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30',
    default: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
  }[variant.toLowerCase()] || 'bg-slate-800/60 text-slate-300 border-slate-700/50';

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
