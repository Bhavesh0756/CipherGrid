import React, { useEffect, useState, useRef } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import {
  Shield,
  ShieldCheck,
  Lock,
  Cpu,
  Key,
  Radio,
  Zap,
  Volume2,
  VolumeX,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  Fingerprint
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface BootStep {
  id: number;
  label: string;
  sub: string;
  threshold: number;
  icon: React.ReactNode;
}

const BOOT_STEPS: BootStep[] = [
  {
    id: 1,
    label: 'PURDUE MODEL HIERARCHY',
    sub: 'ISA-95 Levels 0 to 3.5 Bus Matrix',
    threshold: 18,
    icon: <Layers className="w-3.5 h-3.5 text-blue-400" />
  },
  {
    id: 2,
    label: 'AES-256-GCM AEAD ENGINE',
    sub: '96-bit Nonce & 128-bit MAC Tag Authenticator',
    threshold: 40,
    icon: <Lock className="w-3.5 h-3.5 text-cyan-400" />
  },
  {
    id: 3,
    label: 'RSA-PSS 2048-BIT SIGNATURES',
    sub: 'Asymmetric MGF1 Probabilistic Verification',
    threshold: 65,
    icon: <Key className="w-3.5 h-3.5 text-indigo-400" />
  },
  {
    id: 4,
    label: 'ZERO-TRUST INDUSTRIAL RBAC',
    sub: 'Principle of Least Privilege Admission Filter',
    threshold: 85,
    icon: <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
  },
  {
    id: 5,
    label: 'CIPHERGRID DEFENSE GRID',
    sub: 'SCADA Nodes Online & Defense Bus Synchronized',
    threshold: 100,
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
  }
];

export const EntryAnimation: React.FC = () => {
  const { showIntroAnimation, setShowIntroAnimation } = useSimulatorStore();
  const [progress, setProgress] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [hashStream, setHashStream] = useState<string>('0x7F...INIT');

  const rootRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle procedural cyber audio blips
  const playCyberChime = (freq: number, type: OscillatorType = 'sine', duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Exit transition orchestrated by Anime.js
  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    playCyberChime(880, 'triangle', 0.25);

    if (rootRef.current) {
      animate(rootRef.current, {
        opacity: [1, 0],
        scale: [1, 1.04],
        duration: 500,
        ease: 'inCubic',
        onComplete: () => {
          setShowIntroAnimation(false);
          setIsExiting(false);
          setProgress(0);
        }
      });
    } else {
      setShowIntroAnimation(false);
    }
  };

  // Escape / Space key listener to skip immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntroAnimation && (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter')) {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntroAnimation, isExiting]);

  // Main Anime.js Orchestration
  useEffect(() => {
    if (!showIntroAnimation) return;

    setProgress(0);
    setIsExiting(false);

    // Continuous random hash ticker
    const hashInterval = setInterval(() => {
      const hex = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 16).toString(16).toUpperCase()
      ).join('');
      setHashStream(`0x${hex}...SHA256`);
    }, 110);

    // 1. Anime.js Timeline for entrance & choreography
    const tl = createTimeline({
      defaults: {
        ease: 'outExpo'
      }
    });

    // Fade & slide in HUD
    tl.add('.hud-element', {
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 500,
      delay: stagger(60)
    });

    // SVG Shield Path Draw
    tl.add(
      '.svg-shield-path',
      {
        strokeDashoffset: [280, 0],
        duration: 1100,
        ease: 'inOutQuart'
      },
      '-=350'
    );

    // Staggered brand letters
    tl.add(
      '.brand-char',
      {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.7, 1],
        duration: 750,
        delay: stagger(40)
      },
      '-=700'
    );

    // Subtitle & badge
    tl.add(
      '.brand-sub',
      {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 500
      },
      '-=350'
    );

    // Boot Diagnostic list items
    tl.add(
      '.boot-row',
      {
        opacity: [0, 1],
        translateX: [-15, 0],
        duration: 400,
        delay: stagger(90)
      },
      '-=450'
    );

    // 2. Smooth progress counter interpolation from 0 to 100
    const progressObj = { count: 0 };
    animate(progressObj, {
      count: 100,
      round: 1,
      duration: 2500,
      ease: 'inOutQuad',
      onUpdate: () => {
        const val = Math.floor(progressObj.count);
        setProgress(val);
        if (val === 20 || val === 45 || val === 70 || val === 90) {
          playCyberChime(350 + val * 4, 'sine', 0.04);
        }
      },
      onComplete: () => {
        playCyberChime(784, 'triangle', 0.22);

        // Flash pulse on shield core
        if (shieldRef.current) {
          animate(shieldRef.current, {
            scale: [1, 1.12, 1],
            boxShadow: [
              '0 0 30px rgba(6,182,212,0.3)',
              '0 0 60px rgba(52,211,153,0.7)',
              '0 0 35px rgba(52,211,153,0.4)'
            ],
            duration: 600,
            ease: 'outElastic(1, .5)'
          });
        }

        // Auto exit after brief pause
        setTimeout(() => {
          handleExit();
        }, 850);
      }
    });

    // 3. Continuous precision ring rotations
    animate('.anime-ring-outer', {
      rotate: 360,
      duration: 20000,
      loop: true,
      ease: 'linear'
    });

    animate('.anime-ring-inner', {
      rotate: -360,
      duration: 14000,
      loop: true,
      ease: 'linear'
    });

    return () => {
      clearInterval(hashInterval);
    };
  }, [showIntroAnimation]);

  if (!showIntroAnimation) return null;

  const brandTitle = 'CIPHERGRID';

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-[#050811] text-slate-100 select-none"
    >
      {/* ─── Ambient Cyber Gradients & Radial Flares ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -top-32 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Blueprint Circuit Matrix Grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #38bdf8 1px, transparent 1px),
              linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Scanning horizontal light beam */}
        <div className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-transparent animate-scanline pointer-events-none" />
      </div>

      {/* ─── Top Telemetry Bar & Controls ─── */}
      <header className="hud-element relative z-10 w-full px-6 py-2.5 sm:py-3 flex items-center justify-between text-xs font-mono border-b border-slate-800/60 backdrop-blur-md bg-[#050811]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold tracking-wider text-[11px] sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>CIPHERGRID OS // v2.4</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">OT PERIMETER: ARMED</span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-slate-400 font-mono hidden md:inline text-[11px]">{hashStream}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playCyberChime(587.33, 'sine', 0.15);
            }}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Cyber Audio'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px]">AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-slate-500" />
                <span className="text-[10px]">MUTED</span>
              </>
            )}
          </button>

          {/* Quick Skip Button */}
          <button
            onClick={handleExit}
            className="group flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 shadow-sm transition-all duration-200 cursor-pointer"
          >
            <span className="font-semibold text-xs tracking-wide">ENTER LAB</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-[9px] text-cyan-300 font-mono">
              ESC
            </span>
            <ArrowRight className="w-3 h-3 text-cyan-400 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* ─── Center Hero Hologram & Emblem ─── */}
      <main className="relative z-10 flex flex-col items-center justify-center max-w-xl mx-auto px-4 text-center my-auto py-2 sm:py-4">
        {/* Holographic Concentric Precision Rings with Anime.js rotations */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-2 sm:mb-3">
          {/* Outer rotating reticle ring */}
          <svg className="anime-ring-outer absolute inset-0 w-full h-full opacity-60 text-cyan-500/40" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="8 6 24 6 4 10"
            />
            <circle
              cx="100"
              cy="100"
              r="86"
              fill="none"
              stroke="rgba(59, 130, 246, 0.25)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
            <line x1="100" y1="2" x2="100" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="100" y1="190" x2="100" y2="198" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="100" x2="10" y2="100" stroke="currentColor" strokeWidth="2" />
            <line x1="190" y1="100" x2="198" y2="100" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Inner counter-rotating ring */}
          <svg className="anime-ring-inner absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] opacity-70 text-blue-400/50" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeDasharray="40 30 15 25"
            />
          </svg>

          {/* Central Shield Hologram Core with Anime.js SVG stroke path drawing */}
          <div
            ref={shieldRef}
            className="shield-core relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-slate-900/95 via-[#0a1224] to-slate-900/95 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.3)] backdrop-blur-xl group cursor-pointer transition-transform duration-300 hover:scale-105"
          >
            {/* SVG Shield Path drawn by Anime.js */}
            <svg className="absolute inset-0 w-full h-full p-2.5 sm:p-3 pointer-events-none" viewBox="0 0 100 100">
              <path
                className="svg-shield-path"
                d="M50 8 L84 20 L84 48 C84 72 50 92 50 92 C50 92 16 72 16 48 L16 20 Z"
                fill="none"
                stroke="url(#shieldGrad)"
                strokeWidth="2.5"
                strokeDasharray="280"
                strokeDashoffset="280"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Center Icon based on progress */}
            <div className="relative z-20 flex items-center justify-center">
              {progress >= 100 ? (
                <ShieldCheck className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
              ) : progress >= 65 ? (
                <Shield className="w-9 h-9 sm:w-10 sm:h-10 text-cyan-400 drop-shadow-[0_0_16px_rgba(6,182,212,0.8)]" />
              ) : progress >= 35 ? (
                <Lock className="w-8 h-8 sm:w-9 sm:h-9 text-blue-400 drop-shadow-[0_0_16px_rgba(59,130,246,0.8)]" />
              ) : (
                <Cpu className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-400 drop-shadow-[0_0_16px_rgba(99,102,241,0.8)]" />
              )}
            </div>

            {/* Micro corner brackets */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-400/80" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400/80" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400/80" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyan-400/80" />
          </div>
        </div>

        {/* ─── Anime.js Staggered Brand Title Reveal ─── */}
        <div className="space-y-1 mb-2 sm:mb-2.5">
          <div className="brand-sub inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            <Zap className="w-2.5 h-2.5 text-cyan-400" />
            <span>OPERATIONAL TECHNOLOGY CYBERSECURITY ENGINE</span>
          </div>

          {/* Staggered Letter Reveal */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.35)] font-display overflow-hidden py-0.5">
            {brandTitle.split('').map((char, index) => (
              <span key={index} className="brand-char inline-block">
                {char}
              </span>
            ))}
          </h1>

          <p className="brand-sub text-[11px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase">
            Secure Industrial Control System Communication Simulator
          </p>
        </div>

        {/* ─── High Precision Progress Bar ─── */}
        <div className="w-full max-w-md mb-2 sm:mb-2.5">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Activity className="w-3 h-3 text-cyan-400" />
              SYSTEM INITIALIZATION
            </span>
            <span className="text-cyan-400 font-bold tracking-wider text-xs">
              {progress.toString().padStart(3, '0')}%
            </span>
          </div>

          {/* Segmented Progress Track */}
          <div className="h-1.5 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 p-[1px] shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(6,182,212,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1 px-0.5">
            <span>PURDUE_L0</span>
            <span>AES_GCM_256</span>
            <span>RSA_PSS_AUTH</span>
            <span>RBAC_POLICY</span>
            <span>ONLINE</span>
          </div>
        </div>

        {/* ─── Diagnostic Boot Sequence Terminal Feed (Compact & Responsive) ─── */}
        <div className="w-full max-w-md bg-slate-950/85 rounded-lg border border-slate-800/80 p-2 sm:p-2.5 text-left font-mono backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[9px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>DIAGNOSTIC SUBSYSTEM CHECKS</span>
            </div>
            <span className="text-emerald-400 font-semibold">ALL SENSORS NORMAL</span>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            {BOOT_STEPS.map((step) => {
              const isDone = progress >= step.threshold;
              const isActive = progress < step.threshold && progress >= step.threshold - 25;

              return (
                <div
                  key={step.id}
                  className={`boot-row flex items-center justify-between text-[10px] py-0.5 px-1.5 rounded transition-colors ${
                    isDone
                      ? 'bg-slate-900/50 text-slate-300'
                      : isActive
                      ? 'bg-cyan-950/40 text-cyan-300 border-l-2 border-cyan-400'
                      : 'text-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{step.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold tracking-wide truncate">{step.label}</div>
                      <div className="text-[8.5px] text-slate-400 truncate">{step.sub}</div>
                    </div>
                  </div>

                  <span
                    className={`ml-2 px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    {isDone ? '[ VERIFIED ]' : isActive ? '[ LOADING ]' : '[ PENDING ]'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ─── Bottom Footer & Key Hints ─── */}
      <footer className="hud-element relative z-10 w-full px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/60 bg-[#050811]/70 backdrop-blur-md gap-1 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Radio className="w-3 h-3 text-cyan-400" />
            MODBUS TCP / DNP3 / CIP PROTOCOL ACTIVE
          </span>
          <span className="hidden md:inline text-slate-700">•</span>
          <span className="hidden md:inline text-slate-400">14 INDUSTRIAL OT NODES WIRED</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            Press <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 border border-slate-700">Space</kbd> or{' '}
            <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd> to skip intro
          </span>
        </div>
      </footer>
    </div>
  );
};
