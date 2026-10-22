/**
 * EntryAnimation - Ultra-smooth, crazy cyber-industrial boot sequence powered by Anime.js v4 & Canvas Particle Mesh.
 */
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
  Fingerprint,
  Sparkles
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
    sub: 'ISA-95 Levels 0 to 3.5 Bus Matrix Synchronized',
    threshold: 18,
    icon: <Layers className="w-3.5 h-3.5 text-blue-400" />
  },
  {
    id: 2,
    label: 'AES-256-GCM AEAD ENGINE',
    sub: 'Hardware Nonce & 128-bit MAC Tag Initialized',
    threshold: 40,
    icon: <Lock className="w-3.5 h-3.5 text-cyan-400" />
  },
  {
    id: 3,
    label: 'RSA-PSS 2048-BIT SIGNATURES',
    sub: 'Asymmetric MGF1 Probabilistic Authority Verified',
    threshold: 65,
    icon: <Key className="w-3.5 h-3.5 text-indigo-400" />
  },
  {
    id: 4,
    label: 'ZERO-TRUST INDUSTRIAL RBAC',
    sub: 'Principle of Least Privilege Admission Enforced',
    threshold: 85,
    icon: <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
  },
  {
    id: 5,
    label: 'CIPHERGRID DEFENSE GRID',
    sub: 'Virtual SCADA Control Perimeter Online',
    threshold: 100,
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
  }
];

