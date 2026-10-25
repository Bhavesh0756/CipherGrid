import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Database,
  Download,
  FileCode,
  FileText,
  Filter,
  FlaskConical,
  Key,
  Layers,
  Lock,
  Network,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  Sliders,
  Terminal,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { MessageType, SecurityProfile, SimulationEvent } from '../types';

type ForensicsTab = 'dissector' | 'lifecycle' | 'forensics' | 'trace' | 'hex' | 'tamper';

interface ForensicsResult {
  overall_valid: boolean;
  integrity: {
    status: 'VERIFIED' | 'MISMATCH' | 'MISSING_DATA' | 'NOT_APPLICABLE';
    algorithm: string;
    expected_digest?: string;
    computed_digest?: string;
    matches: boolean;
    message: string;
  };
  signature: {
    status: 'VALID' | 'INVALID' | 'MISSING_DATA' | 'PROCESSING_ERROR' | 'NOT_APPLICABLE';
    algorithm: string;
    signature_b64?: string;
    public_key_pem?: string;
    valid: boolean;
    message: string;
  };
  authentication: {
    status: 'AUTHENTICATED' | 'TAG_MISMATCH' | 'MISSING_DATA' | 'PROCESSING_ERROR' | 'NOT_APPLICABLE';
    algorithm: string;
    ciphertext_b64?: string;
    nonce_b64?: string;
    tag_b64?: string;
    associated_data?: string;
    decrypted_payload?: string;
    valid: boolean;
    message: string;
  };
  authorization: {
    status: 'AUTHORIZED' | 'DENIED';
    policy: string;
    sender_role?: string;
    allowed_actions?: string[];
    message: string;
  };
  rejection_details: {
    policy_rule_id: string;
    reason_code: string;
    device_trust_status: string;
    audit_event_id: string;
    explanation: string;
  };
  tamper_simulation?: {
    is_tampered_test: boolean;
    tampered_fields: string[];
    detected: boolean;
    tamper_alert: string;
  };
}

// Wireshark-Style Hex Dump Generator derived directly from actual payload bytes
function generateHexDump(input: string): { offset: string; hex: string; ascii: string }[] {
  if (!input) return [];
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const lines: { offset: string; hex: string; ascii: string }[] = [];
  const chunkSize = 16;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    const offset = i.toString(16).padStart(4, '0');

    const hexParts: string[] = [];
    let asciiPart = '';

    for (let j = 0; j < chunkSize; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexParts.push(b.toString(16).padStart(2, '0'));
        asciiPart += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
      } else {
        hexParts.push('  ');
      }
    }

    const hexFirst = hexParts.slice(0, 8).join(' ');
    const hexSecond = hexParts.slice(8).join(' ');
    lines.push({
      offset,
      hex: `${hexFirst}  ${hexSecond}`,
      ascii: asciiPart,
    });
  }
  return lines;
}

