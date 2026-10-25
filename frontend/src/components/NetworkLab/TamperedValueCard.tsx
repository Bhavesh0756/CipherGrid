import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { extractTamperedValueDiff, TamperDiffInfo } from '../../utils/tamperUtils';

interface TamperedValueCardProps {
  sentPayload?: string;
  receivedPayload?: string;
  serverTamperDiff?: Partial<TamperDiffInfo> | null;
  compact?: boolean;
  isPlaintextAccepted?: boolean;
}

export const TamperedValueCard: React.FC<TamperedValueCardProps> = ({
  sentPayload,
  receivedPayload,
  serverTamperDiff,
  compact = false,
  isPlaintextAccepted = false,
}) => {
  const diff = extractTamperedValueDiff(sentPayload, receivedPayload, serverTamperDiff, isPlaintextAccepted);
  if (!diff) return null;

  return (
    <div
      className={`mt-2.5 p-3 rounded-xl font-mono text-xs shadow-lg animate-in fade-in duration-200 border ${
        isPlaintextAccepted
          ? 'bg-gradient-to-r from-amber-950/40 via-[#18110a] to-rose-950/35 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          : 'bg-gradient-to-r from-rose-950/40 via-[#150a12] to-amber-950/30 border-rose-500/40'
      }`}
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b text-[10.5px] ${
          isPlaintextAccepted ? 'border-amber-500/30' : 'border-rose-500/25'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 font-bold ${
            isPlaintextAccepted ? 'text-amber-300' : 'text-rose-300'
          }`}
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 shrink-0 animate-pulse ${
              isPlaintextAccepted ? 'text-amber-400' : 'text-rose-400'
            }`}
          />
          <span>
            {isPlaintextAccepted
              ? 'IN-FLIGHT VALUE TAMPERING (PLAINTEXT VULNERABILITY EXPLOITED)'
              : 'IN-FLIGHT VALUE TAMPERING DETECTED (MITM)'}
          </span>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${
            isPlaintextAccepted
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
          }`}
        >
          {isPlaintextAccepted ? 'Tampered Value Accepted ⚠️' : 'Manipulated In-Transit'}
        </span>
      </div>

      {/* Side-by-Side Value Comparison (e.g. 55 -> 60) */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
        {/* Original Sent */}
        <div className="p-2 rounded-lg bg-[#07090F] border border-slate-800 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 uppercase font-semibold">Original Sent Value</span>
          <div className="my-1 flex items-center justify-center gap-1 text-emerald-400 font-bold text-sm">
            <span>{diff.originalValue}</span>
            {diff.unit && <span className="text-xs text-emerald-500/80">{diff.unit}</span>}
          </div>
          <span className="text-[9px] text-slate-500 truncate">Authentic Sender Data</span>
        </div>

        {/* Tampered Ingress */}
        <div
          className={`p-2 rounded-lg flex flex-col justify-between border ${
            isPlaintextAccepted
              ? 'bg-amber-950/40 border-amber-500/50'
              : 'bg-rose-950/40 border-rose-500/50'
          }`}
        >
          <span
            className={`text-[9px] uppercase font-semibold flex items-center justify-center gap-1 ${
              isPlaintextAccepted ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            <span>{isPlaintextAccepted ? 'Accepted Ingress' : 'Tampered Ingress'}</span>
            <span
              className={`font-bold text-[9.5px] ${
                isPlaintextAccepted ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              ({diff.delta})
            </span>
          </span>
          <div
            className={`my-1 flex items-center justify-center gap-1 font-bold text-sm animate-pulse ${
              isPlaintextAccepted ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            <span>{diff.tamperedValue}</span>
            {diff.unit && (
              <span
                className={`text-xs ${
                  isPlaintextAccepted ? 'text-amber-400/80' : 'text-rose-400/80'
                }`}
              >
                {diff.unit}
              </span>
            )}
          </div>
          <span
            className={`text-[9px] truncate ${
              isPlaintextAccepted ? 'text-amber-400/80' : 'text-rose-400/80'
            }`}
          >
            {isPlaintextAccepted ? 'Forged Value Applied' : 'Injected Malicious Value'}
          </span>
        </div>
      </div>

      {/* Snippet & Defense Action */}
      {!compact && (
        <div className="mt-2.5 p-2 rounded-lg bg-[#060810] border border-slate-800/80 text-[10px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>
                Mutated Field: <strong className="text-cyan-300">{diff.field}</strong>
              </span>
            </span>
            <span className="font-semibold text-rose-300 flex items-center gap-1">
              <span>
                {diff.originalValue}
                {diff.unit}
              </span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
              <span
                className={`font-bold ${
                  isPlaintextAccepted ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {diff.tamperedValue}
                {diff.unit}
              </span>
            </span>
          </div>

          <div className="text-[9.5px] text-slate-300 font-sans leading-relaxed pt-1.5 border-t border-slate-800/60">
            {isPlaintextAccepted ? (
              <>
                <span className="text-amber-400 font-semibold font-mono">
                  Industrial Impact (Unsecured Channel):{' '}
                </span>
                Because transmission security is disabled, the controller has no cryptographic MAC or digital signature.
                The receiver <strong>accepted the mutated value ({diff.originalValue} ➔ {diff.tamperedValue}{diff.unit})</strong>, allowing an unauthenticated attacker to manipulate the physical plant process!
              </>
            ) : (
              <>
                <span className="text-rose-400 font-semibold font-mono">Defense Action: </span>
                Receiver verified the 128-bit AES-GCM MAC authentication tag / SHA-256 digest. The bit alteration caused an integrity mismatch, safely rejecting the frame before the industrial process setpoint could be applied.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
