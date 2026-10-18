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
    setMessageModalOpen,
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

  return (
    <div className="bg-white border-t border-slate-200 select-none shrink-0 flex flex-col shadow-xs">
      {/* ─── Top Sub-row: Simulation Control Bar ─── */}
      <div className="px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight">
              Simulation Control
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Send test messages between devices
            </p>
          </div>
        </div>

        {/* Center / Right: Action Buttons and Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Simulate Action Button */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Simulating…' : 'Simulate Message'}</span>
          </button>

          {/* Reset Action Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title="Reset simulation playback"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          {/* Source Device Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-slate-600">
              Source Device
            </span>
            <div className="relative">
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[170px]"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />

          {/* Destination Device Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-slate-600">
              Destination Device
            </span>
            <div className="relative">
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[170px]"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Message Type Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-slate-600">
              Message Type
            </span>
            <div className="relative">
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as MessageType)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[170px]"
              >
                <option value="Sensor Reading">Read Status (Modbus)</option>
                <option value="Device Status">Device Status</option>
                <option value="Controller Command">Controller Command</option>
                <option value="Alarm Notification">Alarm Notification</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Sub-row: Event Logs Table ─── */}
      <div className="flex flex-col">
        {/* Table Header Controls */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs font-medium">
          {/* Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Event Logs
            </button>
            <button
              onClick={() => setActiveTab('trace')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'trace'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Packet Trace
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Simulation Results
            </button>
          </div>

          {/* Right: Filter & Clear Logs */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Events</option>
                <option value="info">Info Events</option>
                <option value="warning">Warnings</option>
                <option value="accepted">Accepted Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setCleared(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-lg transition-colors cursor-pointer"
              title="Clear event logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="max-h-44 overflow-y-auto">
          {activeTab === 'logs' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2 px-6">Time</th>
                  <th className="py-2 px-4">Event Type</th>
                  <th className="py-2 px-4">Source</th>
                  <th className="py-2 px-4">Destination</th>
                  <th className="py-2 px-4">Message</th>
                  <th className="py-2 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No event log records matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-50/80 transition-colors text-slate-700"
                    >
                      <td className="py-2 px-6 font-mono text-[11px] text-slate-500">
                        {evt.time}
                      </td>
                      <td className="py-2 px-4">
                        <span className="flex items-center gap-1.5 font-medium">
                          {evt.type === 'Info' ? (
                            <Info className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>{evt.type}</span>
                        </span>
                      </td>
                      <td className="py-2 px-4 font-medium text-slate-800">
                        {evt.source}
                      </td>
                      <td className="py-2 px-4 font-medium text-slate-800">
                        {evt.destination}
                      </td>
                      <td className="py-2 px-4 text-slate-600 truncate max-w-xs">
                        {evt.message}
                      </td>
                      <td className="py-2 px-6 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                            evt.status === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
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
            <div className="p-4 text-slate-600 text-xs">
              {simulationEvents.length === 0 ? (
                <div className="py-4 text-center text-slate-400 italic">
                  Run a simulation to view hop-by-hop cryptographic and network path traces.
                </div>
              ) : (
                <div className="space-y-2">
                  {simulationEvents.map((step, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {step.current_hop}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{step.explanation}</span>
                      </div>
                      <span className="font-mono text-[10.5px] text-slate-500">
                        {step.security_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="p-4 text-slate-600 text-xs">
              {lastResult ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    {lastResult.delivered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className={lastResult.delivered ? 'text-emerald-700' : 'text-rose-700'}>
                      {lastResult.delivered ? 'Message Transmission Delivered & Verified' : 'Transmission Rejected by Security Policy'}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-slate-600 font-mono">
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
    </div>
  );
};
