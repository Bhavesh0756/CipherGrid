import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Info,
  Play,
  RotateCcw,
  Settings,
  Terminal,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { MessageType } from '../../types';

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
    message: 'Unauthorized RBAC write command (0x06)',
    status: 'Rejected',
  },
  {
    id: 'sample-3',
    time: '23:41:08',
    type: 'Info',
    source: 'Audit-Monitor (192.168.1.80)',
    destination: 'OT-Switch (192.168.1.2)',
    message: 'Port status poll & telemetry heartbeat',
    status: 'Accepted',
  },
  {
    id: 'sample-4',
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
    dispatchMessage,
    resetSimulationState,
    isSimulating,
  } = useSimulatorStore();

  const [sourceId, setSourceId] = useState<string>('PLC-01');
  const [destId, setDestId] = useState<string>('SCADA-Server');
  const [messageType, setMessageType] = useState<MessageType>('Sensor Reading');
  const [activeTab, setActiveTab] = useState<'logs' | 'trace' | 'results'>('logs');
  const [filterType, setFilterType] = useState<string>('all');
  const [cleared, setCleared] = useState(false);

  React.useEffect(() => {
    if (devices.length >= 2) {
      if (!devices.some((d) => d.id === sourceId)) {
        setSourceId(devices[0].id);
      }
      if (!devices.some((d) => d.id === destId)) {
        setDestId(devices[1].id);
      }
    }
  }, [devices, sourceId, destId]);

  const handleSimulate = async () => {
    if (sourceId === destId) {
      alert('Source and destination devices must be different.');
      return;
    }

    try {
      await dispatchMessage({
        sender_id: sourceId,
        receiver_id: destId,
        message_type: messageType,
        payload: `action=${messageType};timestamp=${Date.now()}`,
        security_profile: 'Authenticated Secure Communication',
      });
      setCleared(false);
    } catch (err: any) {
      console.error('Simulation error:', err);
    }
  };

  const handleReset = () => {
    resetSimulationState();
  };

  const realEvents: DisplayLogEvent[] = simulationEvents.map((evt, idx) => {
    const srcDev = devices.find((d) => d.id === evt.source_id);
    const dstDev = devices.find((d) => d.id === evt.destination_id);
    const srcLabel = srcDev ? `${srcDev.name} (${srcDev.ip_address})` : evt.source_id;
    const dstLabel = dstDev ? `${dstDev.name} (${dstDev.ip_address})` : evt.destination_id;
    const isOk = evt.packet_state === 'Delivered' || evt.security_status === 'VALID' || evt.security_status === 'PASSED';

    const timeStr = evt.event_time
      ? new Date(evt.event_time).toLocaleTimeString('en-US', { hour12: false })
      : `00:00:0${idx}`;

    return {
      id: evt.id || `evt-${idx}`,
      time: timeStr,
      type: isOk ? 'Info' : 'Warning',
      source: srcLabel,
      destination: dstLabel,
      message: `${evt.message_type} [${evt.packet_state}]`,
      status: isOk ? 'Accepted' : 'Rejected',
    };
  });

  const displayEvents = cleared
    ? []
    : realEvents.length > 0
    ? realEvents
    : DEFAULT_SAMPLE_EVENTS;

  const filteredEvents = displayEvents.filter((evt) => {
    if (filterType === 'all') return true;
    if (filterType === 'info') return evt.type === 'Info';
    if (filterType === 'warning') return evt.type === 'Warning';
    if (filterType === 'accepted') return evt.status === 'Accepted';
    if (filterType === 'rejected') return evt.status === 'Rejected';
    return true;
  });

  const [isLogsExpanded, setIsLogsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-[#080d1a] border-t border-slate-800/80 select-none shrink-0 flex flex-col z-20 shadow-2xl backdrop-blur-md">
      {/* ─── Top Toolbar: Simulation Control ─── */}
      <div className="h-13 px-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-[#060913]/90">
        {/* Left: Section Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xs font-bold text-white tracking-tight leading-tight font-display">
              SIMULATION ENGINE
            </h3>
            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
              · BFS Path & Crypto AEAD
            </span>
          </div>
        </div>

        {/* Center: Reset button, Device dropdowns, and Simulate Button */}
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0"
            title="Reset simulation state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Source Device */}
          <div className="flex flex-col">
            <span className="text-[9.5px] font-mono text-slate-400 mb-0.5">
              SOURCE
            </span>
            <div className="relative">
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer w-44 truncate"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.replace(/\s+PLC$/i, '')} ({d.ip_address})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mt-3" />

          {/* Destination Device */}
          <div className="flex flex-col">
            <span className="text-[9.5px] font-mono text-slate-400 mb-0.5">
              DESTINATION
            </span>
            <div className="relative">
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer w-44 truncate"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.replace(/\s+PLC$/i, '')} ({d.ip_address})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Message Type */}
          <div className="flex flex-col">
            <span className="text-[9.5px] font-mono text-slate-400 mb-0.5">
              PROTOCOL
            </span>
            <div className="relative">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as MessageType)}
                className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer w-44 truncate"
              >
                <option value="Sensor Reading">Sensor Reading (Modbus 0x03)</option>
                <option value="Device Status">Device Status</option>
                <option value="Controller Command">Controller Command (CIP)</option>
                <option value="Alarm Notification">Alarm Notification</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Transmit Action Button */}
          <div className="flex flex-col justify-end mt-3">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Transmitting…' : 'Transmit Packet'}</span>
            </button>
          </div>
        </div>

        {/* Right: Toggle Logs */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isLogsExpanded ? 'Collapse Console' : 'Expand Console'}
          >
            <Terminal className="w-3 h-3 text-slate-400" />
            <span>CONSOLE</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLogsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Bottom Section: Event Logs Console ─── */}
      {isLogsExpanded && (
        <div className="flex flex-col bg-[#070b14]">
          {/* Table Header Tabs & Filter Bar */}
          <div className="px-5 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-medium bg-[#0b101f]/90">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setActiveTab('logs')}
                className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                SIMULATION EVENTS
              </button>
              <button
                onClick={() => setActiveTab('trace')}
                className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
                  activeTab === 'trace'
                    ? 'border-blue-500 text-blue-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                HOP TRACE
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`pb-1 border-b-2 text-[11px] font-mono transition-all cursor-pointer ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                SECURITY RESULTS
              </button>
            </div>

            {/* Filter & Clear */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none pl-2.5 pr-6 py-0.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-md text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">All Events</option>
                  <option value="info">Info</option>
                  <option value="warning">Warnings</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => setCleared(true)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-colors cursor-pointer"
                title="Clear console"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Console Body */}
          <div className="h-32 overflow-y-auto font-mono text-xs">
            {activeTab === 'logs' && (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0b101f] text-slate-400 font-semibold text-[10px] tracking-wider uppercase border-b border-slate-800/80">
                  <tr>
                    <th className="py-1 px-5 w-20">Time</th>
                    <th className="py-1 px-3 w-20">Level</th>
                    <th className="py-1 px-3 w-48">Source</th>
                    <th className="py-1 px-3 w-48">Destination</th>
                    <th className="py-1 px-3">Message Payload</th>
                    <th className="py-1 px-5 w-24 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
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
                        className="hover:bg-slate-800/40 transition-colors text-slate-300 h-7"
                      >
                        <td className="py-1 px-5 font-mono text-[10px] text-slate-400">
                          {evt.time}
                        </td>
                        <td className="py-1 px-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${evt.type === 'Info' ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {evt.type}
                          </span>
                        </td>
                        <td className="py-1 px-3 font-mono text-slate-200 text-[11px] truncate max-w-[180px]">
                          {evt.source}
                        </td>
                        <td className="py-1 px-3 font-mono text-slate-200 text-[11px] truncate max-w-[180px]">
                          {evt.destination}
                        </td>
                        <td className="py-1 px-3 text-slate-300 text-[11px] truncate max-w-sm">
                          {evt.message}
                        </td>
                        <td className="py-1 px-5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                              evt.status === 'Accepted'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
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
              <div className="p-3 text-slate-300">
                {simulationEvents.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 italic">
                    Transmit a packet to view hop-by-hop cryptographic and network path traces.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {simulationEvents.map((step, i) => (
                      <div
                        key={i}
                        className="p-2 bg-slate-900/80 border border-slate-800 rounded-md flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[9px] flex items-center justify-center border border-cyan-500/40">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-white">
                            {step.current_hop}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-300">{step.explanation}</span>
                        </div>
                        <span className="font-mono text-[10px] text-cyan-400">
                          {step.security_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="p-3 text-slate-300">
                {lastResult ? (
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      {lastResult.delivered ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className={lastResult.delivered ? 'text-emerald-400 text-xs font-mono font-bold' : 'text-rose-400 text-xs font-mono font-bold'}>
                        {lastResult.delivered ? 'TRANSMISSION VERIFIED & DELIVERED (PASS)' : 'TRANSMISSION REJECTED BY SECURITY CONTROLS'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Session: <span className="text-slate-200">{lastResult.session_id}</span> · Path: <span className="text-cyan-400">{(lastResult.path || []).join(' ➔ ')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 italic">
                    No simulation run yet. Click Transmit Packet above.
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
