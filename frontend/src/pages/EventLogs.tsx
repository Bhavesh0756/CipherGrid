import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  ScrollText,
  Search,
  Shield,
  Terminal,
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

  const accepted = logs.filter((l) => l.status === 'ACCEPTED').length;
  const rejected = logs.filter((l) => l.status !== 'ACCEPTED').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  PERSISTENT RELATIONAL AUDIT LOGS
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  SQLITE 3 ENGINED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Immutable cybersecurity audit trail, tamper detections, RBAC denials & delivery records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {accepted} Accepted
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {rejected} Rejected
              </span>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-2.5 bg-[#080d1a]/60 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-[9px]" />
          <input
            type="text"
            placeholder="Search by session, event, source, or reason..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="px-3 py-1.5 border border-slate-700 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-400"
          >
            <option value="all">All Statuses</option>
            <option value="ACCEPTED">Accepted Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <span className="ml-auto text-xs text-sky-400 font-mono font-semibold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
          {filteredLogs.length} Audit Records Found
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {currentLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-[#0d1424] rounded-2xl border border-slate-800 font-mono">
            <ScrollText className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-xs font-bold text-slate-300">NO AUDIT RECORDS FOUND</p>
            <p className="text-[11px] text-slate-500 mt-1">Simulation audit entries will appear here automatically</p>
          </div>
        ) : (
          <div className="bg-[#0d1424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#080d1a] text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {['Timestamp (UTC)', 'Event Type', 'Source → Destination', 'Security Outcome', 'Decision', 'Policy Explanation', 'Action'].map((h) => (
                    <th key={h} className="py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-[10.5px] text-slate-400 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">{log.event_type}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-mono">
                      <span>{log.source_id}</span>
                      <span className="text-slate-600 mx-1.5">➔</span>
                      <span>{log.destination_id}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      {log.security_result === 'PASS' || log.security_result === 'VERIFIED' ? (
                        <span className="text-emerald-400 font-bold">{log.security_result}</span>
                      ) : (
                        <span className="text-rose-400 font-bold">{log.security_result}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {log.status === 'ACCEPTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-2.5 h-2.5" /> ACCEPTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-2.5 h-2.5" /> REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-[240px] truncate text-[11px]">
                      {log.rejection_reason || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10.5px] font-semibold transition-colors cursor-pointer"
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
      <div className="px-6 py-2.5 bg-[#080d1a]/90 border-t border-slate-800/80 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="text-slate-400">
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredLogs.length)} of {filteredLogs.length} audit records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="text-slate-300 font-semibold px-1.5">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-[#060913]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101f] rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden font-mono">
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080d1a]">
              <div>
                <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider">
                  Audit Record #{selectedLog.id}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Session: {selectedLog.session_id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2.5 text-xs font-mono">
              {[
                { k: 'Timestamp', v: selectedLog.timestamp },
                { k: 'Source', v: selectedLog.source_id },
                { k: 'Destination', v: selectedLog.destination_id },
                { k: 'Decision', v: selectedLog.status, colored: true },
                { k: 'Security Engine', v: selectedLog.security_result },
                { k: 'Rejection Reason', v: selectedLog.rejection_reason || 'Authorized by Admission Policy' },
              ].map((row) => (
                <div key={row.k} className="flex gap-2 py-1 border-b border-slate-800/50">
                  <span className="text-slate-400 w-32 shrink-0">{row.k}:</span>
                  <span className={row.colored
                    ? selectedLog.status === 'ACCEPTED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                    : 'text-slate-200'
                  }>{row.v}</span>
                </div>
              ))}
              {selectedLog.details && (
                <div className="pt-2">
                  <div className="text-slate-400 mb-1 text-[10px] uppercase font-bold">Raw Payload Context:</div>
                  <pre className="p-3 bg-[#060913] text-cyan-300 rounded-xl text-[10px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-[#080d1a] border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
