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
  Trash2,
  XCircle,
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
    source: 'PLC (192.168.1.10)',
    destination: 'SCADA (192.168.1.5)',
    message: 'Read holding registers (0x03)',
    status: 'Accepted',
  },
  {
    id: 'sample-2',
    time: '23:41:10',
    type: 'Warning',
    source: 'Workstation (192.168.1.50)',
    destination: 'PLC (192.168.1.10)',
    message: 'Unauthorized write attempt (0x06)',
    status: 'Rejected',
  },
  {
    id: 'sample-3',
    time: '23:41:08',
    type: 'Info',
    source: 'Monitor (192.168.1.80)',
    destination: 'Switch (192.168.1.2)',
    message: 'Port status poll',
    status: 'Accepted',
  },
  {
    id: 'sample-4',
    time: '23:41:05',
    type: 'Info',
    source: 'SCADA (192.168.1.5)',
    destination: 'PLC (192.168.1.10)',
    message: 'Read input registers (0x04)',
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

  // Auto-set valid source/dest if available
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

  // Convert real simulation events into log format
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
    <div className="bg-white border-t border-slate-200 select-none shrink-0 flex flex-col z-20 shadow-xs">
      {/* ─── Top Toolbar: Simulation Control (Sleek Single Row) ─── */}
      <div className="h-12 px-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white">
        {/* Left: Section Header */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
            <Settings className="w-3 h-3" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
              Simulation Control
            </h3>
            <span className="text-[10px] text-slate-400 hidden xl:inline">
              · Send test messages
            </span>
          </div>
        </div>

        {/* Center: Reset button, Device dropdowns, and Simulate Message Button */}
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
            title="Reset simulation state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          {/* Source Device */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-500 mb-0.5">
              Source Device
            </span>
            <div className="relative">
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="appearance-none pl-2.5 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer w-48 truncate shadow-2xs"
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

          <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-3" />

          {/* Destination Device */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-500 mb-0.5">
              Destination Device
            </span>
            <div className="relative">
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="appearance-none pl-2.5 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer w-48 truncate shadow-2xs"
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
            <span className="text-[10px] font-semibold text-slate-500 mb-0.5">
              Message Type
            </span>
            <div className="relative">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as MessageType)}
                className="appearance-none pl-2.5 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer w-44 truncate shadow-2xs"
              >
                <option value="Sensor Reading">Read Status (Modbus)</option>
                <option value="Device Status">Device Status</option>
                <option value="Controller Command">Controller Command</option>
                <option value="Alarm Notification">Alarm Notification</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Simulate Message Action Button */}
          <div className="flex flex-col justify-end mt-3">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Simulating…' : 'Simulate Message'}</span>
            </button>
          </div>
        </div>

        {/* Right: Toggle Logs Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title={isLogsExpanded ? 'Collapse Event Logs' : 'Expand Event Logs'}
          >
            <span>Logs</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLogsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Bottom Section: Event Logs Table ─── */}
      {isLogsExpanded && (
        <div className="flex flex-col">
          {/* Table Header Tabs & Filter Bar */}
          <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between text-xs font-medium bg-slate-50/50">
          {/* Tabs */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-0.5 border-b-2 text-[11.5px] transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Event Logs
            </button>
            <button
              onClick={() => setActiveTab('trace')}
              className={`pb-0.5 border-b-2 text-[11.5px] transition-all cursor-pointer ${
                activeTab === 'trace'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Packet Trace
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`pb-0.5 border-b-2 text-[11.5px] transition-all cursor-pointer ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Simulation Results
            </button>
          </div>

          {/* Right: Filter & Clear Logs */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-2.5 pr-6 py-0.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Events</option>
                <option value="info">Info Events</option>
                <option value="warning">Warnings</option>
                <option value="accepted">Accepted Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setCleared(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Clear event logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Table Body with explicit column widths */}
        <div className="h-32 overflow-y-auto">
          {activeTab === 'logs' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white shadow-2xs z-10">
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10.5px]">
                  <th className="py-1.5 px-5 w-20">Time</th>
                  <th className="py-1.5 px-3 w-24">Event Type</th>
                  <th className="py-1.5 px-3 w-48">Source</th>
                  <th className="py-1.5 px-3 w-48">Destination</th>
                  <th className="py-1.5 px-3">Message</th>
                  <th className="py-1.5 px-5 w-24 text-right">Status</th>
                  <th className="py-1.5 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                      No event log records matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-50/70 transition-colors text-slate-700 h-8"
                    >
                      <td className="py-1 px-5 font-mono text-[10.5px] text-slate-400">
                        {evt.time}
                      </td>
                      <td className="py-1 px-3">
                        <span className="flex items-center gap-1 text-[11px] font-medium">
                          {evt.type === 'Info' ? (
                            <Info className="w-3 h-3 text-blue-500" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          <span>{evt.type}</span>
                        </span>
                      </td>
                      <td className="py-1 px-3 font-medium text-slate-800 text-[11px] truncate max-w-[180px]">
                        {evt.source}
                      </td>
                      <td className="py-1 px-3 font-medium text-slate-800 text-[11px] truncate max-w-[180px]">
                        {evt.destination}
                      </td>
                      <td className="py-1 px-3 text-slate-600 text-[11px] truncate max-w-sm">
                        {evt.message}
                      </td>
                      <td className="py-1 px-5 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-semibold ${
                            evt.status === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-1 px-3 text-center text-slate-400 font-bold tracking-widest text-xs cursor-pointer hover:text-slate-700 select-none">
                        ···
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'trace' && (
            <div className="p-3 text-slate-600 text-xs">
              {simulationEvents.length === 0 ? (
                <div className="py-4 text-center text-slate-400 italic">
                  Run a simulation to view hop-by-hop cryptographic and network path traces.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {simulationEvents.map((step, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {step.current_hop}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{step.explanation}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        {step.security_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="p-3 text-slate-600 text-xs">
              {lastResult ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold">
                    {lastResult.delivered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className={lastResult.delivered ? 'text-emerald-700 text-xs' : 'text-rose-700 text-xs'}>
                      {lastResult.delivered ? 'Message Transmission Delivered & Verified' : 'Transmission Rejected by Security Policy'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    Session: {lastResult.session_id} · Path: {(lastResult.path || []).join(' ➔ ')}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 italic">
                  No simulation results yet. Use the controls above to transmit a message.
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
