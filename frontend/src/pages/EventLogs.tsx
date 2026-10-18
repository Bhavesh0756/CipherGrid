import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  ScrollText,
  Search,
  ShieldAlert,
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-hidden">
      {/* Top Filter and Action Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search audit logs by session, event, source or reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="ACCEPTED">ACCEPTED Only</option>
              <option value="REJECTED">REJECTED Only</option>
              <option value="FAILED">FAILED Only</option>
            </select>
          </div>

          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto p-4">
        {currentLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-md">
            <ScrollText className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium">No audit logs match criteria.</p>
            <p className="text-[11px] text-slate-400">Simulation events and security check records appear here.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Source → Destination</th>
                  <th className="py-2.5 px-3">Security Result</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Rejection / Audit Reason</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 font-sans">
                      {log.event_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="text-slate-900 font-medium">{log.source_id}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-slate-900 font-medium">{log.destination_id}</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {log.security_result === 'PASS' || log.security_result === 'VERIFIED' ? (
                        <span className="text-emerald-700 font-medium">{log.security_result}</span>
                      ) : (
                        <span className="text-rose-700 font-medium">{log.security_result}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {log.status === 'ACCEPTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          <span>ACCEPTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 max-w-sm truncate">
                      {log.rejection_reason || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-medium"
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

      {/* Pagination Footer */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="text-slate-500 text-[11px]">
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredLogs.length)} of {filteredLogs.length} audit records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2.5 py-1 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-slate-600 font-mono text-[11px]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2.5 py-1 border border-slate-300 rounded text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Audit Notice */}
      <div className="px-4 py-1.5 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-500 text-center">
        Note: Audit logs are recorded in SQLite for simulator verification and classroom analysis. Secret keys are never persisted in log storage.
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800">
                Audit Record #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs font-mono">
              <div>Session: <span className="text-slate-700">{selectedLog.session_id}</span></div>
              <div>Timestamp: <span className="text-slate-700">{selectedLog.timestamp}</span></div>
              <div>Source: <span className="text-slate-700">{selectedLog.source_id}</span></div>
              <div>Destination: <span className="text-slate-700">{selectedLog.destination_id}</span></div>
              <div>Status: <span className={selectedLog.status === 'ACCEPTED' ? 'text-emerald-700' : 'text-rose-700'}>{selectedLog.status}</span></div>
              <div>Reason: <span className="text-slate-700 font-sans">{selectedLog.rejection_reason || 'None'}</span></div>
              {selectedLog.details && (
                <div>
                  <div className="font-sans text-slate-500 mb-1">Details:</div>
                  <pre className="p-2 bg-slate-900 text-slate-300 rounded text-[10px] overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
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
