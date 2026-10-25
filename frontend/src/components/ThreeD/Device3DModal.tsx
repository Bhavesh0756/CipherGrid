import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Eye,
  Gauge,
  Key,
  Layers,
  Lock,
  Maximize2,
  Power,
  RotateCcw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  X,
  Zap,
} from 'lucide-react';
import { Device } from '../../types';
import { Industrial3DModel } from './Industrial3DModel';

interface Device3DModalProps {
  device: Device;
  onClose: () => void;
}

export const Device3DModal: React.FC<Device3DModalProps> = ({ device, onClose }) => {
  const [activeTab, setActiveTab] = useState<'model' | 'telemetry' | 'crypto'>('model');

  const isTurbine =
    device.name.toLowerCase().includes('turbine') ||
    device.name.toLowerCase().includes('generator') ||
    device.name.toLowerCase().includes('loop');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#090f1c] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#070b14]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
              device.trust_status === 'Untrusted'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                  {device.name} &bull; 3D Digital Twin Simulation
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  device.trust_status === 'Trusted'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                  {device.trust_status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Purdue {device.purdue_level} &bull; {device.device_type} &bull; IP: {device.ip_address} &bull; MAC: {device.mac_address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/80"
              title="Close 3D Digital Twin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 3D Viewport + Right Side Telemetry HUD */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden bg-[#070b14]">
          {/* Main 3D Model Canvas (2 Cols) */}
          <div className="lg:col-span-2 p-4 flex flex-col justify-center bg-[#050811] relative">
            <Industrial3DModel device={device} height="520px" autoRotate={true} showControls={true} />
          </div>

          {/* Right Side: Technical Specs & Cryptographic Telemetry HUD (1 Col) */}
          <div className="p-5 border-l border-slate-800/80 flex flex-col justify-between overflow-y-auto bg-[#080d1a] space-y-4">
            <div className="space-y-4">
              {/* Technical Specifications Card */}
              <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Hardware Specifications
                </span>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-semibold">{isTurbine ? 'Turbine Loop Actuator' : device.device_type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-400">ISA-95 Purdue:</span>
                    <span className="text-cyan-400 font-semibold">{device.purdue_level}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-400">Network Interface:</span>
                    <span className="font-semibold">IEEE 802.3 1000BASE-T</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span className="text-slate-400">Power Rating:</span>
                    <span className="font-semibold">24V DC Industrial Bus</span>
                  </div>
                </div>
              </div>

              {/* Real-time Dynamic Telemetry Simulation */}
              <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800 space-y-2.5 font-mono">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>Physical Process Telemetry</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#060913] rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">Rotor Speed</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                      {isTurbine ? '3,000 RPM' : '1,800 RPM'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#060913] rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">Chassis Temp</span>
                    <span className="text-sm font-bold text-cyan-400 mt-0.5 block">42.5 &deg;C</span>
                  </div>
                  <div className="p-2.5 bg-[#060913] rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">System Pressure</span>
                    <span className="text-sm font-bold text-purple-400 mt-0.5 block">101.3 kPa</span>
                  </div>
                  <div className="p-2.5 bg-[#060913] rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase block">Vibration Index</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">0.08 mm/s</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Keystore Identity */}
              <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Key Identity</span>
                </span>
                <div className="text-[11px] text-slate-300">
                  <div className="text-[10px] text-slate-400">SHA-256 Key Fingerprint:</div>
                  <div className="p-2 bg-[#060913] text-amber-300 text-[10px] rounded-lg break-all border border-slate-800 mt-1 font-bold">
                    {device.key_fingerprint || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 pt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RSA-PSS 2048-bit &bull; AES-256-GCM AEAD</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-800 text-center">
              CipherGrid Digital Twin Engine &bull; WebGL Three.js PBR Rendering
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
