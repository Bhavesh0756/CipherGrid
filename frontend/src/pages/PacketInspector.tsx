import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileCode,
  Filter,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { SimulationEvent } from '../types';

export const PacketInspector: React.FC = () => {
  const { simulationEvents, selectedEvent, setSelectedEvent, activeSessionId } = useSimulatorStore();

  const [dbEvents, setDbEvents] = useState<SimulationEvent[]>([]);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPacketEvents(150);
      const mapped: SimulationEvent[] = (res.events || []).map((ev: any) => ({
        id: String(ev.id),
        session_id: ev.session_id,
        message_id: ev.message_id,
        event_time: ev.timestamp || new Date().toISOString(),
        source_id: ev.source_device,
        destination_id: ev.destination_device,
        current_hop: ev.current_hop,
        message_type: 'Sensor Reading',
        packet_state: ev.packet_state,
        security_status: ev.security_status,
        details: ev.wire_details || {},
        explanation: ev.explanation || '',
      }));
      setDbEvents(mapped);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeSessionId]);

  // Combine store simulation events (if any) with dbEvents
  const displayEvents = simulationEvents.length > 0 ? simulationEvents : dbEvents;

  const filteredEvents = displayEvents.filter((ev) => {
    const matchesState = filterState === 'all' || ev.packet_state === filterState;
    const matchesSearch =
      ev.message_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.source_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.destination_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.current_hop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.message_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  const activeEvent = selectedEvent || (filteredEvents.length > 0 ? filteredEvents[0] : null);

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'Delivered':
        return <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-medium">Delivered</span>;
      case 'In transit':
        return <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-medium">In Transit</span>;
      case 'Created':
        return <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium">Created</span>;
      case 'Queued':
        return <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-medium">Queued</span>;
      case 'Rejected':
        return <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-medium">Rejected</span>;
      case 'Failed':
        return <span className="bg-red-100 text-red-900 px-1.5 py-0.5 rounded text-[10px] font-medium">Failed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">{state}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-hidden">
      {/* Top filter banner */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search packet events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            >
              <option value="all">All Packet States</option>
              <option value="Delivered">Delivered</option>
              <option value="In transit">In Transit</option>
              <option value="Created">Created</option>
              <option value="Queued">Queued</option>
              <option value="Rejected">Rejected</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-slate-600 transition-colors"
            title="Refresh event stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Virtual Simulator Telemetry (Not physical NIC traffic)</span>
        </div>
      </div>

      {/* Split layout: Event list on top, Packet Dissector on bottom */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Event List Table */}
        <div className="flex-1 overflow-auto border-b border-slate-200 bg-white">
          {filteredEvents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <Radio className="w-7 h-7 text-slate-300 mb-1.5" />
              <p className="text-xs font-medium">No simulation packet events found.</p>
              <p className="text-[11px] text-slate-400">Dispatch a message in Network Lab to generate traffic.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] z-10">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Message ID</th>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Destination</th>
                  <th className="py-2 px-3">Current Hop</th>
                  <th className="py-2 px-3">Message Type</th>
                  <th className="py-2 px-3">Packet State</th>
                  <th className="py-2 px-3">Security Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredEvents.map((ev) => {
                  const isSelected = activeEvent?.id === ev.id;
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/90 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {ev.event_time.split('T')[1]?.slice(0, 12) || ev.event_time}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{ev.message_id}</td>
                      <td className="py-2 px-3">{ev.source_id}</td>
                      <td className="py-2 px-3">{ev.destination_id}</td>
                      <td className="py-2 px-3 font-semibold text-blue-600">{ev.current_hop}</td>
                      <td className="py-2 px-3 font-sans">{ev.message_type}</td>
                      <td className="py-2 px-3 font-sans">{getStateBadge(ev.packet_state)}</td>
                      <td className="py-2 px-3 font-sans">
                        {ev.security_status === 'VERIFIED' || ev.security_status === 'ACCEPTED' ? (
                          <span className="text-emerald-700 font-medium">Verified</span>
                        ) : ev.security_status === 'DISABLED' ? (
                          <span className="text-slate-500">Disabled</span>
                        ) : (
                          <span className="text-rose-700 font-semibold">{ev.security_status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Dissector Panel */}
        {activeEvent && (
          <div className="h-64 bg-slate-900 text-slate-200 border-t border-slate-700 flex flex-col text-xs select-text">
            {/* Dissector Tab Header */}
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-slate-100">
                  Packet Dissector: Event #{activeEvent.id}
                </span>
                <span className="text-slate-400 font-mono">({activeEvent.session_id})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current Hop:</span>
                <span className="font-mono bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">
                  {activeEvent.current_hop}
                </span>
              </div>
            </div>

            {/* Dissector 3-Column Inspection */}
            <div className="flex-1 grid grid-cols-3 divide-x divide-slate-800 overflow-y-auto font-mono text-[11px]">
              {/* Col 1: Transmission Path & Route Tree */}
              <div className="p-3 space-y-2 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Routing & Hop Telemetry
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>Source: <span className="text-white font-semibold">{activeEvent.source_id}</span></div>
                  <div>Destination: <span className="text-white font-semibold">{activeEvent.destination_id}</span></div>
                  <div>State: <span className="text-amber-400">{activeEvent.packet_state}</span></div>
                  <div>Timestamp: <span className="text-slate-400">{activeEvent.event_time}</span></div>
                  <div className="pt-2">
                    <div className="text-slate-400 text-[10px]">Decision Explanation:</div>
                    <p className="font-sans text-slate-300 mt-0.5 bg-slate-800/80 p-2 rounded border border-slate-700">
                      {activeEvent.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Col 2: Cryptographic Breakdown */}
              <div className="p-3 space-y-2 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Cryptographic Checks</span>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <div>
                    <span className="text-slate-400">Security Profile:</span>{' '}
                    <span className="text-blue-400">{activeEvent.details?.security_profile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">AES-256-GCM Nonce:</span>{' '}
                    <span className="text-teal-400">{activeEvent.details?.nonce || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">AEAD Tag:</span>{' '}
                    <span className="text-amber-400">{activeEvent.details?.tag || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">SHA-256 Digest:</span>{' '}
                    <span className="text-purple-300 truncate block max-w-full">
                      {activeEvent.details?.digest || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">RSA-PSS Signature:</span>{' '}
                    <span className="text-slate-400 truncate block max-w-full">
                      {activeEvent.details?.signature ? `${activeEvent.details.signature.slice(0, 32)}...` : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 3: Raw Wire Payload & Protocol Envelope */}
              <div className="p-3 space-y-2 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Wire Payload Representation</span>
                  <Layers className="w-3 h-3 text-slate-400" />
                </div>
                <pre className="p-2 bg-slate-950 rounded text-slate-400 text-[10px] leading-relaxed overflow-x-auto border border-slate-800">
                  {JSON.stringify(activeEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
