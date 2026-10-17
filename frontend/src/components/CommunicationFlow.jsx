import React, { useState } from 'react';
import { Cpu, ShieldCheck, Server, ArrowRight, Lock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

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
      bg: 'bg-[#0d2235]/60',
      badge: 'Level 1-2',
      description: 'Generates telemetry (temperature, pressure, RPM) from software virtual devices. Encapsulates device identity and prepares encrypted payload.',
    },
    {
      id: 'admission',
      num: '02',
      title: 'Policy Enforcement',
      subtitle: 'RBAC · Port Admission · 802.1X',
      icon: ShieldCheck,
      color: 'text-teal-400',
      border: 'border-teal-500/30 hover:border-teal-500/60',
      activeBorder: 'border-teal-400 ring-1 ring-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.2)]',
      bg: 'bg-[#092228]/60',
      badge: 'Admission Guard',
      description: 'SQLite policy decision point evaluates device hardware enrollment and role-related privileges. Dropped packets trigger immediate audit alert.',
    },
    {
      id: 'crypto',
      num: '03',
      title: 'Cryptographic Engine',
      subtitle: 'AES-256-GCM · RSA-PSS · SHA-256',
      icon: Lock,
      color: 'text-sky-400',
      border: 'border-sky-500/30 hover:border-sky-500/60',
      activeBorder: 'border-sky-400 ring-1 ring-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.2)]',
      bg: 'bg-[#091e33]/60',
      badge: 'Zero-Trust Gate',
      description: 'AEAD encryption with fresh 96-bit nonce prevents replay attacks. SHA-256 digest anchors integrity, while RSA-PSS digital signature proves origin.',
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
      bg: 'bg-[#08221f]/60',
      badge: 'Level 3 SCADA',
      description: 'Terminates TLS 1.3 tunnel, verifies digital signature and GHASH authentication tag, ingests telemetry stream, and persists immutable audit trail.',
    },
  ];

  const lastStatus = lastSimulation?.status;

  return (
    <div className="bg-[#0b1524] border border-[#14243b] rounded-2xl p-6 shadow-2xl relative overflow-hidden card-hover">
      {/* ── Background Cyber Constellation Mesh SVG ── */}
      <svg 
        className="absolute top-0 right-0 w-[420px] h-full opacity-20 pointer-events-none" 
        viewBox="0 0 400 200" 
        fill="none"
      >
        <path d="M50 150 L120 80 L200 120 L270 40 L350 90" stroke="#06b6d4" strokeWidth="1" />
        <path d="M120 80 L180 30 L270 40" stroke="#14b8a6" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M200 120 L260 170 L350 90" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M180 30 L200 120 L320 160 L350 90" stroke="#06b6d4" strokeWidth="0.8" />
        <circle cx="50" cy="150" r="3" fill="#06b6d4" />
        <circle cx="120" cy="80" r="3" fill="#14b8a6" />
        <circle cx="180" cy="30" r="2.5" fill="#38bdf8" />
        <circle cx="200" cy="120" r="3.5" fill="#06b6d4" />
        <circle cx="270" cy="40" r="3" fill="#2dd4bf" />
        <circle cx="260" cy="170" r="2.5" fill="#0ea5e9" />
        <circle cx="320" cy="160" r="2.5" fill="#14b8a6" />
        <circle cx="350" cy="90" r="3.5" fill="#06b6d4" />
      </svg>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-mono-code uppercase tracking-[0.16em] text-teal-400 font-bold">
              INTERACTIVE PIPELINE
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
          <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono-code shadow-lg ${
            lastStatus === 'ACCEPTED'
              ? 'bg-[#092224] text-teal-300 border-teal-500/40'
              : 'bg-[#2a1018] text-rose-300 border-rose-500/40'
          }`}>
            {lastStatus === 'ACCEPTED' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-bold">{lastStatus}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">{lastSimulation.device_id}</span>
          </div>
        )}
      </div>

      {/* Grid of Steps matching Reference 4-Stage Horizontal Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 relative z-10">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <div key={step.id} className="relative flex items-stretch">
              <button
                onClick={() => setActiveStep(isSelected ? null : step.id)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `${step.bg} ${step.activeBorder}`
                    : `bg-[#0c1626] border-[#14243b] ${step.border} hover:bg-[#0f1b2e]`
                }`}
              >
                <div>
                  {/* Top Header: Icon + Tier badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-[#08101c] border border-[#162740] ${step.color} shadow-inner`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-md bg-[#08101c] border border-[#162740] text-slate-400">
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
                </div>

                {/* Bottom micro badge matching reference: "Level 1-2" on left, "Inspect →" on right */}
                <div className="mt-4 pt-2.5 border-t border-[#14243b] flex items-center justify-between text-[10px]">
                  <span className={`font-mono-code font-medium ${step.color}`}>{step.badge}</span>
                  <span className="text-slate-500 group-hover:text-cyan-300 transition-colors font-medium">Inspect →</span>
                </div>
              </button>

              {/* Connecting Arrow between pipeline cards */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-[#08101c] border border-[#162740] flex items-center justify-center text-slate-400 shadow-sm">
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
        <div className="mt-4 p-4 rounded-xl bg-[#08101c] border border-cyan-500/40 text-xs flex items-start gap-3 animate-fade-in relative shadow-xl shadow-cyan-950/20">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {steps.find(s => s.id === activeStep)?.title}
              </span>
              <span className="text-[10px] font-mono-code text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                {steps.find(s => s.id === activeStep)?.badge}
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              {steps.find(s => s.id === activeStep)?.description}
            </p>
          </div>
          <button
            onClick={() => setActiveStep(null)}
            className="text-slate-400 hover:text-white px-2 py-1 rounded bg-[#0c1626] border border-[#162740] hover:bg-[#112036] text-xs transition-colors shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
