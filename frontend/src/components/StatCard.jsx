import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, badge, color = 'cyan' }) => {
  const accentColors = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      valueColor: 'text-cyan-400',
    },
    teal: {
      border: 'border-teal-500/20 hover:border-teal-500/40',
      iconBg: 'bg-teal-500/10 text-teal-400',
      valueColor: 'text-teal-400',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      valueColor: 'text-blue-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      valueColor: 'text-amber-400',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      valueColor: 'text-rose-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      valueColor: 'text-emerald-400',
    },
  }[color] || {
    border: 'border-slate-800 hover:border-slate-700',
    iconBg: 'bg-slate-800 text-slate-300',
    valueColor: 'text-slate-100',
  };

  return (
    <div className={`bg-[#0d1629]/90 border ${accentColors.border} rounded-xl p-5 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${accentColors.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tracking-tight font-mono-code ${accentColors.valueColor}`}>
            {value}
          </span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
