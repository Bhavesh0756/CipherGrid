import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  RotateCcw,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface DisplayLogEvent {
  id: string;
  time: string;
  type: 'Info' | 'Warning' | 'Error';
  source: string;
  destination: string;
  message: string;
  status: 'Accepted' | 'Rejected';
}

const DEFAULT_SAMPLE_EVENTS: DisplayLogEvent[] = [
  {
    id: 'sample-1',
    time: '23:41:12',
    type: 'Info',
    source: 'PLC-01 (192.168.1.10)',
    destination: 'SCADA-Server (192.168.1.5)',
    message: 'Read holding registers [AES-256-GCM AEAD]',
    status: 'Accepted',
  },
  {
    id: 'sample-2',
    time: '23:41:10',
    type: 'Warning',
    source: 'Rogue-Probe (192.168.1.99)',
    destination: 'PLC-01 (192.168.1.10)',
    message: 'Unauthorized CIP command dropped [ACL violation]',
    status: 'Rejected',
  },
  {
    id: 'sample-3',
    time: '23:41:05',
    type: 'Info',
    source: 'SCADA-Server (192.168.1.5)',
    destination: 'PLC-01 (192.168.1.10)',
    message: 'Digital signature verified [RSA-PSS 2048-bit]',
    status: 'Accepted',
  },
];

export const SimulationControls: React.FC = () => {
  const {
    devices,
    simulationEvents,
    lastResult,
    resetSimulationState,
  } = useSimulatorStore();

  const [activeTab, setActiveTab] = useState<'logs' | 'trace' | 'results'>('logs');
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
    : dbEvents.length > 0
    ? dbEvents
    : DEFAULT_SAMPLE_EVENTS;

  const filteredEvents = displayedEvents.filter((evt) => {
    if (filterType === 'all') return true;
    if (filterType === 'info') return evt.type === 'Info';
    if (filterType === 'warning') return evt.type === 'Warning';
    if (filterType === 'accepted') return evt.status === 'Accepted';
    if (filterType === 'rejected') return evt.status === 'Rejected';
    return true;
  });

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
          </div>
        </div>
      )}
    </div>
  );
};
