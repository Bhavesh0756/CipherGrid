import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { extractTamperedValueDiff, TamperDiffInfo } from '../../utils/tamperUtils';

interface TamperedValueCardProps {
  sentPayload?: string;
  receivedPayload?: string;
  serverTamperDiff?: Partial<TamperDiffInfo> | null;
  compact?: boolean;
}

export const TamperedValueCard: React.FC<TamperedValueCardProps> = ({
  sentPayload,
  receivedPayload,
  serverTamperDiff,
  compact = false,
}) => {
  const diff = extractTamperedValueDiff(sentPayload, receivedPayload, serverTamperDiff);
  if (!diff) return null;

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-rose-950/40 via-[#150a12] to-amber-950/30 border border-rose-500/40 font-mono text-xs shadow-lg animate-in fade-in duration-200">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-rose-500/25 text-[10.5px]">
        <div className="flex items-center gap-1.5 font-bold text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
          <span>IN-FLIGHT VALUE TAMPERING DETECTED (MITM)</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase tracking-wide">
          Manipulated In-Transit
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
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/50 flex flex-col justify-between">
          <span className="text-[9px] text-rose-300 uppercase font-semibold flex items-center justify-center gap-1">
            <span>Tampered Ingress</span>
            <span className="text-rose-400 font-bold text-[9.5px]">({diff.delta})</span>
          </span>
          <div className="my-1 flex items-center justify-center gap-1 text-rose-300 font-bold text-sm animate-pulse">
            <span>{diff.tamperedValue}</span>
            {diff.unit && <span className="text-xs text-rose-400/80">{diff.unit}</span>}
          </div>
          <span className="text-[9px] text-rose-400/80 truncate">Injected Malicious Value</span>
        </div>
      </div>

      {/* Snippet & Defense Action */}
      {!compact && (
        <div className="mt-2.5 p-2 rounded-lg bg-[#060810] border border-slate-800/80 text-[10px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Mutated Field: <strong className="text-cyan-300">{diff.field}</strong></span>
            </span>
            <span className="font-semibold text-rose-300 flex items-center gap-1">
              <span>{diff.originalValue}{diff.unit}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
              <span className="text-rose-400 font-bold">{diff.tamperedValue}{diff.unit}</span>
            </span>
          </div>

          <div className="text-[9.5px] text-slate-400 font-sans leading-relaxed pt-1.5 border-t border-slate-800/60">
            <span className="text-rose-400 font-semibold font-mono">Defense Action: </span>
            Receiver verified the 128-bit AES-GCM MAC authentication tag. The ciphertext bit-flip caused an authentication tag mismatch, rejecting the frame before the industrial process setpoint could be altered.
          </div>
        </div>
      )}
    </div>
  );
};
