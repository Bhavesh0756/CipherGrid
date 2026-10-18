import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  FileCode,
  Filter,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Search,
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
    const cfg: Record<string, string> = {
      Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'In transit': 'bg-violet-50 text-violet-700 border-violet-100',
      Created: 'bg-stone-50 text-stone-600 border-stone-200',
      Queued: 'bg-amber-50 text-amber-700 border-amber-100',
      Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
      Failed: 'bg-red-50 text-red-800 border-red-100',
    };
    const cls = cfg[state] || 'bg-stone-50 text-stone-600 border-stone-200';
    return <span className={`px-1.5 py-[1px] rounded-full text-[9.5px] font-medium border ${cls}`}>{state}</span>;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fafaf9' }}>
      {/* Module header */}
      <div className="px-6 pt-5 pb-3 border-b border-stone-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Radio className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Packet Inspector</h1>
              <p className="text-[11px] text-stone-400 mt-0.5">Deep event analysis — virtual simulator telemetry only</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10.5px] text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Not physical NIC traffic</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-2.5 bg-white border-b border-stone-100 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-[7px]" />
          <input
            type="text"
            placeholder="Search packet events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-[6px] border border-stone-200 rounded-lg text-[11.5px] bg-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-stone-400" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-2.5 py-[6px] border border-stone-200 rounded-lg text-[11.5px] bg-white focus:ring-1 focus:ring-violet-500 outline-none"
          >
            <option value="all">All States</option>
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
          className="flex items-center gap-1.5 px-2.5 py-[6px] border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 text-[11.5px] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <span className="ml-auto text-[11px] text-stone-400 font-mono">{filteredEvents.length} events</span>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Event list */}
        <div className="flex-1 overflow-auto bg-white border-b border-stone-200">
          {filteredEvents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-stone-400">
              <Radio className="w-7 h-7 text-stone-200 mb-2" />
              <p className="text-[11px] font-medium text-stone-500">No packet events</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Dispatch a message in Network Lab to generate traffic</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-50/95 backdrop-blur-sm border-b border-stone-100 z-10">
                <tr>
                  {['Time', 'Message ID', 'Source', 'Destination', 'Hop', 'Type', 'State', 'Security'].map(h => (
                    <th key={h} className="py-2 px-4 text-[10px] font-semibold text-stone-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => {
                  const isSelected = activeEvent?.id === ev.id;
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`cursor-pointer border-b border-stone-50 transition-colors ${
                        isSelected ? 'bg-violet-50' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="py-2 px-4 text-[10.5px] font-mono text-stone-400 whitespace-nowrap">
                        {ev.event_time.split('T')[1]?.slice(0, 12) || ev.event_time}
                      </td>
                      <td className="py-2 px-4 text-[10.5px] font-mono font-semibold text-stone-800">{ev.message_id}</td>
                      <td className="py-2 px-4 text-[10.5px] font-mono text-stone-600">{ev.source_id}</td>
                      <td className="py-2 px-4 text-[10.5px] font-mono text-stone-600">{ev.destination_id}</td>
                      <td className="py-2 px-4 text-[10.5px] font-mono font-semibold text-violet-600">{ev.current_hop}</td>
                      <td className="py-2 px-4 text-[11px] text-stone-600">{ev.message_type}</td>
                      <td className="py-2 px-4">{getStateBadge(ev.packet_state)}</td>
                      <td className="py-2 px-4 text-[10.5px]">
                        {ev.security_status === 'VERIFIED' || ev.security_status === 'ACCEPTED' ? (
                          <span className="text-emerald-600 font-medium">Verified</span>
                        ) : ev.security_status === 'DISABLED' ? (
                          <span className="text-stone-400">Disabled</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">{ev.security_status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Dissector panel */}
        {activeEvent && (
          <div className="h-[240px] bg-stone-950 text-stone-300 shrink-0 flex flex-col">
            {/* Dissector header */}
            <div className="px-4 py-2 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[11px] font-semibold text-stone-100">
                  Dissector · Event #{activeEvent.id}
                </span>
                <span className="text-[10px] font-mono text-stone-500">({activeEvent.session_id})</span>
              </div>
              <div className="flex items-center gap-2 text-[10.5px]">
                <span className="text-stone-500">Hop:</span>
                <span className="font-mono text-violet-400 bg-violet-900/30 px-2 py-[1px] rounded-md">{activeEvent.current_hop}</span>
                <span className="text-stone-500 mx-1">·</span>
                <span className="text-amber-400">{activeEvent.packet_state}</span>
              </div>
            </div>

            {/* 3-column dissector */}
            <div className="flex-1 grid grid-cols-3 divide-x divide-stone-800 overflow-y-auto font-mono text-[10.5px]">
              {/* Col 1: Routing */}
              <div className="p-3 space-y-2 overflow-y-auto">
                <div className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Routing & Hop</div>
                <div className="space-y-1.5 text-stone-400">
                  <div>Source: <span className="text-stone-100">{activeEvent.source_id}</span></div>
                  <div>Destination: <span className="text-stone-100">{activeEvent.destination_id}</span></div>
                  <div>State: <span className="text-amber-400">{activeEvent.packet_state}</span></div>
                  <div>Time: <span className="text-stone-500 text-[9.5px]">{activeEvent.event_time}</span></div>
                  <div className="pt-1.5 border-t border-stone-800">
                    <div className="text-stone-500 text-[9px] mb-1">Decision:</div>
                    <p className="font-sans text-stone-300 text-[10px] bg-stone-900/80 p-1.5 rounded-md leading-relaxed">{activeEvent.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Col 2: Crypto */}
              <div className="p-3 space-y-2 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Cryptographic</div>
                  <Lock className="w-3 h-3 text-stone-600" />
                </div>
                <div className="space-y-1.5 text-stone-400">
                  <div>Profile: <span className="text-violet-300 font-sans text-[10px]">{activeEvent.details?.security_profile || 'N/A'}</span></div>
                  <div>Nonce: <span className="text-teal-400 text-[9.5px] break-all">{activeEvent.details?.nonce || 'None'}</span></div>
                  <div>AEAD Tag: <span className="text-amber-400 text-[9.5px] break-all">{activeEvent.details?.tag || 'None'}</span></div>
                  <div>SHA-256: <span className="text-purple-400 text-[9.5px] break-all">{activeEvent.details?.digest?.slice(0, 32) || 'None'}{activeEvent.details?.digest ? '…' : ''}</span></div>
                  <div>RSA-PSS: <span className="text-stone-500 text-[9.5px]">{activeEvent.details?.signature ? `${activeEvent.details.signature.slice(0, 24)}…` : 'None'}</span></div>
                </div>
              </div>

              {/* Col 3: Wire payload */}
              <div className="p-3 space-y-2 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Wire Payload</div>
                  <Layers className="w-3 h-3 text-stone-600" />
                </div>
                <pre className="p-2 bg-stone-900 rounded-md text-stone-400 text-[9.5px] leading-relaxed overflow-x-auto border border-stone-800">
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
