import React from 'react';

const colorConfig = {
  cyan: {
    icon: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    bar: 'from-cyan-400 to-sky-500',
    val: 'text-white drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    glow: 'shadow-cyan-950/20 hover:border-cyan-500/40',
    topGlow: 'bg-cyan-500/10',
  },
  emerald: {
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    bar: 'from-emerald-400 to-teal-500',
    val: 'text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    glow: 'shadow-emerald-950/20 hover:border-emerald-500/40',
    topGlow: 'bg-emerald-500/10',
  },
  sky: {
    icon: 'text-sky-400',
    iconBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    bar: 'from-sky-400 to-blue-500',
    val: 'text-white drop-shadow-[0_0_12px_rgba(14,165,233,0.3)]',
    glow: 'shadow-sky-950/20 hover:border-sky-500/40',
    topGlow: 'bg-sky-500/10',
  },
  rose: {
    icon: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    bar: 'from-rose-400 to-red-500',
    val: 'text-rose-200 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    glow: 'shadow-rose-950/20 hover:border-rose-500/40',
    topGlow: 'bg-rose-500/10',
  },
  amber: {
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    bar: 'from-amber-400 to-orange-500',
    val: 'text-amber-200 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    glow: 'shadow-amber-950/20 hover:border-amber-500/40',
    topGlow: 'bg-amber-500/10',
  },
  teal: {
    icon: 'text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    bar: 'from-teal-400 to-emerald-500',
    val: 'text-white drop-shadow-[0_0_12px_rgba(20,184,166,0.3)]',
    glow: 'shadow-teal-950/20 hover:border-teal-500/40',
    topGlow: 'bg-teal-500/10',
  },
  blue: {
    icon: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    bar: 'from-blue-400 to-indigo-500',
    val: 'text-white drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]',
    glow: 'shadow-blue-950/20 hover:border-blue-500/40',
    topGlow: 'bg-blue-500/10',
  },
  violet: {
    icon: 'text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    bar: 'from-violet-400 to-purple-500',
    val: 'text-white drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]',
    glow: 'shadow-violet-950/20 hover:border-violet-500/40',
    topGlow: 'bg-violet-500/10',
  },
};

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', className = '' }) => {
  const cfg = colorConfig[color] || colorConfig.cyan;

  return (
    <div className={`relative bg-[#0e1320]/85 border border-[#1c263c] rounded-xl p-4 flex flex-col justify-between gap-3 card-hover shadow-lg backdrop-blur-md overflow-hidden ${cfg.glow} ${className}`}>
      {/* Top Precision Accent Micro-Bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg.bar} opacity-75`} />

      {/* Ambient Radial Corner Glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${cfg.topGlow} blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none`} />

      <div className="flex items-center justify-between relative z-10">
        <div className={`p-2 rounded-lg border ${cfg.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600/60" />
      </div>

      <div className="relative z-10">
        <div className={`text-2xl font-bold font-mono-code tracking-tight leading-none stat-value ${cfg.val}`}>
          {value}
        </div>
        <div className="text-xs font-semibold text-slate-200 mt-1.5 leading-snug">
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono-code truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
