import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Printer,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useSimulatorStore } from '../store/useSimulatorStore';

export const LabReports: React.FC = () => {
  const { labReport, fetchLabReport, isLoading } = useSimulatorStore();

  useEffect(() => {
    fetchLabReport();
  }, [fetchLabReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportScenarios = () => {
    window.open(api.getExportScenariosUrl(), '_blank');
  };

  const handleExportEvents = () => {
    window.open(api.getExportEventsUrl(), '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] overflow-hidden">
      {/* Top action toolbar (hidden on print) */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">Formal Industrial Security Lab Report</h2>
            <p className="text-[11px] text-slate-500">Comprehensive cryptographic audit and verification findings</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLabReport()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Report</span>
          </button>

          <button
            onClick={handleExportScenarios}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Scenarios CSV</span>
          </button>

          <button
            onClick={handleExportEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Events CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        {labReport ? (
          <div className="bg-white border border-slate-300 shadow-sm rounded-lg max-w-4xl w-full p-8 text-slate-800 select-text print:border-none print:shadow-none print:p-0">
            {/* Report Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-slate-950 uppercase tracking-tight">
                    {labReport.title}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Formal Cybersecurity Assessment & Verification Evaluation Report
                  </p>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-500">
                  <div>Date: {labReport.generated_at}</div>
                  <div>Standard: ISA/IEC 62443 & NIST SP 800-82</div>
                </div>
              </div>
            </div>

            {/* Executive Summary Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Scenarios</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {labReport.security_summary?.total_tests || 0}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Passed Tests</div>
                <div className="text-lg font-bold text-emerald-800 mt-0.5">
                  {labReport.security_summary?.passed || 0}
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded">
                <div className="text-[10px] uppercase font-bold text-rose-700">Failed Tests</div>
                <div className="text-lg font-bold text-rose-800 mt-0.5">
                  {labReport.security_summary?.failed || 0}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-[10px] uppercase font-bold text-blue-700">Success Rate</div>
                <div className="text-lg font-bold text-blue-800 mt-0.5">
                  {labReport.security_summary?.pass_rate || 0}%
                </div>
              </div>
            </div>

            {/* Section 1: Active Topology Summary */}
            <div className="mb-6 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Network Topology Summary</span>
              </h2>
              <p className="text-xs text-slate-600">
                The evaluated industrial network consists of{' '}
                <span className="font-semibold text-slate-800">
                  {labReport.topology_summary?.total_devices} virtual devices
                </span>{' '}
                connected across{' '}
                <span className="font-semibold text-slate-800">
                  {labReport.topology_summary?.total_connections} physical links
                </span>{' '}
                spanning Purdue Model Levels 0 through 3.5.
              </p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-1.5 px-2.5 border-b border-slate-200">ID</th>
                      <th className="py-1.5 px-2.5 border-b border-slate-200">Device Name</th>
                      <th className="py-1.5 px-2.5 border-b border-slate-200">Type</th>
                      <th className="py-1.5 px-2.5 border-b border-slate-200">IP Address</th>
                      <th className="py-1.5 px-2.5 border-b border-slate-200">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {labReport.topology_summary?.devices?.map((d) => (
                      <tr key={d.id}>
                        <td className="py-1 px-2.5 text-slate-500">{d.id}</td>
                        <td className="py-1 px-2.5 font-sans font-medium text-slate-800">{d.name}</td>
                        <td className="py-1 px-2.5 font-sans text-slate-600">{d.type}</td>
                        <td className="py-1 px-2.5 text-slate-800">{d.ip}</td>
                        <td className="py-1 px-2.5 font-sans text-slate-600">{d.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Security Scenarios & Empirical Results */}
            <div className="mb-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Empirical Security Test Results</span>
              </h2>

              <div className="space-y-3">
                {labReport.scenarios?.map((sc) => (
                  <div
                    key={sc.scenario_id}
                    className="p-3.5 border border-slate-200 rounded bg-slate-50/50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sc.pass_status ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="font-bold text-slate-900">{sc.name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          sc.pass_status
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sc.pass_status ? 'PASS' : 'FAIL'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <span className="font-medium text-slate-800">Objective:</span> {sc.objective}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500">Expected:</span>{' '}
                        <span className="text-slate-800 font-medium">{sc.expected_outcome}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Actual:</span>{' '}
                        <span className="text-slate-800 font-medium">{sc.actual_outcome}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-700 font-mono">
                      Reason: {sc.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Technical Conclusion */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Evaluator Conclusion & Recommendations</span>
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded border border-slate-200">
                {labReport.conclusion}
              </p>
            </div>

            {/* Signature Block */}
            <div className="border-t border-slate-200 pt-8 mt-8 flex justify-between items-center text-xs text-slate-500">
              <div>
                <div>Audited by: ICS Cybersecurity Simulation Engine</div>
                <div className="text-[10px]">Cryptographic Suite: AES-256-GCM / RSA-PSS-2048 / SHA-256</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[11px] font-semibold text-slate-800">STATUS: VERIFIED</div>
                <div className="text-[10px]">Educational Simulation Certification</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-300 mr-2" />
            <span>Compiling Lab Report...</span>
          </div>
        )}
      </div>
    </div>
  );
};
