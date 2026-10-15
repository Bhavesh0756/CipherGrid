import React, { useState } from 'react';
import { Cpu, ShieldCheck, Server, ArrowRight, Lock, CheckCircle2, XCircle, Activity, Sparkles } from 'lucide-react';

export const CommunicationFlow = ({ lastSimulation = null }) => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 'device',
      num: '01',
      title: 'Virtual Field Node',
      subtitle: 'PLC · RTU · Smart Sensor',
      icon: Cpu,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      activeBorder: 'border-cyan-400 ring-1 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      bg: 'bg-cyan-500/5',
      badge: 'Level 1-2',
      description: 'Generates synthetic telemetry (temperature, pressure, RPM) from software virtual devices. Encapsulates device identity and prepares encrypted transport payload.',
    },
    {
      id: 'admission',
      num: '02',
      title: 'Policy Enforcement',
      subtitle: 'RBAC · Port Admission · 802.1X',
      icon: ShieldCheck,
      color: 'text-sky-400',
      border: 'border-sky-500/30 hover:border-sky-500/60',
      activeBorder: 'border-sky-400 ring-1 ring-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.2)]',
      bg: 'bg-sky-500/5',
      badge: 'Admission Guard',
      description: 'SQLite policy decision point validates device hardware enrollment and role-based privileges. Dropped packets trigger immediate audit ledger alerts.',
    },
    {
      id: 'crypto',
      num: '03',
      title: 'Cryptographic Engine',
      subtitle: 'AES-256-GCM · RSA-PSS · SHA-256',
      icon: Lock,
      color: 'text-violet-400',
      border: 'border-violet-500/30 hover:border-violet-500/60',
      activeBorder: 'border-violet-400 ring-1 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]',
      bg: 'bg-violet-500/5',
      badge: 'Zero-Trust Gate',
      description: 'AEAD encryption with fresh 96-bit nonce prevents replay attacks. SHA-256 digest anchors integrity, while RSA-PSS digital signature guarantees non-repudiation.',
    },
    {
      id: 'server',
      num: '04',
      title: 'SCADA Master Server',
      subtitle: 'TLS 1.3 Ingress · Audit Ledger',
      icon: Server,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      activeBorder: 'border-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      bg: 'bg-emerald-500/5',
      badge: 'Level 3 SCADA',
      description: 'Terminates TLS 1.3 tunnel, verifies digital signature and GHASH authentication tag, ingests telemetry stream, and persists immutable audit trail to SQLite.',
    },
  ];

  const lastStatus = lastSimulation?.status;

  return (
    <div className="bg-[#0e1320]/85 border border-[#1c263c] rounded-2xl p-6 shadow-xl shadow-black/40 card-hover backdrop-blur-md relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-28 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono-code uppercase tracking-[0.15em] text-cyan-400">
              Interactive Telemetry Pipeline
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            End-to-End Cryptographic Communication Flow
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any processing stage to inspect its industrial security controls and parameters.
          </p>
        </div>

        {lastSimulation && (
          <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono-code backdrop-blur-md shadow-lg ${
            lastStatus === 'ACCEPTED'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20'
              : 'bg-rose-950/40 text-rose-300 border-rose-500/40 shadow-rose-950/20'
          }`}>
            {lastStatus === 'ACCEPTED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-bold">{lastStatus}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">{lastSimulation.device_id}</span>
          </div>
        )}
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 relative z-10">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <div key={step.id} className="relative flex items-stretch">
              <button
                onClick={() => setActiveStep(isSelected ? null : step.id)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${
                  isSelected
                    ? `${step.bg} ${step.activeBorder}`
                    : `bg-[#0a0e18]/80 border-[#1a2336] ${step.border} hover:bg-[#0f1524]`
                }`}
              >
                {/* Top Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-slate-900/90 border border-slate-800 ${step.color} shadow-inner`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                    Tier {step.num}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                  {step.title}
                </h4>
                <div className="text-[10px] font-mono-code mt-0.5 text-slate-400">
                  {step.subtitle}
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                  {step.description}
                </p>

                {/* Bottom micro badge */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className={`font-mono-code ${step.color}`}>{step.badge}</span>
                  <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Inspect →</span>
                </div>
              </button>

              {/* Arrow Connector */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center absolute -right-2.5 top-1/2 -translate-y-1/2 z-20">
                  <div className="w-5 h-5 rounded-full bg-[#0a0e18] border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-sm">
                    <ArrowRight className="w-3 h-3 text-cyan-400/80" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Active Step Context Drawer */}
      {activeStep && (
        <div className="mt-4 p-4 rounded-xl bg-[#0a0e18] border border-cyan-500/30 text-xs flex items-start gap-3 animate-fade-in relative shadow-lg shadow-cyan-950/20">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {steps.find(s => s.id === activeStep)?.title}
              </span>
              <span className="text-[10px] font-mono-code text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                {steps.find(s => s.id === activeStep)?.badge}
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              {steps.find(s => s.id === activeStep)?.description}
            </p>
          </div>
          <button
            onClick={() => setActiveStep(null)}
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-xs transition-colors shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
