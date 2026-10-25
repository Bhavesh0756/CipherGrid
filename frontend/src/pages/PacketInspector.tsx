import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Code2,
  FileCode,
  Filter,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Terminal,
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
        message_type: ev.wire_details?.message_type || 'Industrial Telemetry',
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
      Delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'In transit': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      Created: 'bg-slate-800 text-slate-300 border-slate-700',
      Queued: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      Rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      Failed: 'bg-rose-900/40 text-rose-300 border-rose-500/40',
    };
    const cls = cfg[state] || 'bg-slate-800 text-slate-300 border-slate-700';
    return <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${cls}`}>{state.toUpperCase()}</span>;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  PACKET INSPECTOR & WIRE DISSECTOR
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  WIRESHARK OT SUITE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Frame-level cryptographic dissection: AES-256-GCM Nonce, 128-bit MAC Tag & RSA-PSS Signatures
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Virtual SCADA Bus Mirror</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-2.5 bg-[#080d1a]/60 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-[9px]" />
          <input
            type="text"
            placeholder="Search message ID, device, protocol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-400"
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
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>

        <span className="ml-auto text-xs text-purple-400 font-mono font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
          {filteredEvents.length} Packets Captured
        </span>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#070b14]">
        {/* Packet Stream Table */}
        <div className="flex-1 overflow-auto border-b border-slate-800/80">
          {filteredEvents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-mono">
              <Radio className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">NO PACKET FRAMES RECORDED</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Inject a packet in Network Lab to start capturing wire traffic</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead className="sticky top-0 bg-[#080d1a] border-b border-slate-800/80 z-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  {['Time (UTC)', 'Packet ID', 'Source Device', 'Destination', 'Current Hop', 'Protocol', 'State', 'Cryptographic Status'].map(h => (
                    <th key={h} className="py-2.5 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredEvents.map((ev) => {
                  const isSelected = activeEvent?.id === ev.id;
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-950/40 border-l-4 border-l-purple-500 text-white'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-4 text-[10.5px] text-slate-400 whitespace-nowrap">
                        {ev.event_time.split('T')[1]?.slice(0, 12) || ev.event_time}
                      </td>
                      <td className="py-2 px-4 font-medium text-slate-200">{ev.message_id}</td>
                      <td className="py-2 px-4 text-slate-200">{ev.source_id}</td>
                      <td className="py-2 px-4 text-slate-200">{ev.destination_id}</td>
                      <td className="py-2 px-4 font-semibold text-purple-400">{ev.current_hop}</td>
                      <td className="py-2 px-4 text-slate-400">{ev.message_type}</td>
                      <td className="py-2 px-4">{getStateBadge(ev.packet_state)}</td>
                      <td className="py-2 px-4">
                        {(() => {
                          const secStatus = (ev.security_status || '').toLowerCase();
                          const isFailed =
                            ev.packet_state === 'Rejected' ||
                            ev.packet_state === 'Failed' ||
                            secStatus.includes('mismatch') ||
                            secStatus.includes('invalid') ||
                            secStatus.includes('violation') ||
                            secStatus.includes('attack') ||
                            secStatus.includes('failed') ||
                            secStatus.includes('denied') ||
                            secStatus.includes('unavailable');

                          const isVerified =
                            secStatus.includes('verified') ||
                            secStatus.includes('accepted') ||
                            secStatus.includes('valid') ||
                            secStatus.includes('passed') ||
                            secStatus.includes('authenticated');

                          if (isFailed) {
                            return (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {ev.security_status || 'REJECTED'}
                              </span>
                            );
                          }

                          if (isVerified || ev.packet_state === 'Delivered') {
                            return (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                VERIFIED
                              </span>
                            );
                          }

                          if (secStatus.includes('disabled')) {
                            return <span className="text-slate-500">DISABLED</span>;
                          }

                          return (
                            <span className="text-blue-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              {ev.security_status || 'AUTHENTICATED'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Wireshark Dissector Panel */}
        {activeEvent && (
          <div className="h-[250px] bg-[#050811] border-t border-slate-800/80 text-slate-300 shrink-0 flex flex-col font-mono">
            {/* Dissector Header */}
            <div className="px-5 py-2 bg-[#090f1e] border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white font-display uppercase tracking-wider">
                  DISSECTOR STREAM: FRAME #{activeEvent.id}
                </span>
                <span className="text-slate-500">({activeEvent.session_id})</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">HOP:</span>
                <span className="text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-bold">
                  {activeEvent.current_hop}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-semibold">{activeEvent.packet_state}</span>
              </div>
            </div>

            {/* 3-Column Wire Dissection */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 overflow-y-auto text-xs">
              {/* Col 1: Routing & Verdict */}
              <div className="p-3.5 space-y-2 overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  L2/L3 Routing Header
                </div>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div>Source Device: <span className="text-white font-semibold">{activeEvent.source_id}</span></div>
                  <div>Destination Device: <span className="text-white font-semibold">{activeEvent.destination_id}</span></div>
                  <div>Packet State: <span className="text-amber-400 font-bold">{activeEvent.packet_state}</span></div>
                  <div>Event Timestamp: <span className="text-slate-400">{activeEvent.event_time}</span></div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Policy Enforcement Decision:</div>
                    <p className="text-slate-300 bg-slate-900/90 border border-slate-800 p-2 rounded-lg leading-relaxed text-[11px]">
                      {activeEvent.explanation || 'Packet routed successfully through authorized industrial conduit.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Col 2: Cryptographic Envelope */}
              <div className="p-3.5 space-y-2 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    AEAD Cryptographic Envelope
                  </div>
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div>Profile: <span className="text-slate-200 font-medium">{activeEvent.details?.security_profile || (activeEvent.security_status ? 'AES-256-GCM AEAD' : 'N/A')}</span></div>
                  <div>GCM Nonce (96-bit): <span className="text-emerald-400 break-all text-[10px]">{activeEvent.details?.nonce || 'N/A (Unencrypted)'}</span></div>
                  <div>Auth Tag (128-bit): <span className="text-amber-400 break-all text-[10px]">{activeEvent.details?.tag || 'N/A (No MAC)'}</span></div>
                  <div>SHA-256 Digest: <span className="text-purple-400 break-all text-[10px]">{activeEvent.details?.digest ? `${activeEvent.details.digest.slice(0, 36)}...` : 'N/A'}</span></div>
                  <div>RSA-PSS Signature: <span className="text-slate-400 text-[10px]">{activeEvent.details?.signature ? `${activeEvent.details.signature.slice(0, 32)}...` : 'N/A (Unsigned)'}</span></div>
                </div>
              </div>

              {/* Col 3: Raw Wire Representation */}
              <div className="p-3.5 space-y-2 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Wire Payload (Hex / JSON)
                  </div>
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <pre className="p-2.5 bg-[#060913] rounded-lg text-emerald-400 text-[10px] leading-relaxed overflow-x-auto border border-slate-800/80">
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
