import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  ScrollText,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const EventLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        decision: filterStatus === 'all' ? undefined : filterStatus,
        limit: 100,
      });
      const mappedLogs: AuditLog[] = (res.logs || []).map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp,
        session_id: l.session_id || 'N/A',
        event_type: l.event_type,
        source_id: l.source_device,
        destination_id: l.destination_device || 'BROADCAST',
        security_result: l.security_result,
        status: (l.decision === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED') as any,
        rejection_reason: l.rejection_reason,
        details: l.details || {},
      }));
      setLogs(mappedLogs);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterStatus]);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.session_id.toLowerCase().includes(q) ||
      l.event_type.toLowerCase().includes(q) ||
      l.source_id.toLowerCase().includes(q) ||
      l.destination_id.toLowerCase().includes(q) ||
      (l.rejection_reason && l.rejection_reason.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const currentLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);

  const handleExportCSV = () => {
    window.open(api.getExportEventsUrl(), '_blank');
  };

  const accepted = logs.filter(l => l.status === 'ACCEPTED').length;
  const rejected = logs.filter(l => l.status !== 'ACCEPTED').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fafaf9' }}>
      {/* Module header */}
      <div className="px-6 pt-5 pb-3 border-b border-stone-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Event Logs</h1>
              <p className="text-[11px] text-stone-400 mt-0.5">Persistent security audit records from SQLite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {accepted} accepted
              </span>
              <span className="text-stone-300">·</span>
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {rejected} rejected
              </span>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-[6px] bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11.5px] font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 py-2.5 bg-white border-b border-stone-100 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-[7px]" />
          <input
            type="text"
            placeholder="Search by session, event, source, or reason…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-8 pr-3 py-[6px] border border-stone-200 rounded-lg text-[11.5px] bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-stone-400" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="px-2.5 py-[6px] border border-stone-200 rounded-lg text-[11.5px] bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-[6px] border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 text-[11.5px] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <span className="ml-auto text-[11px] text-stone-400 font-mono">{filteredLogs.length} records</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {currentLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-stone-400 bg-white rounded-xl border border-stone-200/60">
            <ScrollText className="w-8 h-8 text-stone-200 mb-3" />
            <p className="text-[12px] font-medium text-stone-500">No audit records match your criteria</p>
            <p className="text-[11px] text-stone-400 mt-1">Simulation events appear here after running scenarios</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200/60 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  {['Timestamp', 'Event Type', 'Source → Destination', 'Security', 'Status', 'Reason', ''].map(h => (
                    <th key={h} className="py-2.5 px-4 text-[10px] font-semibold text-stone-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-stone-50 hover:bg-blue-50/20 transition-colors">
                    <td className="py-2.5 px-4 text-[10.5px] font-mono text-stone-400 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 px-4 text-[11.5px] font-semibold text-stone-800">{log.event_type}</td>
                    <td className="py-2.5 px-4 text-[10.5px] font-mono text-stone-600">
                      <span className="text-stone-800">{log.source_id}</span>
                      <span className="text-stone-300 mx-1.5">→</span>
                      <span className="text-stone-800">{log.destination_id}</span>
                    </td>
                    <td className="py-2.5 px-4 text-[10.5px]">
                      {log.security_result === 'PASS' || log.security_result === 'VERIFIED' ? (
                        <span className="text-emerald-600 font-medium">{log.security_result}</span>
                      ) : (
                        <span className="text-rose-600 font-medium">{log.security_result}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {log.status === 'ACCEPTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle className="w-2.5 h-2.5" /> Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9.5px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                          <XCircle className="w-2.5 h-2.5" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[10.5px] text-stone-500 max-w-[200px] truncate">
                      {log.rejection_reason || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-[10.5px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-2.5 bg-white border-t border-stone-100 flex items-center justify-between shrink-0">
        <div className="text-[11px] text-stone-400">
          {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredLogs.length)} of {filteredLogs.length} records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2.5 py-[4px] border border-stone-200 rounded-md text-[11.5px] text-stone-600 disabled:opacity-40 hover:bg-stone-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-[11px] text-stone-500 font-mono px-1">{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2.5 py-[4px] border border-stone-200 rounded-md text-[11.5px] text-stone-600 disabled:opacity-40 hover:bg-stone-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Audit footer */}
      <div className="px-6 py-1.5 bg-stone-50 border-t border-stone-100 text-[10px] text-stone-400 text-center shrink-0">
        SQLite-persisted audit records · Secret keys never stored in logs
      </div>

      {/* Log detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-lg w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-[12.5px] font-semibold text-stone-800">Audit Record #{selectedLog.id}</h3>
                <p className="text-[10px] text-stone-400 mt-0.5 font-mono">{selectedLog.session_id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2 text-[11.5px] font-mono">
              {[
                { k: 'Timestamp', v: selectedLog.timestamp },
                { k: 'Source', v: selectedLog.source_id },
                { k: 'Destination', v: selectedLog.destination_id },
                { k: 'Status', v: selectedLog.status, colored: true },
                { k: 'Security', v: selectedLog.security_result },
                { k: 'Reason', v: selectedLog.rejection_reason || 'None', mono: false },
              ].map((row) => (
                <div key={row.k} className="flex gap-2">
                  <span className="text-stone-400 w-24 shrink-0">{row.k}:</span>
                  <span className={row.colored
                    ? selectedLog.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-rose-700'
                    : 'text-stone-700'
                  }>{row.v}</span>
                </div>
              ))}
              {selectedLog.details && (
                <div className="pt-2">
                  <div className="text-stone-400 mb-1">Details:</div>
                  <pre className="p-2.5 bg-stone-900 text-stone-400 rounded-lg text-[9.5px] overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-[6px] bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-[11.5px] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
