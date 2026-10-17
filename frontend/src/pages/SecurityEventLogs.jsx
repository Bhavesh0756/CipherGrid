import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  Terminal,
  Clock,
  Sparkles
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { api } from '../services/api';

export const SecurityEventLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [eventType, setEventType] = useState('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Detail Modal
  const [inspectedEvent, setInspectedEvent] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        offset: page * pageSize,
      };
      if (search) params.search = search;
      if (severity !== 'ALL') params.severity = severity;
      if (eventType !== 'ALL') params.event_type = eventType;

      const res = await api.getLogs(params);
      if (res.ok && res.data?.success) {
        setLogs(res.data.events);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, severity, eventType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to purge the security audit event logs from the SQLite database?')) {
      await api.clearLogs();
      fetchLogs();
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aegisgrid_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const eventTypesList = [
    'ALL',
    'DEVICE_AUTH_SUCCESS',
    'ACCESS_CONTROL_VIOLATION',
    'AES_GCM_ENCRYPT',
    'AES_GCM_DECRYPT_TAMPER',
    'AES_GCM_DECRYPT_SUCCESS',
    'SIGNATURE_VERIFIED',
    'SIGNATURE_REJECTED',
    'CERTIFICATE_VALIDATED',
    'TLS_CONNECTION_SUCCESS',
    'TLS_CONNECTION_FAILED',
  ];

  // Quick stat counts
  const criticalCount = logs.filter(l => l.severity === 'CRITICAL').length;
  const warningCount = logs.filter(l => l.severity === 'WARNING').length;
  const allowCount = logs.filter(l => l.result === 'ALLOW' || l.result === 'SUCCESS').length;

  return (
    <div className="space-y-6">
      {/* Page Header matching Reference */}
      <div className="relative overflow-hidden bg-[#0a1220] border border-[#14243b] rounded-2xl p-6 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Security Audit & Telemetry Ledger
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                  SQLite Journal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tamper-evident, zero-leak event journal persisted in SQLite. Cryptographic secrets and private keys are never logged.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-[#0c1626] hover:bg-[#112036] text-slate-200 text-xs font-semibold border border-[#162942] flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON Ledger</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3.5 py-2 rounded-xl bg-[#2a1218]/85 hover:bg-[#381820] text-rose-300 text-xs font-semibold border border-rose-500/50 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)] active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Purge Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0b1524] border border-[#14243b] flex items-center gap-3.5 relative overflow-hidden shadow-xl card-hover">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 shadow-inner">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total Registered</div>
            <div className="text-xl font-bold text-white font-mono-code">{total}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1524] border border-[#14243b] flex items-center gap-3.5 relative overflow-hidden shadow-xl card-hover">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 shadow-inner">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Critical Alerts (Page)</div>
            <div className="text-xl font-bold text-rose-400 font-mono-code">{criticalCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1524] border border-[#14243b] flex items-center gap-3.5 relative overflow-hidden shadow-xl card-hover">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-inner">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Warnings (Page)</div>
            <div className="text-xl font-bold text-amber-400 font-mono-code">{warningCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1524] border border-[#14243b] flex items-center gap-3.5 relative overflow-hidden shadow-xl card-hover">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Allowed / Verified</div>
            <div className="text-xl font-bold text-emerald-400 font-mono-code">{allowCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1524] border border-[#14243b] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Device ID, action, message, or cryptographic event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#08101c] border border-[#14243b] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono-code"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#0e2a38]/85 hover:bg-[#13384a] text-cyan-300 text-xs font-semibold border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all active:scale-95 cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity Select */}
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
            className="bg-[#070b16] border border-[#1a263d] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO Only</option>
            <option value="WARNING">WARNING Only</option>
            <option value="CRITICAL">CRITICAL Only</option>
          </select>

          {/* Event Type Select */}
          <select
            value={eventType}
            onChange={(e) => { setEventType(e.target.value); setPage(0); }}
            className="bg-[#070b16] border border-[#1a263d] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-xs"
          >
            {eventTypesList.map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Event Types' : t}</option>
            ))}
          </select>

          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl bg-[#070b16] hover:bg-slate-800 text-slate-300 border border-[#1a263d] hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0b1524] border border-[#14243b] rounded-2xl overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08101c] border-b border-[#14243b] text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-3 font-semibold">Severity</th>
                <th className="py-3.5 px-3 font-semibold">Event Signature</th>
                <th className="py-3.5 px-3 font-semibold">Source Node</th>
                <th className="py-3.5 px-3 font-semibold">Verdict</th>
                <th className="py-3.5 px-4 font-semibold">Telemetry Summary</th>
                <th className="py-3.5 px-4 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14243b] font-mono-code">
              {logs.length > 0 ? (
                logs.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/25 transition-colors group">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={evt.severity} size="xs">
                        {evt.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-semibold text-cyan-300 text-[11px] whitespace-nowrap">
                      {evt.event_type}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#070b16] border border-[#1c2942] text-slate-300 text-[10px] font-mono">
                        {evt.device_id || 'AEGIS_CORE'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider inline-flex items-center gap-1 ${
                        evt.result === 'ALLOW' || evt.result === 'SUCCESS'
                          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                      }`}>
                        {evt.result === 'ALLOW' || evt.result === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        {evt.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-md truncate">
                      {evt.message}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectedEvent(evt)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#070b16] hover:bg-cyan-600/20 text-slate-300 hover:text-cyan-300 border border-[#1a263d] hover:border-cyan-500/40 text-[11px] font-sans inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="View Sanitized Cryptographic Frame"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 font-sans text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ScrollText className="w-8 h-8 text-slate-600 animate-pulse" />
                      <span>{loading ? 'Querying encrypted SQLite journal...' : 'No security events match the current filter criteria.'}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-[#08101c] border-t border-[#14243b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Displaying <strong className="text-slate-200">{logs.length}</strong> of <strong className="text-slate-200">{total}</strong> recorded telemetry events
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 rounded-lg bg-[#0b1524] hover:bg-[#0e2238] disabled:opacity-40 text-slate-300 border border-[#14243b] transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="font-mono-code text-cyan-300 px-2 py-0.5 rounded bg-[#0b1524] border border-[#14243b] text-[11px]">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 rounded-lg bg-[#0b1524] hover:bg-[#0e2238] disabled:opacity-40 text-slate-300 border border-[#14243b] transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0b1524] border border-[#14243b] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-[#14243b] pb-3.5">
              <div className="flex items-center gap-2.5">
                <Badge variant={inspectedEvent.severity} size="sm">
                  {inspectedEvent.severity}
                </Badge>
                <h3 className="font-bold text-sm text-white font-mono-code">
                  {inspectedEvent.event_type}
                </h3>
              </div>
              <button
                onClick={() => setInspectedEvent(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-[#0e2238] text-xs transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono-code bg-[#08101c] p-3.5 rounded-xl border border-[#14243b]">
              <div><span className="text-slate-500">Timestamp:</span> <span className="text-slate-300">{inspectedEvent.timestamp}</span></div>
              <div><span className="text-slate-500">Node ID:</span> <span className="text-cyan-300">{inspectedEvent.device_id || 'AEGIS_CORE'}</span></div>
              <div><span className="text-slate-500">Action:</span> <span className="text-slate-300">{inspectedEvent.action || 'N/A'}</span></div>
              <div><span className="text-slate-500">Verdict:</span> <span className={inspectedEvent.result === 'ALLOW' || inspectedEvent.result === 'SUCCESS' ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>{inspectedEvent.result}</span></div>
            </div>

            <div className="space-y-1.5 font-sans">
              <span className="text-xs text-slate-400 font-medium">Security Analyst Narrative</span>
              <p className="text-xs text-slate-200 bg-[#08101c] p-3 rounded-xl border border-[#14243b] leading-relaxed">
                {inspectedEvent.message}
              </p>
            </div>

            {inspectedEvent.details && (
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-medium">Sanitized Context & Cryptographic Hashes (JSON)</span>
                <CodeBlock code={inspectedEvent.details} maxHeight="max-h-48" />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-[#08101c] hover:bg-[#0e2238] text-slate-200 text-xs font-semibold border border-[#14243b] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