export const EntryAnimation: React.FC = () => {
  const { showIntroAnimation, setShowIntroAnimation } = useSimulatorStore();
  const [progress, setProgress] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isWarpSpeed, setIsWarpSpeed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [hashStream, setHashStream] = useState<string>('0x7F...INIT');
  const [scrambledSubtitle, setScrambledSubtitle] = useState<string>('SECURE INDUSTRIAL CONTROL SYSTEM SIMULATOR');

  const rootRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  // Web Audio API procedural cyber tone synthesizer
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

  // Matrix Scrambler Text Effect
  useEffect(() => {
    if (!showIntroAnimation) return;
    const targetText = 'SECURE INDUSTRIAL CONTROL SYSTEM SIMULATOR';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§ΞжЖ$#@!%&*';
    let iteration = 0;
    const interval = setInterval(() => {
      setScrambledSubtitle(
        targetText
          .split('')
          .map((letter, index) => {
            if (letter === ' ') return ' ';
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      if (iteration >= targetText.length) {
        clearInterval(interval);
      }
      iteration += 1;
    }, 40);

    return () => clearInterval(interval);
  }, [showIntroAnimation]);

  // Interactive 60fps Cyber Particle Mesh Background Canvas
  useEffect(() => {
    if (!showIntroAnimation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor((width * height) / 18000), 75);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 1.8 + 1,
      color: Math.random() > 0.4 ? 'rgba(34, 211, 238, 0.7)' : 'rgba(59, 130, 246, 0.7)'
    }));

    // Shockwave ripple circles
    const ripples: Array<{ x: number; y: number; r: number; opacity: number }> = [];

    const triggerRipple = (x: number, y: number) => {
      ripples.push({ x, y, r: 10, opacity: 0.9 });
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += isWarpSpeed ? 14 : 4.5;
        rp.opacity -= isWarpSpeed ? 0.025 : 0.015;
        if (rp.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${rp.opacity * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isWarpSpeed) {
          // Hyperspace warp effect
          const cx = width / 2;
          const cy = height / 2;
          const dx = p.x - cx;
          const dy = p.y - cy;
          p.x += dx * 0.08 + (dx > 0 ? 3 : -3);
          p.y += dy * 0.08 + (dy > 0 ? 3 : -3);
        } else {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          // Gentle mouse displacement
          const mdx = p.x - mousePos.current.x;
          const mdy = p.y - mousePos.current.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 100) {
            p.x += (mdx / mdist) * 2;
            p.y += (mdy / mdist) * 2;
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connecting lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 120) * 0.18})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    // Trigger central ripple on initial mount
    triggerRipple(width / 2, height / 2);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [showIntroAnimation, isWarpSpeed]);

  // Grand Finale Exit orchestrated with Shockwave & Warp
  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setIsWarpSpeed(true);
    playCyberChime(987.77, 'triangle', 0.35);

    if (rootRef.current) {
      animate(rootRef.current, {
        opacity: [1, 0],
        scale: [1, 1.08],
        filter: ['blur(0px)', 'blur(16px)'],
        duration: 650,
        ease: 'inExpo',
        onComplete: () => {
          setShowIntroAnimation(false);
          setIsExiting(false);
          setIsWarpSpeed(false);
          setProgress(0);
        }
      });
    } else {
      setShowIntroAnimation(false);
    }
  };

  // Keyboard shortcut (Escape, Space, Enter) for instant bypass
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

  // Main Anime.js Animation Choreography
  useEffect(() => {
    if (!showIntroAnimation) return;

    setProgress(0);
    setIsExiting(false);
    setIsWarpSpeed(false);

    // Random hash stream ticker
    const hashInterval = setInterval(() => {
      const hex = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 16).toString(16).toUpperCase()
      ).join('');
      setHashStream(`0x${hex}...SHA256`);
    }, 95);

    // Timeline for cinematic entrance
    const tl = createTimeline({
      defaults: {
        ease: 'outExpo'
      }
    });

    // 1. HUD Entrance
    tl.add('.hud-element', {
      opacity: [0, 1],
      translateY: [-14, 0],
      duration: 600,
      delay: stagger(70)
    });

    // 2. SVG Hologram Shield Drawing
    tl.add(
      '.svg-shield-path',
      {
        strokeDashoffset: [320, 0],
        duration: 1200,
        ease: 'inOutQuart'
      },
      '-=400'
    );

    // 3. Staggered brand characters with spring elasticity
    tl.add(
      '.brand-char',
      {
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.6, 1],
        duration: 800,
        delay: stagger(45),
        ease: 'outElastic(1, .75)'
      },
      '-=800'
    );

    // 4. Subtitle & badges
    tl.add(
      '.brand-sub',
      {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600
      },
      '-=400'
    );

    // 5. Boot diagnostic check rows
    tl.add(
      '.boot-row',
      {
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 450,
        delay: stagger(90),
        ease: 'outQuad'
      },
      '-=500'
    );

    // 6. Smooth progress counter interpolation (0% -> 100%)
    const progressObj = { count: 0 };
    animate(progressObj, {
      count: 100,
      round: 1,
      duration: 2600,
      ease: 'inOutQuad',
      onUpdate: () => {
        const val = Math.floor(progressObj.count);
        setProgress(val);
        if (val === 20 || val === 45 || val === 70 || val === 90) {
          playCyberChime(350 + val * 4.5, 'sine', 0.04);
        }
      },
      onComplete: () => {
        playCyberChime(880, 'triangle', 0.25);

        // Flash pulse on shield core
        if (shieldRef.current) {
          animate(shieldRef.current, {
            scale: [1, 1.18, 1],
            boxShadow: [
              '0 0 30px rgba(6,182,212,0.3)',
              '0 0 80px rgba(52,211,153,0.9)',
              '0 0 40px rgba(52,211,153,0.5)'
            ],
            duration: 700,
            ease: 'outElastic(1, .5)'
          });
        }

        // Auto exit after brief victory pause
        setTimeout(() => {
          handleExit();
        }, 850);
      }
    });

    // 7. Continuous precision ring rotations
    animate('.anime-ring-outer', {
      rotate: 360,
      duration: 22000,
      loop: true,
      ease: 'linear'
    });

    animate('.anime-ring-inner', {
      rotate: -360,
      duration: 15000,
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
      onMouseMove={(e) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
      }}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-[#040711] text-slate-100 select-none"
    >
      {/* ─── 60fps Interactive Particle Mesh Canvas ─── */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* ─── Ambient Cyber Gradients & Radial Flares ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-32 left-1/4 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />

        {/* Blueprint Circuit Matrix Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #38bdf8 1px, transparent 1px),
              linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Scanning horizontal laser beam */}
        <div className="absolute left-0 right-0 h-36 bg-gradient-to-b from-transparent via-cyan-400/[0.06] to-transparent animate-scanline pointer-events-none" />
      </div>

      {/* ─── Top Telemetry Bar & Controls ─── */}
      <header className="hud-element relative z-10 w-full px-6 py-2.5 sm:py-3 flex items-center justify-between text-xs font-mono border-b border-slate-800/60 backdrop-blur-md bg-[#040711]/75 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold tracking-wider text-[11px] sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>CIPHERGRID OS // v2.4</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">DEFENSE PROTOCOL: ARMED</span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-cyan-400 font-mono hidden md:inline text-[11px] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
            {hashStream}
          </span>
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
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
      <main className="relative z-10 flex flex-col items-center justify-center max-w-xl mx-auto px-4 text-center my-auto py-2 sm:py-3">
        {/* Holographic Concentric Precision Rings with 3D Parallax */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-2.5 sm:mb-3">
          {/* Pulsing Energy Shockwave Ring */}
          <div
            className="absolute inset-0 rounded-full border border-cyan-400 pointer-events-none"
            style={{
              animation: 'energyShockwave 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite'
            }}
          />

          {/* Outer rotating reticle ring */}
          <svg className="anime-ring-outer absolute inset-0 w-full h-full opacity-65 text-cyan-400/40" viewBox="0 0 200 200">
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
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
            <line x1="100" y1="2" x2="100" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="100" y1="190" x2="100" y2="198" stroke="currentColor" strokeWidth="2" />
            <line x1="2" y1="100" x2="10" y2="10" stroke="currentColor" strokeWidth="2" />
            <line x1="190" y1="100" x2="198" y2="100" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Inner counter-rotating ring */}
          <svg className="anime-ring-inner absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] opacity-75 text-blue-400/50" viewBox="0 0 200 200">
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

          {/* Central Shield Hologram Core */}
          <div
            ref={shieldRef}
            className="shield-core relative z-10 w-22 h-22 sm:w-26 sm:h-26 rounded-2xl bg-gradient-to-br from-slate-900/95 via-[#081022] to-slate-900/95 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_45px_rgba(6,182,212,0.35)] backdrop-blur-2xl group cursor-pointer transition-transform duration-300 hover:scale-105"
          >
            {/* Rotating 360-degree laser cone beam inside the vault */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-40">
              <div className="w-full h-full bg-gradient-to-tr from-cyan-400/35 via-transparent to-transparent animate-laser-sweep origin-center" />
            </div>

            {/* SVG Shield Path drawn by Anime.js */}
            <svg className="absolute inset-0 w-full h-full p-2.5 sm:p-3 pointer-events-none" viewBox="0 0 100 100">
              <path
                className="svg-shield-path"
                d="M50 8 L84 20 L84 48 C84 72 50 92 50 92 C50 92 16 72 16 48 L16 20 Z"
                fill="none"
                stroke="url(#shieldGrad)"
                strokeWidth="2.8"
                strokeDasharray="320"
                strokeDashoffset="320"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Center Icon based on progress */}
            <div className="relative z-20 flex items-center justify-center">
              {progress >= 100 ? (
                <ShieldCheck className="w-10 h-10 sm:w-11 sm:h-11 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.9)] animate-pulse" />
              ) : progress >= 65 ? (
                <Shield className="w-10 h-10 sm:w-11 sm:h-11 text-cyan-400 drop-shadow-[0_0_18px_rgba(6,182,212,0.85)]" />
              ) : progress >= 35 ? (
                <Lock className="w-9 h-9 sm:w-10 sm:h-10 text-blue-400 drop-shadow-[0_0_18px_rgba(59,130,246,0.85)]" />
              ) : (
                <Cpu className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-400 drop-shadow-[0_0_18px_rgba(99,102,241,0.85)]" />
              )}
            </div>

            {/* Glowing Corner Accents */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
          </div>
        </div>

        {/* ─── Anime.js Staggered Brand Title Reveal with Electric Shimmer ─── */}
        <div className="space-y-1 mb-2 sm:mb-2.5">
          <div className="brand-sub inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Zap className="w-2.5 h-2.5 text-cyan-400" />
            <span>OPERATIONAL TECHNOLOGY CYBERSECURITY ENGINE</span>
          </div>

          {/* Staggered Letter Reveal with Shimmer */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.25em] font-display overflow-hidden py-0.5 animate-text-shimmer drop-shadow-[0_0_30px_rgba(6,182,212,0.45)]">
            {brandTitle.split('').map((char, index) => (
              <span key={index} className="brand-char inline-block">
                {char}
              </span>
            ))}
          </h1>

          {/* Decrypted Matrix Scrambler Subtitle */}
          <p className="brand-sub text-[10.5px] sm:text-xs text-slate-300 font-mono tracking-widest uppercase">
            {scrambledSubtitle}
          </p>
        </div>

        {/* ─── High Precision Liquid Neon Progress Bar ─── */}
        <div className="w-full max-w-md mb-2 sm:mb-2.5">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              SYSTEM INITIALIZATION
            </span>
            <span className="text-cyan-400 font-bold tracking-wider text-xs">
              {progress.toString().padStart(3, '0')}%
            </span>
          </div>

          {/* Segmented Neon Progress Track */}
          <div className="relative h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 p-[1px] shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_16px_rgba(34,211,238,0.85)] relative"
              style={{ width: `${progress}%` }}
            >
              {/* Glowing spark bead at the leading tip */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full blur-[1px]" />
            </div>
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
        <div className="w-full max-w-md bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 sm:p-2.5 text-left font-mono backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[9px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>DIAGNOSTIC SUBSYSTEM CHECKS</span>
            </div>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ALL SENSORS NORMAL
            </span>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            {BOOT_STEPS.map((step) => {
              const isDone = progress >= step.threshold;
              const isActive = progress < step.threshold && progress >= step.threshold - 25;

              return (
                <div
                  key={step.id}
                  className={`boot-row flex items-center justify-between text-[10px] py-0.5 px-1.5 rounded transition-all duration-200 ${
                    isDone
                      ? 'bg-slate-900/60 text-slate-300'
                      : isActive
                      ? 'bg-cyan-950/50 text-cyan-300 border-l-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
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
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
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
      <footer className="hud-element relative z-10 w-full px-6 py-2 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/60 bg-[#040711]/75 backdrop-blur-md gap-1 shrink-0">
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