export const PacketInspector: React.FC = () => {
  const {
    devices,
    fetchTopology,
    simulationEvents,
    selectedEvent,
    setSelectedEvent,
    activeSessionId,
    dispatchMessage,
  } = useSimulatorStore();

  const [dbEvents, setDbEvents] = useState<SimulationEvent[]>([]);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ForensicsTab>('dissector');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Forensic Verification State
  const [forensicData, setForensicData] = useState<ForensicsResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [forensicError, setForensicError] = useState<string | null>(null);

  // Tamper Sandbox State (Safe non-destructive testing on copied packet)
  const [tamperMode, setTamperMode] = useState<boolean>(false);
  const [tamperPayloadText, setTamperPayloadText] = useState<string>('');
  const [tamperTag, setTamperTag] = useState<boolean>(false);
  const [tamperSig, setTamperSig] = useState<boolean>(false);
  const [tamperCt, setTamperCt] = useState<boolean>(false);
  const [isTamperTesting, setIsTamperTesting] = useState<boolean>(false);
  const [tamperTestResult, setTamperTestResult] = useState<ForensicsResult | null>(null);

  // Dispatch Packet Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchSender, setDispatchSender] = useState<string>('');
  const [dispatchReceiver, setDispatchReceiver] = useState<string>('');
  const [dispatchType, setDispatchType] = useState<MessageType>('Sensor Reading');
  const [dispatchPayload, setDispatchPayload] = useState<string>('{"temperature": 48.2, "rpm": 3600, "status": "NOMINAL"}');
  const [dispatchProfile, setDispatchProfile] = useState<SecurityProfile>('Authenticated Secure Communication');
  const [dispatchScenario, setDispatchScenario] = useState<string>('normal');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    if (devices.length === 0) {
      fetchTopology();
    }
  }, []);

  useEffect(() => {
    if (devices.length > 0 && !dispatchSender) {
      setDispatchSender(devices[0].id);
      if (devices.length > 1) {
        setDispatchReceiver(devices[devices.length - 1].id);
      }
    }
  }, [devices]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPacketEvents({
        limit: 150,
        state: filterState !== 'all' ? filterState : undefined,
        search: searchQuery.trim() || undefined,
      });

      const mapped: SimulationEvent[] = (res.events || []).map((ev: any) => ({
        id: String(ev.id),
        frame_id: ev.frame_id || (ev.id ? `FRAME-${String(ev.id).padStart(4, '0')}` : undefined),
        session_id: ev.session_id,
        message_id: ev.message_id,
        event_time: ev.timestamp || new Date().toISOString(),
        source_id: ev.source_device,
        destination_id: ev.destination_device,
        current_hop: ev.current_hop,
        next_hop: ev.next_hop,
        message_type: ev.wire_details?.message_type || 'Sensor Reading',
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
  }, [activeSessionId, filterState]);

  const displayEvents = dbEvents.length > 0 ? dbEvents : simulationEvents;

  const filteredEvents = useMemo(() => {
    return displayEvents.filter((ev) => {
      const matchesState = filterState === 'all' || ev.packet_state === filterState;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesState;
      const matchesSearch =
        ev.message_id.toLowerCase().includes(q) ||
        ev.source_id.toLowerCase().includes(q) ||
        ev.destination_id.toLowerCase().includes(q) ||
        ev.current_hop.toLowerCase().includes(q) ||
        (ev.frame_id && ev.frame_id.toLowerCase().includes(q)) ||
        ev.message_type.toLowerCase().includes(q) ||
        (ev.explanation && ev.explanation.toLowerCase().includes(q));
      return matchesState && matchesSearch;
    });
  }, [displayEvents, filterState, searchQuery]);

  const activeEvent = selectedEvent || (filteredEvents.length > 0 ? filteredEvents[0] : null);

  // Helper to determine cryptographic envelope field rendering
  const getEnvelopeFieldStatus = (
    field: 'nonce' | 'tag' | 'digest' | 'signature',
    event: SimulationEvent | null
  ) => {
    if (!event) return { text: 'N/A', cls: 'text-slate-500 font-mono' };
    const p = (event.details?.security_profile || '').toLowerCase();
    const isGcmExpected = /gcm|aes|encrypt|authenticated/i.test(p);
    const isShaExpected = /sha|digest|integrity|authenticated/i.test(p);
    const isRsaExpected = /rsa|authenticated/i.test(p);

    if (field === 'nonce') {
      if (event.details?.nonce) {
        return { text: event.details.nonce, cls: 'text-emerald-400 font-mono font-bold' };
      }
      if (isGcmExpected) {
        return { text: 'Missing Data (Processing Error)', cls: 'text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30' };
      }
      return { text: 'N/A (Unencrypted)', cls: 'text-slate-500 font-mono' };
    }

    if (field === 'tag') {
      if (event.details?.tag) {
        return { text: event.details.tag, cls: 'text-amber-400 font-mono font-bold' };
      }
      if (isGcmExpected) {
        return { text: 'Missing Data (Processing Error)', cls: 'text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30' };
      }
      return { text: 'N/A (No MAC)', cls: 'text-slate-500 font-mono' };
    }

    if (field === 'digest') {
      if (event.details?.digest) {
        const d = String(event.details.digest);
        return { text: `${d.slice(0, 36)}...`, cls: 'text-purple-400 font-mono font-bold' };
      }
      if (isShaExpected) {
        return { text: 'Missing Data (Not Generated)', cls: 'text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30' };
      }
      return { text: 'N/A (No Digest)', cls: 'text-slate-500 font-mono' };
    }

    if (field === 'signature') {
      if (event.details?.signature) {
        const s = String(event.details.signature);
        return { text: `${s.slice(0, 32)}...`, cls: 'text-slate-300 font-mono font-bold' };
      }
      if (isRsaExpected) {
        return { text: 'Missing Data (Not Generated)', cls: 'text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30' };
      }
      return { text: 'N/A (Unsigned)', cls: 'text-slate-500 font-mono' };
    }

    return { text: 'N/A', cls: 'text-slate-500 font-mono' };
  };

  // Group events for the same message to render full chronological lifecycle
  const activePacketTimeline = useMemo(() => {
    if (!activeEvent) return [];
    return displayEvents
      .filter((e) => e.message_id === activeEvent.message_id)
      .sort((a, b) => {
        const stepA = a.details?.step_index ?? 0;
        const stepB = b.details?.step_index ?? 0;
        if (stepA !== stepB) return stepA - stepB;
        return new Date(a.event_time).getTime() - new Date(b.event_time).getTime();
      });
  }, [activeEvent, displayEvents]);

  // Run backend-driven cryptographic forensic verification whenever activeEvent changes
  const runForensicsVerification = async (targetEvent = activeEvent) => {
    if (!targetEvent) return;
    setIsVerifying(true);
    setForensicError(null);
    try {
      const rawPayload = targetEvent.details?.raw_payload || '';
      const payloadStr = typeof rawPayload === 'object' ? JSON.stringify(rawPayload) : String(rawPayload);

      const res = await api.verifyPacketForensics({
        message_id: targetEvent.message_id,
        payload: payloadStr,
        sender_id: targetEvent.source_id,
        receiver_id: targetEvent.destination_id,
        security_profile: targetEvent.details?.security_profile,
        digest: targetEvent.details?.digest,
        signature: targetEvent.details?.signature,
        ciphertext: targetEvent.details?.ciphertext,
        nonce: targetEvent.details?.nonce,
        tag: targetEvent.details?.tag,
        associated_data: targetEvent.details?.associated_data,
        message_type: targetEvent.message_type,
        packet_state: targetEvent.packet_state,
        hops: targetEvent.details?.route || [targetEvent.source_id, targetEvent.destination_id],
      });

      if (res.success) {
        setForensicData(res);
      } else {
        setForensicError(res.error || 'Forensic verification failed');
      }
    } catch (err: any) {
      setForensicError(err.message || 'Network error executing cryptographic forensics');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (activeEvent) {
      runForensicsVerification(activeEvent);
      // Reset tamper sandbox on packet change
      setTamperMode(false);
      setTamperPayloadText(
        typeof activeEvent.details?.raw_payload === 'object'
          ? JSON.stringify(activeEvent.details?.raw_payload)
          : String(activeEvent.details?.raw_payload || '')
      );
      setTamperTag(false);
      setTamperSig(false);
      setTamperCt(false);
      setTamperTestResult(null);
    }
  }, [activeEvent?.id, activeEvent?.message_id]);

  // Run safe non-destructive tamper simulation on cloned packet copy
  const runTamperTest = async () => {
    if (!activeEvent) return;
    setIsTamperTesting(true);
    try {
      const rawPayload = activeEvent.details?.raw_payload || '';
      const payloadStr = typeof rawPayload === 'object' ? JSON.stringify(rawPayload) : String(rawPayload);

      const res = await api.verifyPacketForensics({
        message_id: activeEvent.message_id,
        payload: payloadStr,
        sender_id: activeEvent.source_id,
        receiver_id: activeEvent.destination_id,
        security_profile: activeEvent.details?.security_profile,
        digest: activeEvent.details?.digest,
        signature: activeEvent.details?.signature,
        ciphertext: activeEvent.details?.ciphertext,
        nonce: activeEvent.details?.nonce,
        tag: activeEvent.details?.tag,
        associated_data: activeEvent.details?.associated_data,
        message_type: activeEvent.message_type,
        packet_state: activeEvent.packet_state,
        hops: activeEvent.details?.route,
        tamper_options: {
          active: true,
          tamper_payload: tamperPayloadText !== payloadStr,
          tampered_payload_text: tamperPayloadText,
          tamper_tag: tamperTag,
          tamper_signature: tamperSig,
          tamper_ciphertext: tamperCt,
        },
      });

      setTamperTestResult(res);
    } catch (err: any) {
      setForensicError(err.message);
    } finally {
      setIsTamperTesting(false);
    }
  };

  // Quick Dispatch Packet from Packet Inspector
  const handleDispatchPacket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchSender || !dispatchReceiver) {
      setDispatchError('Select both source and destination devices.');
      return;
    }
    if (dispatchSender === dispatchReceiver) {
      setDispatchError('Source and destination devices must be distinct.');
      return;
    }
    setIsDispatching(true);
    setDispatchError(null);

    try {
      const isTamperMsg = dispatchScenario === 'tamper_msg';
      const isTamperSig = dispatchScenario === 'tamper_sig';
      const isTamperTag = dispatchScenario === 'tamper_tag';
      const isReplay = dispatchScenario === 'replay';

      const result = await dispatchMessage({
        sender_id: dispatchSender,
        receiver_id: dispatchReceiver,
        message_type: dispatchType,
        payload: dispatchPayload,
        security_profile: dispatchProfile,
        tamper_message: isTamperMsg,
        tamper_signature: isTamperSig,
        tamper_tag: isTamperTag,
        replay_attack: isReplay,
      });

      setIsDispatchModalOpen(false);
      await loadEvents();
      if (result.events && result.events.length > 0) {
        const firstEv = result.events[0];
        setSelectedEvent({
          id: String(firstEv.id),
          frame_id: firstEv.frame_id || `FRAME-${String(firstEv.id).padStart(4, '0')}`,
          session_id: firstEv.session_id,
          message_id: firstEv.message_id,
          event_time: firstEv.timestamp,
          source_id: firstEv.source_device,
          destination_id: firstEv.destination_device,
          current_hop: firstEv.current_hop,
          next_hop: firstEv.next_hop,
          message_type: dispatchType,
          packet_state: firstEv.packet_state,
          security_status: firstEv.security_status,
          details: firstEv.wire_details || {},
          explanation: firstEv.explanation || '',
        });
      }
    } catch (err: any) {
      setDispatchError(err.message || 'Simulation dispatch failed');
    } finally {
      setIsDispatching(false);
    }
  };

  // Export Forensic Analysis as JSON
  const handleExportForensics = () => {
    if (!activeEvent) return;
    const exportDoc = {
      inspector_suite: 'CipherGrid OT Packet Forensics & Wire Dissector',
      exported_at: new Date().toISOString(),
      active_frame: {
        id: activeEvent.id,
        frame_id: activeEvent.frame_id || `FRAME-${String(activeEvent.id).padStart(4, '0')}`,
        message_id: activeEvent.message_id,
        session_id: activeEvent.session_id,
        timestamp: activeEvent.event_time,
        source: activeEvent.source_id,
        destination: activeEvent.destination_id,
        current_hop: activeEvent.current_hop,
        protocol: activeEvent.message_type,
        packet_state: activeEvent.packet_state,
        security_status: activeEvent.security_status,
        explanation: activeEvent.explanation,
      },
      lifecycle_timeline: activePacketTimeline.map((ev) => ({
        step_index: ev.details?.step_index,
        frame_id: ev.frame_id,
        hop: ev.current_hop,
        next_hop: ev.next_hop,
        state: ev.packet_state,
        duration_ms: ev.details?.duration_ms,
        timestamp: ev.event_time,
        explanation: ev.explanation,
      })),
      cryptographic_forensics: forensicData,
      wire_envelope: activeEvent.details,
    };

    const blob = new Blob([JSON.stringify(exportDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphergrid_forensics_${activeEvent.message_id}_frame_${activeEvent.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const rawPayloadStr = useMemo(() => {
    if (!activeEvent) return '';
    const raw = activeEvent.details?.raw_payload;
    if (typeof raw === 'object') return JSON.stringify(raw, null, 2);
    return String(raw || '');
  }, [activeEvent]);

  const hexLines = useMemo(() => {
    return generateHexDump(rawPayloadStr);
  }, [rawPayloadStr]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
      {/* Top Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-800/80 bg-[#080d1a]/95 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  PACKET INSPECTOR & WIRE DISSECTOR
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
                  OT FORENSICS SUITE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  BACKEND CRYPTO ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Frame-level cryptographic forensics: SHA-256 Digest Verification, AES-256-GCM AEAD & RSA-PSS Signatures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-mono font-semibold shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Packet</span>
            </button>

            <button
              onClick={handleExportForensics}
              disabled={!activeEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              title="Save complete packet forensics JSON report"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export Report</span>
            </button>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Bus Mirror: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="px-6 py-2.5 bg-[#080d1a]/80 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-[9px]" />
          <input
            type="text"
            placeholder="Search frame, message ID, protocol, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-700 bg-slate-900/90 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-[9px] text-slate-500 hover:text-slate-300 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer"
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
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Sync</span>
        </button>

        <a
          href={api.getExportEventsUrl()}
          download="secure_ics_audit_log.csv"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Audit CSV</span>
        </a>

        <span className="ml-auto text-xs text-purple-400 font-mono font-semibold bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/30">
          {filteredEvents.length} Frames Streamed
        </span>
      </div>

      {/* Main Split Layout: Top Table, Bottom Multi-Tab Forensic Dissector */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#070b14]">
        {/* Packet Stream Table */}
        <div className="flex-1 overflow-auto border-b border-slate-800/80">
          {isLoading && filteredEvents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 font-mono">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-2" />
              <p className="text-xs">Synchronizing packet stream from SQLite wire bus...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-mono">
              <Radio className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">NO PACKET FRAMES RECORDED</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click <span className="text-purple-400 font-bold">"Dispatch Packet"</span> above or inject traffic in Network Lab.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead className="sticky top-0 bg-[#080d1a] border-b border-slate-800/80 z-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  {['Frame #', 'Time (UTC)', 'Message ID', 'Source Device', 'Destination', 'Current Hop', 'Protocol', 'State', 'Cryptographic Status'].map(
                    (h) => (
                      <th key={h} className="py-2.5 px-4">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredEvents.map((ev) => {
                  const isSelected = activeEvent?.id === ev.id;
                  const frameLabel = ev.frame_id || (ev.id ? `FRAME-${String(ev.id).padStart(4, '0')}` : 'FRAME-RAW');
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
                      <td className="py-2 px-4 font-bold text-purple-400 whitespace-nowrap">{frameLabel}</td>
                      <td className="py-2 px-4 text-[10.5px] text-slate-400 whitespace-nowrap">
                        {ev.event_time.split('T')[1]?.slice(0, 12) || ev.event_time}
                      </td>
                      <td className="py-2 px-4 font-medium text-slate-200">{ev.message_id}</td>
                      <td className="py-2 px-4 text-slate-200">{ev.source_id}</td>
                      <td className="py-2 px-4 text-slate-200">{ev.destination_id}</td>
                      <td className="py-2 px-4 font-semibold text-cyan-400">{ev.current_hop}</td>
                      <td className="py-2 px-4 text-slate-400">{ev.message_type}</td>
                      <td className="py-2 px-4">{getStateBadge(ev.packet_state)}</td>
                      <td className="py-2 px-4">
                        {(() => {
                          const sec = (ev.security_status || '').toLowerCase();
                          const isFailed =
                            ev.packet_state === 'Rejected' ||
                            ev.packet_state === 'Failed' ||
                            sec.includes('mismatch') ||
                            sec.includes('invalid') ||
                            sec.includes('violation') ||
                            sec.includes('attack') ||
                            sec.includes('failed') ||
                            sec.includes('tamper');

                          if (isFailed) {
                            return (
                              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {ev.security_status || 'REJECTED'}
                              </span>
                            );
                          }

                          if (ev.packet_state === 'Delivered' || sec.includes('verified')) {
                            return (
                              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                VERIFIED
                              </span>
                            );
                          }

                          if (sec.includes('disabled') || sec.includes('plaintext')) {
                            return <span className="text-slate-500 font-mono">PLAINTEXT</span>;
                          }

                          return (
                            <span className="text-blue-400 font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              {ev.security_status || 'IN TRANSIT'}
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

        {/* Lower Wireshark & Forensic Suite */}
        {activeEvent && (
          <div className="h-[340px] bg-[#050811] border-t border-slate-800/80 text-slate-300 shrink-0 flex flex-col font-mono">
            {/* Sub-Header with Frame Info & Forensic Tab Switcher */}
            <div className="px-5 py-2 bg-[#090f1e] border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white font-display uppercase tracking-wider">
                    {activeEvent.frame_id || `FRAME #${activeEvent.id}`}
                  </span>
                  <span className="text-slate-500 text-[11px]">({activeEvent.message_id})</span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setActiveTab('dissector')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeTab === 'dissector' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dissector
                  </button>
                  <button
                    onClick={() => setActiveTab('lifecycle')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'lifecycle' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Timeline ({activePacketTimeline.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('forensics')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'forensics' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>Crypto Forensics</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('trace')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'trace' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Network className="w-3 h-3" />
                    <span>Routing Trace</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('hex')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'hex' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Hex & Payload</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tamper')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      activeTab === 'tamper' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    <FlaskConical className="w-3 h-3" />
                    <span>Tamper Sandbox</span>
                  </button>
                </div>
              </div>

              {/* Hop & State Indicators */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">CURRENT HOP:</span>
                <span className="text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-bold">
                  {activeEvent.current_hop}
                </span>
                <span className="text-slate-600">&bull;</span>
                {getStateBadge(activeEvent.packet_state)}
              </div>
            </div>

            {/* TAB 1: WIRE DISSECTOR (Standard Wireshark 3-Column Dissection) */}
            {activeTab === 'dissector' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 overflow-y-auto text-xs">
                {/* Col 1: L2/L3 Routing Header */}
                <div className="p-3.5 space-y-2 overflow-y-auto">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-purple-400" />
                    <span>L2 / L3 Routing Header</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div>
                      Source Node: <span className="text-white font-semibold">{activeEvent.source_id}</span>
                    </div>
                    <div>
                      Destination Node: <span className="text-white font-semibold">{activeEvent.destination_id}</span>
                    </div>
                    <div>
                      Protocol / Type: <span className="text-cyan-400 font-semibold">{activeEvent.message_type}</span>
                    </div>
                    <div>
                      Hop Sequence: <span className="text-slate-300 font-mono text-[10px]">{activeEvent.details?.route?.join(' ➔ ') || activeEvent.current_hop}</span>
                    </div>
                    <div>
                      Cumulative Latency: <span className="text-emerald-400 font-mono">{activeEvent.details?.cumulative_ms ?? activeEvent.details?.total_latency_ms ?? 2.0} ms</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Enforcement Decision:</div>
                      <p className="text-slate-300 bg-slate-900/90 border border-slate-800 p-2 rounded-lg leading-relaxed text-[11px]">
                        {activeEvent.explanation || 'Packet routed successfully through authorized industrial conduit.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Col 2: AEAD Cryptographic Envelope */}
                <div className="p-3.5 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>AEAD Cryptographic Envelope</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">IEEE 802.1AR / NIST</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div>
                      Profile: <span className="text-slate-200 font-medium">{activeEvent.details?.security_profile || 'Plaintext Transmission'}</span>
                    </div>
                    <div>
                      GCM Nonce (96-bit):{' '}
                      {(() => {
                        const s = getEnvelopeFieldStatus('nonce', activeEvent);
                        return <span className={`break-all text-[10px] ${s.cls}`}>{s.text}</span>;
                      })()}
                    </div>
                    <div>
                      Auth Tag (128-bit MAC):{' '}
                      {(() => {
                        const s = getEnvelopeFieldStatus('tag', activeEvent);
                        return <span className={`break-all text-[10px] ${s.cls}`}>{s.text}</span>;
                      })()}
                    </div>
                    <div>
                      SHA-256 Digest:{' '}
                      {(() => {
                        const s = getEnvelopeFieldStatus('digest', activeEvent);
                        return <span className={`break-all text-[10px] ${s.cls}`}>{s.text}</span>;
                      })()}
                    </div>
                    <div>
                      RSA-PSS Signature:{' '}
                      {(() => {
                        const s = getEnvelopeFieldStatus('signature', activeEvent);
                        return <span className={`break-all text-[10px] ${s.cls}`}>{s.text}</span>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Col 3: Raw Wire Representation */}
                <div className="p-3.5 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Wire Details JSON</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(activeEvent.details, null, 2), 'wire_json')}
                      className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'wire_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-[#060913] rounded-lg text-emerald-400 text-[10px] leading-relaxed overflow-x-auto border border-slate-800/80 font-mono max-h-[200px]">
                    {JSON.stringify(activeEvent.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: PACKET LIFECYCLE TIMELINE (Requirement 1 & 10) */}
            {activeTab === 'lifecycle' && (
              <div className="flex-1 p-4 overflow-y-auto text-xs space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>CHRONOLOGICAL PACKET LIFECYCLE FOR {activeEvent.message_id}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total Hops: {activePacketTimeline.length} &bull; Route: {activeEvent.details?.route?.join(' ➔ ')}
                  </span>
                </div>

                <div className="space-y-2 font-mono">
                  {activePacketTimeline.map((step, idx) => {
                    const stepRole = step.details?.step_role || `Hop ${idx + 1}`;
                    const duration = step.details?.duration_ms ?? 1.5;
                    const isLast = idx === activePacketTimeline.length - 1;
                    const frameLabel = step.frame_id || (step.id ? `FRAME-${String(step.id).padStart(4, '0')}` : `STEP-${idx}`);

                    return (
                      <div
                        key={step.id || idx}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                          step.id === activeEvent.id
                            ? 'bg-purple-950/30 border-purple-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-purple-400 shrink-0 mt-0.5">
                            {idx}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{frameLabel}</span>
                              <span className="text-slate-500">&bull;</span>
                              <span className="text-cyan-400 font-semibold">{step.current_hop}</span>
                              {step.next_hop && (
                                <>
                                  <ArrowRight className="w-3 h-3 text-slate-500" />
                                  <span className="text-purple-300">{step.next_hop}</span>
                                </>
                              )}
                              <span className="text-slate-500">&bull;</span>
                              <span className="text-[10px] text-slate-400">{stepRole}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.explanation}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                              +{duration} ms
                            </span>
                            {getStateBadge(step.packet_state)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {step.event_time.split('T')[1]?.slice(0, 12) || step.event_time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: CRYPTOGRAPHIC FORENSICS & VERIFICATION (Requirements 2, 3, 4, 5, 6) */}
            {activeTab === 'forensics' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-[12px]">
                      INDEPENDENT CRYPTOGRAPHIC & RBAC VERIFICATION STATUS
                    </span>
                  </div>
                  <button
                    onClick={() => runForensicsVerification(activeEvent)}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>Re-verify Invariants</span>
                  </button>
                </div>

                {isVerifying ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                    <p className="text-xs">Computing real SHA-256 digest & validating RSA-PSS / AES-GCM tags...</p>
                  </div>
                ) : forensicData ? (
                  <>
                    {/* 5 Independent Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* 1. Integrity Status */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                          <span>1. Integrity (SHA-256)</span>
                          {forensicData.integrity.status === 'VERIFIED' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : forensicData.integrity.status === 'NOT_APPLICABLE' ? (
                            <Shield className="w-4 h-4 text-slate-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold text-white">
                          {forensicData.integrity.status === 'VERIFIED' ? (
                            <span className="text-emerald-400">VERIFIED</span>
                          ) : forensicData.integrity.status === 'MISMATCH' ? (
                            <span className="text-rose-400">VERIFICATION FAILED</span>
                          ) : forensicData.integrity.status === 'MISSING_DATA' ? (
                            <span className="text-rose-400">MISSING DATA</span>
                          ) : (
                            <span className="text-slate-400">NOT APPLICABLE</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{forensicData.integrity.message}</p>
                      </div>

                      {/* 2. Signature Status */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                          <span>2. Signature (RSA-PSS)</span>
                          {forensicData.signature.status === 'VALID' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : forensicData.signature.status === 'NOT_APPLICABLE' ? (
                            <Shield className="w-4 h-4 text-slate-500" />
                          ) : forensicData.signature.status === 'PROCESSING_ERROR' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold text-white">
                          {forensicData.signature.status === 'VALID' ? (
                            <span className="text-emerald-400">VERIFIED</span>
                          ) : forensicData.signature.status === 'INVALID' ? (
                            <span className="text-rose-400">VERIFICATION FAILED</span>
                          ) : forensicData.signature.status === 'MISSING_DATA' ? (
                            <span className="text-rose-400">MISSING DATA</span>
                          ) : forensicData.signature.status === 'PROCESSING_ERROR' ? (
                            <span className="text-amber-400">PROCESSING ERROR</span>
                          ) : (
                            <span className="text-slate-400">NOT APPLICABLE</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{forensicData.signature.message}</p>
                      </div>

                      {/* 3. AEAD Authentication */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                          <span>3. AEAD Auth (GCM Tag)</span>
                          {forensicData.authentication.status === 'AUTHENTICATED' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : forensicData.authentication.status === 'NOT_APPLICABLE' ? (
                            <Lock className="w-4 h-4 text-slate-500" />
                          ) : forensicData.authentication.status === 'PROCESSING_ERROR' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold text-white">
                          {forensicData.authentication.status === 'AUTHENTICATED' ? (
                            <span className="text-emerald-400">VERIFIED</span>
                          ) : forensicData.authentication.status === 'TAG_MISMATCH' ? (
                            <span className="text-rose-400">VERIFICATION FAILED</span>
                          ) : forensicData.authentication.status === 'MISSING_DATA' ? (
                            <span className="text-rose-400">MISSING DATA</span>
                          ) : forensicData.authentication.status === 'PROCESSING_ERROR' ? (
                            <span className="text-amber-400">PROCESSING ERROR</span>
                          ) : (
                            <span className="text-slate-400">NOT APPLICABLE</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{forensicData.authentication.message}</p>
                      </div>

                      {/* 4. Authorization / RBAC */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                          <span>4. Authorization (RBAC)</span>
                          {forensicData.authorization.status === 'AUTHORIZED' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold text-white">
                          {forensicData.authorization.status === 'AUTHORIZED' ? (
                            <span className="text-emerald-400">ROLE ALLOWED</span>
                          ) : (
                            <span className="text-rose-400">ADMISSION DENIED</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{forensicData.authorization.message}</p>
                      </div>

                      {/* 5. Delivery Status */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                          <span>5. Final Delivery</span>
                          {activeEvent.packet_state === 'Delivered' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div className="mt-2 text-xs font-bold">{getStateBadge(activeEvent.packet_state)}</div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {activeEvent.explanation || 'Final delivery decision reached.'}
                        </p>
                      </div>
                    </div>

                    {/* Requirement 6: Explainable Rejection Details */}
                    <div className="p-3.5 rounded-xl bg-[#090f1e] border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Explainable Security Verdict & Policy Audit Record</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400">Policy Rule ID:</span>
                          <div className="text-purple-400 font-bold mt-0.5">{forensicData.rejection_details.policy_rule_id}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Reason Code:</span>
                          <div className="text-amber-400 font-bold mt-0.5">{forensicData.rejection_details.reason_code}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Sender Trust Status:</span>
                          <div className="text-slate-200 font-bold mt-0.5">{forensicData.rejection_details.device_trust_status}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Audit Event Reference:</span>
                          <div className="text-cyan-400 font-bold mt-0.5">{forensicData.rejection_details.audit_event_id}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 mt-2 leading-relaxed">
                        {forensicData.rejection_details.explanation}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500">Click Re-verify to execute full forensic breakdown.</p>
                )}
              </div>
            )}

            {/* TAB 4: HOP-BY-HOP ROUTING TRACE (Requirement 7) */}
            {activeTab === 'trace' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Network className="w-4 h-4 text-purple-400" />
                    <span>HOP-BY-HOP ROUTING CONDUIT TRACE</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Source: {activeEvent.source_id} ➔ Destination: {activeEvent.destination_id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {(activeEvent.details?.route || [activeEvent.source_id, activeEvent.destination_id]).map(
                    (nodeId: string, idx: number, arr: string[]) => {
                      const dev = devices.find((d) => d.id === nodeId);
                      const isCurrent = activeEvent.current_hop === nodeId;
                      const isSrc = idx === 0;
                      const isDst = idx === arr.length - 1;

                      return (
                        <div
                          key={nodeId}
                          className={`p-3 rounded-xl border flex flex-col justify-between ${
                            isCurrent
                              ? 'bg-purple-950/40 border-purple-500 text-white'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-slate-500 font-bold">HOP #{idx + 1}</span>
                              <span
                                className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${
                                  isSrc
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : isDst
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}
                              >
                                {isSrc ? 'INGRESS' : isDst ? 'EGRESS' : 'TRANSIT'}
                              </span>
                            </div>
                            <div className="font-bold text-white text-[12px] flex items-center gap-1.5">
                              <span>{dev?.name || nodeId}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              IP: {dev?.ip_address || '192.168.1.x'} &bull; Tier: {dev?.purdue_level || 'Level 1'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              MAC: {dev?.mac_address || '00:1A:2B:3C:4D:xx'}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Link Latency:</span>
                            <span className="text-emerald-400 font-bold">~2.0 ms</span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: PAYLOAD & HEX DUMP (Requirement 8) */}
            {activeTab === 'hex' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 overflow-y-auto text-xs font-mono">
                {/* Hex Dump View */}
                <div className="p-3.5 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Wireshark Hexadecimal Dump (Payload Bytes)</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          hexLines.map((l) => `${l.offset}  ${l.hex}  |${l.ascii}|`).join('\n'),
                          'hex_dump'
                        )
                      }
                      className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'hex_dump' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Hex</span>
                    </button>
                  </div>
                  <div className="p-3 bg-[#040711] rounded-lg border border-slate-800 font-mono text-[10.5px] leading-relaxed overflow-x-auto text-slate-300">
                    <div className="text-[9.5px] text-slate-500 pb-1 border-b border-slate-800 mb-1">
                      OFFSET &nbsp;00 01 02 03 04 05 06 07 &nbsp;08 09 0A 0B 0C 0D 0E 0F &nbsp;ASCII
                    </div>
                    {hexLines.map((line) => (
                      <div key={line.offset} className="whitespace-pre flex gap-3">
                        <span className="text-slate-500 select-none">{line.offset}</span>
                        <span className="text-cyan-400">{line.hex}</span>
                        <span className="text-emerald-400">|{line.ascii}|</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decoded JSON Payload View */}
                <div className="p-3.5 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Decoded JSON Representation</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(rawPayloadStr, 'raw_json')}
                      className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'raw_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-[#040711] rounded-lg border border-slate-800 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-[220px]">
                    {rawPayloadStr || '// No payload bytes captured in this frame.'}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 6: SAFE TAMPER-DETECTION TESTING SANDBOX (Requirement 9) */}
            {activeTab === 'tamper' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-white text-[12px]">
                      SAFE TAMPER-DETECTION FORENSICS SANDBOX (ISOLATED CLONE)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded font-semibold">
                    Non-Destructive: Original DB record remains 100% unaltered
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Tampering Controls */}
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <div className="text-[11px] font-bold text-white uppercase">Inject Bit Alteration on Clone</div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Mutate Payload Text (Alters SHA-256 Hash):
                      </label>
                      <input
                        type="text"
                        value={tamperPayloadText}
                        onChange={(e) => setTamperPayloadText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={tamperTag}
                          onChange={(e) => setTamperTag(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                        />
                        <span>Corrupt 128-bit AES-GCM Auth Tag (Simulates In-Transit Byte Injection)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={tamperSig}
                          onChange={(e) => setTamperSig(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                        />
                        <span>Corrupt RSA-PSS 2048-bit Signature (Simulates Spoofed Identity)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={tamperCt}
                          onChange={(e) => setTamperCt(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
                        />
                        <span>Corrupt AEAD Ciphertext Block (Triggers AEAD Tag Invalidation)</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={runTamperTest}
                        disabled={isTamperTesting}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>{isTamperTesting ? 'Executing Invariant Test...' : 'Test Tamper Detection on Backend'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setTamperPayloadText(rawPayloadStr);
                          setTamperTag(false);
                          setTamperSig(false);
                          setTamperCt(false);
                          setTamperTestResult(null);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Sandbox</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Real Backend Detection Result */}
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-white uppercase">Live Cryptographic Defense Verdict</div>

                    {tamperTestResult ? (
                      <div className="space-y-2.5">
                        <div
                          className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                            tamperTestResult.overall_valid
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                              : 'bg-rose-950/40 border-rose-500 text-rose-400'
                          }`}
                        >
                          {tamperTestResult.overall_valid ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 animate-bounce" />
                          )}
                          <div>
                            <div className="font-bold text-[12px]">
                              {tamperTestResult.overall_valid ? 'TAMPER NOT DETECTED' : 'TAMPER CAUGHT BY BACKEND ENGINE'}
                            </div>
                            <div className="text-[10px] text-slate-300 mt-0.5">
                              {tamperTestResult.tamper_simulation?.tamper_alert ||
                                tamperTestResult.rejection_details.explanation}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] space-y-1.5 text-slate-300 bg-[#060913] p-2.5 rounded-lg border border-slate-800">
                          <div>
                            Policy Enforcement: <span className="text-purple-400">{tamperTestResult.rejection_details.policy_rule_id}</span>
                          </div>
                          <div>
                            Forensic Reason Code: <span className="text-rose-400 font-bold">{tamperTestResult.rejection_details.reason_code}</span>
                          </div>
                          <div>
                            Integrity Status: <span className="text-amber-400">{tamperTestResult.integrity.status}</span>
                          </div>
                          <div>
                            AEAD Tag Status: <span className="text-amber-400">{tamperTestResult.authentication.status}</span>
                          </div>
                          <div>
                            Signature Status: <span className="text-amber-400">{tamperTestResult.signature.status}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 flex flex-col items-center justify-center text-slate-500">
                        <FlaskConical className="w-8 h-8 text-slate-600 mb-2" />
                        <p className="text-xs">Select bit alteration options on the left and click "Test Tamper Detection".</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DISPATCH PACKET MODAL (Requirement 11) */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#090f1e] border border-purple-500/40 rounded-2xl shadow-2xl p-6 font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm font-display">DISPATCH SYNTHETIC OT PACKET</h3>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {dispatchError && (
              <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            <form onSubmit={handleDispatchPacket} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Source Device</label>
                  <select
                    value={dispatchSender}
                    onChange={(e) => setDispatchSender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.purdue_level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Target Device</label>
                  <select
                    value={dispatchReceiver}
                    onChange={(e) => setDispatchReceiver(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.purdue_level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Message Type</label>
                  <select
                    value={dispatchType}
                    onChange={(e) => setDispatchType(e.target.value as MessageType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="Sensor Reading">Sensor Reading</option>
                    <option value="Device Status">Device Status</option>
                    <option value="Controller Command">Controller Command</option>
                    <option value="Alarm Notification">Alarm Notification</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Security Profile</label>
                  <select
                    value={dispatchProfile}
                    onChange={(e) => setDispatchProfile(e.target.value as SecurityProfile)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="AES-256-GCM + RSA-PSS + SHA-256">AES-256-GCM + RSA-PSS + SHA-256 (Full Security)</option>
                    <option value="AES-256-GCM">AES-256-GCM (Authenticated Encryption)</option>
                    <option value="SHA-256 Digest Only">SHA-256 Digest Only (Integrity Verified)</option>
                    <option value="Plaintext Transmission">Plaintext Transmission (Unencrypted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Simulation Attack Scenario Injection
                </label>
                <select
                  value={dispatchScenario}
                  onChange={(e) => setDispatchScenario(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="normal">Benign Traffic (Normal Industrial Telemetry)</option>
                  <option value="tamper_msg">Tampered Message Payload (In-Transit Corruption)</option>
                  <option value="tamper_tag">Corrupted AES-GCM Auth Tag (Bit-Flip on Wire)</option>
                  <option value="tamper_sig">Forged / Corrupted RSA-PSS Signature</option>
                  <option value="replay">Replay Attack (Duplicate Message ID)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Payload Content</label>
                <textarea
                  rows={3}
                  value={dispatchPayload}
                  onChange={(e) => setDispatchPayload(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? 'Transmitting...' : 'Dispatch to Network'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
