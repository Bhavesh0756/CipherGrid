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
  Eye
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
    if (confirm('Are you sure you want to clear the security audit event logs in SQLite?')) {
      await api.clearLogs();
      fetchLogs();
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `securesim_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1629]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Security Event & Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Searchable, tamper-evident event records persisted in SQLite database. Secrets and private keys are strictly excluded.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-medium border border-rose-600/40 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl p-4 shadow-lg shadow-black/20 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Device ID, Action, Event Type, or Message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity Select */}
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          {/* Event Type Select */}
          <select
            value={eventType}
            onChange={(e) => { setEventType(e.target.value); setPage(0); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {eventTypesList.map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Event Types' : t}</option>
            ))}
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0d1629]/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3">Device ID</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-4">Message Summary</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code">
              {logs.length > 0 ? (
                logs.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={evt.severity} size="xs">
                        {evt.severity}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-cyan-300 text-[11px] whitespace-nowrap">
                      {evt.event_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {evt.device_id || 'SYSTEM'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        evt.result === 'ALLOW' || evt.result === 'SUCCESS'
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                      }`}>
                        {evt.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans text-xs max-w-md truncate">
                      {evt.message}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setInspectedEvent(evt)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="View Detailed Context"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500 font-sans text-xs">
                    {loading ? 'Querying security logs...' : 'No security events match the current filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {logs.length} of {total} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono-code text-slate-300">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1629] border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={inspectedEvent.severity} size="sm">
                  {inspectedEvent.severity}
                </Badge>
                <h3 className="font-bold text-sm text-white font-mono-code">
                  {inspectedEvent.event_type}
                </h3>
              </div>
              <button
                onClick={() => setInspectedEvent(null)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono-code">
              <div><span className="text-slate-400">Timestamp:</span> {inspectedEvent.timestamp}</div>
              <div><span className="text-slate-400">Device ID:</span> {inspectedEvent.device_id || 'SYSTEM'}</div>
              <div><span className="text-slate-400">Action:</span> {inspectedEvent.action || 'N/A'}</div>
              <div><span className="text-slate-400">Result:</span> {inspectedEvent.result}</div>
              <div className="font-sans pt-1">
                <span className="text-slate-400 block mb-0.5">Explanation:</span>
                <p className="text-slate-200 bg-slate-900 p-2.5 rounded border border-slate-800 leading-relaxed">
                  {inspectedEvent.message}
                </p>
              </div>
            </div>

            {inspectedEvent.details && (
              <div>
                <span className="text-xs text-slate-400 block mb-1">Sanitized Event Details:</span>
                <CodeBlock code={inspectedEvent.details} maxHeight="max-h-40" />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedEvent(null)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
