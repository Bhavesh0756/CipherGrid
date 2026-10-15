import React, { useState } from 'react';
import { Cpu, ShieldCheck, Server, ArrowRight, Lock, Key, FileCheck, CheckCircle2 } from 'lucide-react';

export const CommunicationFlow = ({ lastSimulation = null }) => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 'device',
      title: '1. Virtual Device',
      subtitle: 'Field Node (PLC / Sensor)',
      icon: Cpu,
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
      description: 'Generates telemetry (Temperature °C, Pressure PSI, RPM). Holds local identity and requests transmission.',
    },
    {
      id: 'admission',
      title: '2. Access & Admission',
      subtitle: 'RBAC & 802.1X Check',
      icon: ShieldCheck,
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
      description: 'Evaluates device enrollment status (Authorized) and role privileges (Least Privilege). Blocks unauthorized commands.',
    },
    {
      id: 'crypto',
      title: '3. Cryptographic Layer',
      subtitle: 'AES-GCM & RSA-PSS',
      icon: Lock,
      color: 'border-teal-500/40 bg-teal-950/20 text-teal-400',
      description: 'Payload encrypted via AES-256-GCM with fresh 96-bit nonce. Integrity guaranteed by SHA-256 and RSA-PSS signature.',
    },
    {
      id: 'server',
      title: '4. Monitoring Server',
      subtitle: 'SCADA Central Controller',
      icon: Server,
      color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400',
      description: 'Verifies digital signature and authentication tag, logs audit trail, and renders live process telemetry.',
    },
  ];

  return (
    <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            End-to-End Secure ICS Communication Flow
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic and Access Control Pipeline: Device → Security Policy → Cryptography → SCADA Controller
          </p>
        </div>
        {lastSimulation && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-mono-code border ${
            lastSimulation.status === 'ACCEPTED' 
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-950/50 text-rose-300 border-rose-500/30'
          }`}>
            Last Msg: {lastSimulation.status} ({lastSimulation.device_id})
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(isSelected ? null : step.id)}
              className={`p-4 rounded-lg border transition-all cursor-pointer relative ${
                isSelected ? `${step.color} ring-1 ring-cyan-400/50` : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-md bg-slate-800/60 text-slate-300">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                {idx < steps.length - 1 && (
                  <ArrowRight className="hidden md:block w-4 h-4 text-slate-600 absolute -right-2.5 top-1/2 -translate-y-1/2 z-10" />
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-200">{step.title}</h4>
              <p className="text-[11px] text-cyan-400/90 font-mono-code mt-0.5">{step.subtitle}</p>
              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {activeStep && (
        <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Selected:</strong> {steps.find(s => s.id === activeStep)?.title} — {steps.find(s => s.id === activeStep)?.description}
            </span>
          </div>
          <button 
            onClick={() => setActiveStep(null)} 
            className="text-xs text-slate-500 hover:text-slate-300 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
