import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Terminal, 
  Lock, 
  CheckCircle2, 
  ChevronRight
} from 'lucide-react';

/**
 * Telemetry boot stages representing the real cryptographic and architectural
 * security modules within AegisGrid ICS.
 */
const BOOT_TELEMETRY = [
  {
    step: '01',
    module: 'CORE KERNEL',
    label: 'CSPRNG & Cryptographic Primitives',
    status: 'INITIALIZED',
    badge: 'AES-256-GCM',
    detail: 'Cryptographic security providers bound to OS entropy source.',
  },
  {
    step: '02',
    module: 'DATA INTEGRITY',
    label: 'SHA-256 Digest & Avalanche Engine',
    status: 'VERIFIED',
    badge: '256-BIT HASH',
    detail: 'One-way pre-image resistance and Hamming distance analysis ready.',
  },
  {
    step: '03',
    module: 'PKI & IDENTITY',
    label: 'RSA-PSS Signatures & X.509 Chain',
    status: 'AUTHENTICATED',
    badge: 'RSA-2048 / PSS',
    detail: 'Local X.509 localhost root loaded; mutual identity handshake active.',
  },
  {
    step: '04',
    module: 'ACCESS CONTROL',
    label: 'Zero-Trust RBAC & 802.1X Admission',
    status: 'ENFORCED',
    badge: 'POLP ENGINE',
    detail: 'Least privilege authorization matrix and tamper ledger synchronized.',
  },
  {
    step: '05',
    module: 'TRANSPORT SEC',
    label: 'TLS 1.3 Encrypted Socket (Port 8443)',
    status: 'ESTABLISHED',
    badge: 'TLSv1.3 READY',
    detail: 'Strict hostname validation & cipher suite TLS_AES_256_GCM_SHA384.',
  },
];

