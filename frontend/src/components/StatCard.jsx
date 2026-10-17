import React from 'react';

const colorConfig = {
  cyan: {
    icon: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    card: 'border-cyan-500/40 bg-[#0a1524]/95 hover:border-cyan-400/60 shadow-[0_4px_20px_rgba(6,182,212,0.1)]',
    val: 'text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    sparkline: (
      <svg className="w-16 h-7 overflow-visible" viewBox="0 0 64 24" fill="none">
        <path d="M2 14 C12 8, 20 18, 32 10 C44 4, 52 14, 62 10" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  emerald: {
    icon: 'text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    card: 'border-teal-500/40 bg-[#091822]/95 hover:border-teal-400/60 shadow-[0_4px_20px_rgba(20,184,166,0.1)]',
    val: 'text-white drop-shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    sparkline: (
      <svg className="w-16 h-7 overflow-visible" viewBox="0 0 64 24" fill="none">
        <path d="M2 16 C14 12, 22 6, 32 14 C42 20, 50 8, 62 10" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  sky: {
    icon: 'text-sky-400',
    iconBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    card: 'border-sky-500/40 bg-[#0a1728]/95 hover:border-sky-400/60 shadow-[0_4px_20px_rgba(14,165,233,0.1)]',
    val: 'text-white drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]',
    sparkline: (
      <svg className="w-16 h-7 overflow-visible" viewBox="0 0 64 24" fill="none">
        <path d="M2 12 L10 16 L18 8 L26 18 L34 6 L42 16 L50 10 L58 14 L62 11" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  rose: {
    icon: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    card: 'border-rose-500/50 bg-[#180d16]/95 hover:border-rose-400/70 shadow-[0_4px_20px_rgba(244,63,94,0.12)]',
    val: 'text-white drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    sparkline: (
      <svg className="w-16 h-7 overflow-visible" viewBox="0 0 64 24" fill="none">
        <path d="M2 15 C14 15, 20 6, 28 6 C36 6, 42 16, 52 13 L62 13" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  amber: {
    icon: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    card: 'border-rose-500/50 bg-[#180d16]/95 hover:border-rose-400/70 shadow-[0_4px_20px_rgba(244,63,94,0.12)]',
    val: 'text-white drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    sparkline: (
      <svg className="w-16 h-7 overflow-visible" viewBox="0 0 64 24" fill="none">
        <path d="M2 16 L38 16 L44 6 L48 18 L54 12 L62 12" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  teal: {
    icon: 'text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    card: 'border-teal-500/40 bg-[#091822]/95 hover:border-teal-400/60 shadow-[0_4px_20px_rgba(20,184,166,0.1)]',
    val: 'text-white drop-shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    sparkline: (
      <div className="flex items-center gap-1.5 pt-1">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
      </div>
    ),
  },
};

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', className = '' }) => {
  const cfg = colorConfig[color] || colorConfig.cyan;

  return (
    <div className={`relative border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xl backdrop-blur-md transition-all duration-200 card-hover ${cfg.card} ${className}`}>
      {/* Top row: Icon on left, sparkline or indicator on right */}
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-2 rounded-xl border ${cfg.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="shrink-0 opacity-90">
          {cfg.sparkline}
        </div>
      </div>

      {/* Bottom row: Value, Title, Subtitle */}
      <div className="relative z-10 pt-1">
        <div className={`text-2xl font-extrabold font-mono-code tracking-tight leading-none ${cfg.val}`}>
          {value}
        </div>
        <div className="text-xs font-semibold text-white mt-1.5 leading-snug">
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
