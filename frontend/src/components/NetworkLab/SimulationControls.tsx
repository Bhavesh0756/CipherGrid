import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  RotateCcw,
  Split,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { TamperedValueCard } from './TamperedValueCard';

interface DisplayLogEvent {
  id: string;
  time: string;
  type: 'Info' | 'Warning' | 'Error';
  source: string;
  destination: string;
  message: string;
  status: 'Accepted' | 'Rejected';
}

export const SimulationControls: React.FC = () => {
  const {
    devices,
    simulationEvents,
    lastResult,
    resetSimulationState,
  } = useSimulatorStore();

  const [activeTab, setActiveTab] = useState<'logs' | 'trace' | 'results' | 'diff'>('logs');
  const [filterType, setFilterType] = useState<string>('all');
  const [cleared, setCleared] = useState(false);
  const [dbEvents, setDbEvents] = useState<DisplayLogEvent[]>([]);
  const [isLogsExpanded, setIsLogsExpanded] = useState<boolean>(true);

  // Load real packet stream events from SQLite database when idle
  useEffect(() => {
    const fetchRecentDbEvents = async () => {
      try {
        const res = await api.getPacketEvents(25);
        if (res.events && res.events.length > 0) {
          const mapped: DisplayLogEvent[] = res.events.map((evt: any, idx: number) => {
            const srcDev = devices.find((d) => d.id === evt.source_device);
            const dstDev = devices.find((d) => d.id === evt.destination_device);
            const srcLabel = srcDev ? `${srcDev.name} (${srcDev.ip_address})` : (evt.source_device || 'Unknown');
            const dstLabel = dstDev ? `${dstDev.name} (${dstDev.ip_address})` : (evt.destination_device || 'Unknown');

            const secStatus = (evt.security_status || '').toLowerCase();
            const isRejected =
              evt.packet_state === 'Rejected' ||
              evt.packet_state === 'Failed' ||
              secStatus.includes('mismatch') ||
              secStatus.includes('invalid') ||
              secStatus.includes('violation') ||
              secStatus.includes('attack') ||
              secStatus.includes('failed') ||
              secStatus.includes('denied') ||
              secStatus.includes('unavailable');

            const isOk = !isRejected;

            const timeStr = evt.timestamp
              ? new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false })
              : `00:00:0${idx}`;

            return {
              id: String(evt.id || idx),
              time: timeStr,
              type: isOk ? 'Info' : 'Warning',
              source: srcLabel,
              destination: dstLabel,
              message: `${evt.protocol || 'SCADA Telemetry'} [${evt.packet_state}]`,
              status: isOk ? 'Accepted' : 'Rejected',
            };
          });
          setDbEvents(mapped);
        }
      } catch {
        // ignore
      }
    };
    fetchRecentDbEvents();
  }, [devices, simulationEvents.length]);

  const handleReset = () => {
    resetSimulationState();
  };

  const realEvents: DisplayLogEvent[] = simulationEvents.map((evt, idx) => {
    const srcDev = devices.find((d) => d.id === evt.source_id);
    const dstDev = devices.find((d) => d.id === evt.destination_id);
    const srcLabel = srcDev ? `${srcDev.name} (${srcDev.ip_address})` : evt.source_id;
    const dstLabel = dstDev ? `${dstDev.name} (${dstDev.ip_address})` : evt.destination_id;

    const secStatus = (evt.security_status || '').toLowerCase();
    const isRejected =
      evt.packet_state === 'Rejected' ||
      evt.packet_state === 'Failed' ||
      secStatus.includes('mismatch') ||
      secStatus.includes('invalid') ||
      secStatus.includes('violation') ||
      secStatus.includes('attack') ||
      secStatus.includes('failed') ||
      secStatus.includes('denied') ||
      secStatus.includes('unavailable');

    const isOk = !isRejected;

    return {
      id: evt.id || `live-${idx}`,
      time: new Date(evt.event_time).toLocaleTimeString('en-US', { hour12: false }),
      type: isOk ? 'Info' : 'Warning',
      source: srcLabel,
      destination: dstLabel,
      message: `${evt.message_type} [${evt.packet_state}]`,
      status: isOk ? 'Accepted' : 'Rejected',
    };
  });

  const displayedEvents = cleared
    ? []
    : realEvents.length > 0
    ? realEvents
    : dbEvents;

  const filteredEvents = displayedEvents.filter((evt) => {
    if (filterType === 'all') return true;
    if (filterType === 'info') return evt.type === 'Info';
    if (filterType === 'warning') return evt.type === 'Warning';
    if (filterType === 'accepted') return evt.status === 'Accepted';
    if (filterType === 'rejected') return evt.status === 'Rejected';
    return true;
  });

  const payloadDiff = lastResult?.payload_diff || (simulationEvents[simulationEvents.length - 1]?.details as any)?.payload_diff;
  const effectiveDiff = payloadDiff || (lastResult ? {
    sent: {
      source_device: lastResult.events?.[0]?.source_device || 'PLC-01',
      source_name: devices.find(d => d.id === lastResult.events?.[0]?.source_device)?.name || lastResult.events?.[0]?.source_device || 'PLC-01',
      payload: lastResult.events?.[0]?.wire_details?.raw_payload || '{"sensor": "TEMP-01", "temperature": 43.0, "unit": "C"}',
      sha256: lastResult.security?.digest?.hash_hex || '7a8f12c9b20e14a1f592d8e4',
      timestamp: lastResult.events?.[0]?.timestamp || new Date().toISOString()
    },
    received: {
      destination_device: lastResult.events?.[lastResult.events.length - 1]?.destination_device || 'SCADA Server',
      destination_name: devices.find(d => d.id === lastResult.events?.[lastResult.events.length - 1]?.destination_device)?.name || 'SCADA Server',
      payload: lastResult.status === 'Delivered'
        ? (lastResult.events?.[0]?.wire_details?.raw_payload || '{"sensor": "TEMP-01", "temperature": 43.0, "unit": "C"}')
        : (lastResult.rejection_reason?.toLowerCase().includes('tamper') || lastResult.status?.toLowerCase().includes('tamper')
            ? `[REJECTED: ${lastResult.rejection_reason || 'Authentication tag mismatch: In-transit ciphertext or authentication tag was modified (tampered).'}]`
            : `[REJECTED: ${lastResult.rejection_reason || lastResult.status}]`),
      sha256: lastResult.status === 'Delivered' ? (lastResult.security?.digest?.hash_hex || '7a8f12c9b20e14a1f592d8e4') : 'MISMATCH_OR_DROPPED',
      timestamp: lastResult.events?.[lastResult.events.length - 1]?.timestamp || new Date().toISOString()
    },
    diff_status: lastResult.status === 'Delivered' ? 'IDENTICAL' : (lastResult.rejection_reason?.toLowerCase().includes('tamper') ? 'TAMPERED' : 'DROPPED'),
    is_modified: lastResult.status !== 'Delivered',
    tamper_diff: (lastResult as any)?.payload_diff?.tamper_diff || null,
    reason: lastResult.rejection_reason || 'Cryptographic verification and delivery status evaluated.',
    decision: lastResult.status || 'Delivered'
  } : null);

  return (
    <div className="bg-[#0D1017] border-t border-[#1E2430] select-none shrink-0 flex flex-col z-20 shadow-2xl backdrop-blur-md">
      {/* ─── Top Console Header Bar ─── */}
      <div className="h-10 px-4 border-b border-[#1E2430] flex items-center justify-between gap-3 bg-[#090A0F]">
        {/* Left: Tab Switcher & Console Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-3 border-r border-[#1E2430] text-slate-400 font-mono text-xs">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white font-display tracking-tight text-xs">CONSOLE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#141824] text-slate-400 font-mono border border-[#1E2430]">
              {displayedEvents.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveTab('logs');
                if (!isLogsExpanded) setIsLogsExpanded(true);
              }}
              className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
                activeTab === 'logs' && isLogsExpanded
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              SIMULATION EVENTS
            </button>
            <button
              onClick={() => {
                setActiveTab('trace');
                if (!isLogsExpanded) setIsLogsExpanded(true);
              }}
              className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
                activeTab === 'trace' && isLogsExpanded
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              HOP TRACE
            </button>
            <button
              onClick={() => {
                setActiveTab('results');
                if (!isLogsExpanded) setIsLogsExpanded(true);
              }}
              className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
                activeTab === 'results' && isLogsExpanded
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              SECURITY RESULTS
            </button>
            <button
              onClick={() => {
                setActiveTab('diff');
                if (!isLogsExpanded) setIsLogsExpanded(true);
              }}
              className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'diff' && isLogsExpanded
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3 h-3 text-cyan-400" />
              <span>PAYLOAD DIFF</span>
              {effectiveDiff?.is_modified && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Filter, Reset, Clear & Toggle Expand */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-2 pr-6 py-0.5 text-xs font-mono bg-[#141824] border border-[#1E2430] rounded-md text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="info">Info</option>
              <option value="warning">Warnings</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono text-slate-400 hover:text-white bg-[#141824] hover:bg-[#1A2030] border border-[#1E2430] rounded-md transition-colors cursor-pointer"
            title="Reset simulation state"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Clear */}
          <button
            onClick={() => setCleared(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition-colors cursor-pointer"
            title="Clear console view"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-slate-400 hover:text-white bg-[#141824] border border-[#1E2430] rounded-md transition-colors cursor-pointer"
            title={isLogsExpanded ? 'Collapse Console' : 'Expand Console'}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLogsExpanded ? 'rotate-180' : ''}`} />
            <span>{isLogsExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
          </button>
        </div>
      </div>

      {/* ─── Bottom Section: Event Logs Console ─── */}
      {isLogsExpanded && (
        <div className="flex flex-col bg-[#0B0E14]">
          {/* Console Body */}
          <div className="h-40 overflow-y-auto font-mono text-xs">
            {activeTab === 'logs' && (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0E121A] text-slate-400 font-semibold text-[10px] tracking-wider uppercase border-b border-[#1E2430]">
                  <tr>
                    <th className="py-1 px-5 w-20">Time</th>
                    <th className="py-1 px-3 w-20">Level</th>
                    <th className="py-1 px-3 w-48">Source</th>
                    <th className="py-1 px-3 w-48">Destination</th>
                    <th className="py-1 px-3">Message Payload</th>
                    <th className="py-1 px-5 w-24 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2430]/60">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        No console events match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr
                        key={evt.id}
                        className="hover:bg-[#141824]/60 transition-colors text-slate-300 h-7"
                      >
                        <td className="py-1 px-5 font-mono text-[10px] text-slate-400">
                          {evt.time}
                        </td>
                        <td className="py-1 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${evt.type === 'Info' ? 'text-blue-400' : 'text-amber-400/90'}`}>
                            {evt.type}
                          </span>
                        </td>
                        <td className="py-1 px-3 font-medium text-slate-200 truncate max-w-44">
                          {evt.source}
                        </td>
                        <td className="py-1 px-3 font-medium text-slate-200 truncate max-w-44">
                          {evt.destination}
                        </td>
                        <td className="py-1 px-3 text-slate-400 font-mono text-[10.5px] truncate max-w-md">
                          {evt.message}
                        </td>
                        <td className="py-1 px-5 text-right">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                              evt.status === 'Accepted'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'trace' && (
              <div className="p-4 space-y-2">
                <div className="text-slate-400 font-mono text-xs mb-2">
                  Multi-hop packet path breakdown and transmission latencies:
                </div>
                {lastResult?.path && lastResult.path.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {lastResult.path.map((nodeId: string, idx: number) => {
                      const dev = devices.find((d) => d.id === nodeId);
                      const isLast = idx === lastResult.path.length - 1;
                      return (
                        <React.Fragment key={nodeId}>
                          <div className="px-3 py-1.5 rounded-lg bg-[#10131A] border border-[#1E2430] text-slate-200 text-xs shrink-0 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="font-semibold text-white">{dev ? dev.name : nodeId}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({dev?.ip_address || 'Purdue L' + (idx + 1)})</span>
                          </div>
                          {!isLast && (
                            <div className="text-slate-500 font-mono text-xs">➔</div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-4 text-center">
                    No active hop trace. Dispatch a message to inspect network path traversal.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="p-4 font-mono text-xs space-y-3">
                {lastResult ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-lg bg-[#10131A] border border-[#1E2430]">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Delivery Decision</div>
                      <div className={`text-sm font-bold mt-1 ${lastResult.delivered ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {lastResult.status || (lastResult.delivered ? 'Delivered' : 'Failed')}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#10131A] border border-[#1E2430]">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Message ID</div>
                      <div className="text-xs font-semibold text-white mt-1 truncate">
                        {lastResult.message_id || 'N/A'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#10131A] border border-[#1E2430]">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Total Hops</div>
                      <div className="text-sm font-bold text-blue-400 mt-1">
                        {lastResult.path?.length || 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#10131A] border border-[#1E2430]">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Cumulative Latency</div>
                      <div className="text-sm font-bold text-slate-300 mt-1">
                        {lastResult.total_latency_ms ? `${lastResult.total_latency_ms} ms` : '2.0 ms'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-4 text-center">
                    No simulation results available. Click "Dispatch Packet" in the top bar to run a packet test.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'diff' && (
              <div className="p-3.5 font-mono text-xs space-y-3">
                {effectiveDiff ? (
                  <div className="space-y-3">
                    {/* Status Alert Banner */}
                    <div
                      className={`px-3.5 py-2 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        effectiveDiff.diff_status === 'IDENTICAL'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : effectiveDiff.diff_status === 'TAMPERED'
                          ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                          : effectiveDiff.diff_status === 'SIGNATURE_FORGERY'
                          ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {effectiveDiff.diff_status === 'IDENTICAL' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                        )}
                        <div>
                          <span className="font-bold uppercase tracking-wide">
                            {effectiveDiff.diff_status === 'IDENTICAL'
                              ? 'DATA INTEGRITY 100% INTACT'
                              : effectiveDiff.diff_status === 'TAMPERED'
                              ? 'CRITICAL TAMPERING DETECTED IN-FLIGHT'
                              : effectiveDiff.diff_status === 'SIGNATURE_FORGERY'
                              ? 'DIGITAL SIGNATURE FORGERY DETECTED'
                              : effectiveDiff.diff_status === 'CIPHERTEXT_CORRUPTED'
                              ? 'AEAD AUTHENTICATION TAG MISMATCH'
                              : effectiveDiff.diff_status === 'REPLAYED'
                              ? 'REPLAY ATTACK INTERCEPTED'
                              : 'PACKET DROPPED BY ACCESS CONTROL'}
                          </span>
                          <span className="text-slate-400 mx-2">&bull;</span>
                          <span className="text-slate-300 text-[11px] font-normal">{effectiveDiff.reason}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          effectiveDiff.decision === 'Delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        RECEIVER: {effectiveDiff.decision}
                      </span>
                    </div>

                    {/* Side-by-Side Comparison Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left: Original Sent Payload */}
                      <div className="p-3 rounded-xl bg-[#10131A] border border-[#1E2430] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-[#1E2430]">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              <span className="font-bold text-white text-[11px]">ORIGINAL SENT (SOURCE)</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {effectiveDiff.sent.source_name} ({effectiveDiff.sent.source_device})
                            </span>
                          </div>
                          <div className="mt-2.5 p-2 rounded-lg bg-[#07090F] border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap break-all select-text">
                            {effectiveDiff.sent.payload}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#1E2430]/70 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate max-w-[220px]" title={effectiveDiff.sent.sha256}>
                            SHA-256: <span className="text-cyan-400">{effectiveDiff.sent.sha256.slice(0, 16)}...</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 text-[9px] font-bold">
                            ORIGIN INTACT
                          </span>
                        </div>
                      </div>

                      {/* Right: Received Wire Ingress Payload */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                          effectiveDiff.is_modified
                            ? 'bg-rose-950/15 border-rose-500/40'
                            : 'bg-[#10131A] border-[#1E2430]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-[#1E2430]">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  effectiveDiff.is_modified ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                                }`}
                              />
                              <span className="font-bold text-white text-[11px]">
                                {effectiveDiff.is_modified ? 'RECEIVED INGRESS (TAMPERED)' : 'RECEIVED INGRESS (VERIFIED)'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {effectiveDiff.received.destination_name} ({effectiveDiff.received.destination_device})
                            </span>
                          </div>
                          <div
                            className={`mt-2.5 p-2 rounded-lg font-mono text-[11px] whitespace-pre-wrap break-all select-text border ${
                              effectiveDiff.is_modified
                                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                                : 'bg-[#07090F] border-slate-800 text-slate-200'
                            }`}
                          >
                            {effectiveDiff.received.payload}
                          </div>

                          {/* In-Flight Value Tampering Comparison (e.g. 55 -> 60) */}
                          {(effectiveDiff.is_modified || effectiveDiff.diff_status === 'TAMPERED') && (
                            <TamperedValueCard
                              sentPayload={effectiveDiff.sent.payload}
                              receivedPayload={effectiveDiff.received.payload}
                              serverTamperDiff={(effectiveDiff as any).tamper_diff}
                            />
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#1E2430]/70 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate max-w-[220px]" title={effectiveDiff.received.sha256}>
                            SHA-256:{' '}
                            <span className={effectiveDiff.is_modified ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {effectiveDiff.received.sha256.slice(0, 16)}...
                            </span>
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              effectiveDiff.is_modified
                                ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            }`}
                          >
                            {effectiveDiff.is_modified ? 'INTEGRITY MISMATCH ❌' : 'HASH MATCHED ✅'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-6 text-center">
                    No active payload diff. Click "Dispatch Packet" in the top bar to run a packet test and compare in-flight payloads.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
