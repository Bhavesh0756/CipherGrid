import React from 'react';

const colorConfig = {
  blue:    { icon: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    val: 'text-blue-200',  glow: 'shadow-blue-900/20'   },
  cyan:    { icon: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    val: 'text-cyan-200',  glow: 'shadow-cyan-900/20'   },
  teal:    { icon: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/30',    val: 'text-teal-200',  glow: 'shadow-teal-900/20'   },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', val: 'text-emerald-200', glow: 'shadow-emerald-900/20' },
  amber:   { icon: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   val: 'text-amber-200', glow: 'shadow-amber-900/20'  },
  rose:    { icon: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    val: 'text-rose-200',  glow: 'shadow-rose-900/20'   },
  violet:  { icon: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  val: 'text-violet-200', glow: 'shadow-violet-900/20' },
  sky:     { icon: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     val: 'text-sky-200',   glow: 'shadow-sky-900/20'    },
};

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', className = '' }) => {
  const cfg = colorConfig[color] || colorConfig.cyan;

  return (
    <div className={`relative bg-[#0c1428]/90 border ${cfg.border} rounded-xl p-4 flex flex-col gap-3 card-hover shadow-lg ${cfg.glow} overflow-hidden ${className}`}>
      {/* Subtle corner glow */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${cfg.bg} blur-2xl rounded-full -mr-6 -mt-6 pointer-events-none`} />

      <div className="flex items-start justify-between relative z-10">
        <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`w-4 h-4 ${cfg.icon}`} />
        </div>
      </div>

      <div className="relative z-10">
        <div className={`text-2xl font-bold tracking-tight leading-none stat-value ${cfg.val}`}>
          {value}
        </div>
        <div className="text-xs font-medium text-slate-300 mt-1 leading-snug">
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono-code truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