export const AegisEntrySequence = ({ onComplete, forcePlay = false }) => {
  // Check if reduced motion is requested
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => prefersReducedMotion && !forcePlay);

  const completionRef = useRef(prefersReducedMotion && !forcePlay);

  const handleFinish = useCallback(() => {
    if (completionRef.current) return;
    completionRef.current = true;
    setIsUnlocked(true);

    // Record in sessionStorage so it doesn't replay automatically on refresh in same session
    try {
      sessionStorage.setItem('aegisgrid_session_booted', 'true');
    } catch {
      // Ignore storage restrictions
    }

    // Begin cinematic fade-out
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsDismissed(true);
        if (onComplete) onComplete();
      }, 500);
    }, 450);
  }, [onComplete]);

  // Notify onComplete immediately if reduced motion was initialized
  useEffect(() => {
    if (prefersReducedMotion && !forcePlay) {
      if (onComplete) onComplete();
    }
  }, [prefersReducedMotion, forcePlay, onComplete]);

  // Keyboard shortcut (ESC, Space, Enter) to instantly enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  // Run the timed boot telemetry sequence
  useEffect(() => {
    if (isDismissed || prefersReducedMotion) return;

    // Sequence stages smoothly across ~1.6s
    const stageTimers = [];
    const stepDuration = 280;

    BOOT_TELEMETRY.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setActiveStage(idx + 1);
        setProgress(Math.round(((idx + 1) / BOOT_TELEMETRY.length) * 100));
      }, (idx + 1) * stepDuration);
      stageTimers.push(timer);
    });

    // Complete sequence shortly after last stage
    const finishTimer = setTimeout(() => {
      handleFinish();
    }, (BOOT_TELEMETRY.length + 1) * stepDuration + 120);
    stageTimers.push(finishTimer);

    return () => {
      stageTimers.forEach(clearTimeout);
    };
  }, [handleFinish, isDismissed, prefersReducedMotion]);

  if (isDismissed) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#06080d] text-slate-100 select-none overflow-hidden transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 filter blur-sm pointer-events-none' : 'opacity-100 scale-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="AegisGrid ICS System Boot & Cryptographic Initialization"
    >
      {/* ── High-Tech Cyber Grid Background & Coordinate Crosshairs ── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      
      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_45%,rgba(6,182,212,0.12),transparent_75%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_35%_at_50%_100%,rgba(16,185,129,0.06),transparent_65%)] pointer-events-none" />

      {/* Subtle Tactical Coordinate Marks */}
      <div className="absolute top-6 left-6 font-mono-code text-[10px] text-cyan-400/60 hidden sm:flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>NODE: SCADA-CENTRAL-01 // LAT: 41.8781°N // LON: 87.6298°W</span>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-3">
        <div className="font-mono-code text-[10px] text-slate-400/70 hidden sm:block">
          SECURE PROTOCOL: TLS 1.3
        </div>
        {/* Skip / Bypass Button */}
        <button
          onClick={handleFinish}
          className="group px-3 py-1.5 rounded-lg bg-[#0e1422]/90 hover:bg-[#162035] border border-[#1f2d47] hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-xs font-mono-code flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md cursor-pointer"
          title="Bypass Boot Animation (ESC)"
        >
          <span>ENTER COMMAND</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 group-hover:text-cyan-300 border border-slate-700">ESC</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="absolute bottom-6 left-6 font-mono-code text-[10px] text-slate-500 hidden sm:block">
        AUTHENTICATION: ZERO TRUST // AES-256-GCM AEAD
      </div>
      <div className="absolute bottom-6 right-6 font-mono-code text-[10px] text-slate-500 hidden sm:block">
        BUILD 2026.4 // ICS SECURITY PLATFORM
      </div>

      {/* ── Main Center Console ── */}
      <div className="relative z-10 w-full max-w-xl mx-4 p-6 sm:p-8 rounded-2xl bg-[#0a0e18]/80 border border-[#1a273e] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.1)] backdrop-blur-2xl">
        
        {/* Tactical Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm pointer-events-none" />

        {/* ── Centerpiece Icon & Emblem ── */}
        <div className="flex flex-col items-center text-center">
          
          {/* Hex Emblem with Rotating Radar Rings */}
          <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
            
            {/* Outer Rotating Dotted Cyber Ring */}
            <div 
              className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30 aegis-radar-spin pointer-events-none" 
            />

            {/* Middle Counter-Rotating Precision Ring */}
            <div 
              className="absolute inset-1.5 rounded-full border border-cyan-400/20 aegis-radar-counter-spin pointer-events-none" 
            />

            {/* Glowing Volumetric Aura */}
            <div 
              className={`absolute inset-2 rounded-full blur-xl transition-all duration-500 ${
                isUnlocked ? 'bg-emerald-500/30' : 'bg-cyan-500/25'
              }`} 
            />

            {/* Hexagonal Core */}
            <div 
              className={`relative w-14 h-14 brand-hex flex items-center justify-center transition-all duration-300 shadow-2xl ${
                isUnlocked 
                  ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/40 scale-105' 
                  : 'bg-gradient-to-br from-cyan-400 via-sky-500 to-teal-500 shadow-cyan-500/30'
              }`}
            >
              {/* Scanline Sweep inside Hex */}
              <div className="absolute inset-0 aegis-laser-scan opacity-60 pointer-events-none" />
              
              {isUnlocked ? (
                <ShieldCheck className="w-7 h-7 text-slate-950 font-extrabold relative z-10 animate-fade-in" strokeWidth={2.8} />
              ) : (
                <Zap className="w-7 h-7 text-slate-950 font-extrabold relative z-10" strokeWidth={2.8} />
              )}
            </div>

            {/* Pulse Indicator Ping */}
            <span 
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0e18] transition-colors duration-300 ${
                isUnlocked ? 'bg-emerald-400 live-indicator text-emerald-400' : 'bg-cyan-400 live-indicator text-cyan-400'
              }`} 
            />
          </div>

          {/* Platform Identity */}
          <div className="space-y-1.5 mb-6">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.2em] text-white uppercase font-mono-code leading-none">
                AegisGrid
              </h1>
              <span className="text-xs font-mono-code font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm">
                ICS
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-mono-code text-slate-400 tracking-[0.14em] uppercase">
              Industrial Control System Security Platform
            </p>
          </div>

          {/* ── Telemetry Progress Calibration Bar ── */}
          <div className="w-full mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isUnlocked 
                    ? 'SECURITY CLEARANCE GRANTED' 
                    : activeStage > 0 
                    ? `INITIALIZING TIERS [${activeStage}/${BOOT_TELEMETRY.length}]`
                    : 'BOOTSTRAPPING CRYPTO ENGINE...'}
                </span>
              </span>
              <span className={`font-bold ${isUnlocked ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {progress}%
              </span>
            </div>

            {/* Segmented Cyber Progress Track */}
            <div className="relative h-2 w-full rounded-full bg-[#121927] border border-[#1f2b42] overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                    : 'bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* ── Real-Time Telemetry Feed Window ── */}
          <div className="w-full bg-[#070a10] border border-[#182338] rounded-xl p-3.5 text-left font-mono-code space-y-2 shadow-inner">
            <div className="flex items-center justify-between border-b border-[#141d2e] pb-1.5 text-[10px] text-slate-500 uppercase tracking-wider">
              <span>Security Subsystem Verification</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                LIVE STREAM
              </span>
            </div>

            <div className="space-y-1.5 min-h-[105px]">
              {BOOT_TELEMETRY.map((item, idx) => {
                const isItemActive = idx < activeStage;
                const isCurrent = idx === activeStage - 1;

                return (
                  <div 
                    key={item.step}
                    className={`flex items-center justify-between text-[11px] transition-all duration-300 ${
                      isItemActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-25 translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[10px] ${isItemActive ? 'text-cyan-400' : 'text-slate-600'}`}>
                        [{item.step}]
                      </span>
                      <span className={`${isCurrent ? 'text-white font-semibold' : 'text-slate-300'} truncate`}>
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 hidden sm:inline">
                        {item.badge}
                      </span>
                      {isItemActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>OK</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono-code">WAIT</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Guidance Footer */}
          <div className="mt-4 flex items-center justify-between w-full text-[10px] font-mono-code text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-400/80" />
              <span>DEFENSE-IN-DEPTH ENFORCED</span>
            </span>
            <span className="text-slate-400">
              PRESS <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> TO FAST-TRACK
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
