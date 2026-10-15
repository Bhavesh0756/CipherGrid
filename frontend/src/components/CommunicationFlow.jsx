import React, { useState } from 'react';
import { Cpu, ShieldCheck, Server, ArrowRight, Lock, CheckCircle2, XCircle } from 'lucide-react';

export const CommunicationFlow = ({ lastSimulation = null }) => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 'device',
      num: '01',
      title: 'Virtual Device',
      subtitle: 'Field Node (PLC / RTU / Sensor)',
      icon: Cpu,
      accent: 'text-blue-400',
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/20',
      ring: 'ring-blue-500/40',
      description: 'Generates synthetic industrial telemetry — temperature, pressure, RPM. Holds local device identity and requests transmission via the SCADA gateway.',
    },
    {
      id: 'admission',
      num: '02',
      title: 'Policy Enforcement',
      subtitle: 'RBAC · Admission · 802.1X',
      icon: ShieldCheck,
      accent: 'text-sky-400',
      border: 'border-sky-500/30',
      bg: 'bg-sky-950/20',
      ring: 'ring-sky-500/40',
      description: 'Evaluates device enrollment status and role-based privileges. Enforces principle of least privilege — unauthorized commands are dropped and logged.',
    },
    {
      id: 'crypto',
      num: '03',
      title: 'Cryptographic Layer',
      subtitle: 'AES-256-GCM · RSA-PSS · SHA-256',
      icon: Lock,
      accent: 'text-violet-400',
      border: 'border-violet-500/30',
      bg: 'bg-violet-950/20',
      ring: 'ring-violet-500/40',
      description: 'Payload encrypted via AES-256-GCM with fresh 96-bit nonce. Integrity anchored by SHA-256 digest and RSA-PSS digital signature.',
    },
    {
      id: 'server',
      num: '04',
      title: 'Monitoring Server',
      subtitle: 'SCADA Central Controller',
      icon: Server,
      accent: 'text-teal-400',
      border: 'border-teal-500/30',
      bg: 'bg-teal-950/20',
      ring: 'ring-teal-500/40',
      description: 'Verifies digital signature and authentication tag over TLS 1.3, renders live telemetry, and writes tamper-evident audit trail to SQLite.',
    },
  ];

  const lastStatus = lastSimulation?.status;

  return (
    <div className="bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 card-hover">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            End-to-End Secure Communication Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Device → Policy Enforcement → Cryptography → SCADA Controller
          </p>
        </div>
        {lastSimulation && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono-code ${
            lastStatus === 'ACCEPTED'
              ? 'alert-success text-emerald-300'
              : 'alert-critical text-rose-300'
          }`}>
            {lastStatus === 'ACCEPTED'
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              : <XCircle className="w-3.5 h-3.5 text-rose-400" />
            }
            <span>{lastStatus}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{lastSimulation.device_id}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <div key={step.id} className="relative flex items-stretch gap-2">
              <button
                onClick={() => setActiveStep(isSelected ? null : step.id)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all duration-200 group ${
                  isSelected
                    ? `${step.bg} ${step.border} ring-1 ${step.ring} shadow-lg`
                    : `bg-[#080f1e]/80 border-[#1a2844] hover:${step.border} hover:${step.bg}`
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${step.bg} border ${step.border}`}>
                    <Icon className={`w-4 h-4 ${step.accent}`} />
                  </div>
                  <span className={`text-[10px] font-mono-code font-bold ${step.accent} opacity-60`}>
                    {step.num}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 leading-snug">{step.title}</h4>
                <p className={`text-[10px] font-mono-code mt-0.5 ${step.accent} opacity-80`}>{step.subtitle}</p>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {step.description}
                </p>
              </button>

              {/* Arrow connector */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeStep && (
        <div className="mt-4 p-3.5 rounded-lg alert-info text-xs flex items-start gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-sky-300">
              {steps.find(s => s.id === activeStep)?.title}
            </span>
            <p className="text-slate-300 mt-1 leading-relaxed">
              {steps.find(s => s.id === activeStep)?.description}
            </p>
          </div>
          <button
            onClick={() => setActiveStep(null)}
            className="text-slate-500 hover:text-slate-300 text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
