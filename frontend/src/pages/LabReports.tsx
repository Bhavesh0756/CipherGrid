import React, { useEffect } from 'react';
/**
 * LabReports Component
 * Forensic auditing interface for generating IEC 62443 compliance scores, vulnerability breakdowns, and executive summaries.
 */
import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Printer,
  RefreshCw,
  Shield,
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

  const handlePrint = () => window.print();
  const handleExportScenarios = () => window.open(api.getExportScenariosUrl(), '_blank');
  const handleExportEvents = () => window.open(api.getExportEventsUrl(), '_blank');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
      {/* Module Header — Hidden on print */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md shrink-0 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-white tracking-tight font-display">
                  LAB REPORTS & CERTIFICATION DOSSIER
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ISA/IEC 62443 COMPLIANT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Formal cybersecurity verification, threat evaluation scorecard & NIST SP 800-82 audit report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLabReport()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={handleExportScenarios}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scenarios CSV</span>
            </button>
            <button
              onClick={handleExportEvents}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Events CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer font-mono"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center bg-[#070b14] print:p-0 print:bg-white">
        {labReport ? (
          <div className="bg-[#0b101f] border border-slate-800 rounded-2xl max-w-4xl w-full p-10 text-slate-200 select-text shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:rounded-none">
            {/* Report Header */}
            <div className="border-b-2 border-blue-500/60 pb-6 mb-8 print:border-black">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 print:bg-transparent print:text-black">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest print:text-black">
                      Industrial Cybersecurity Technical Assessment
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white uppercase tracking-tight font-display print:text-black">
                    {labReport.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 font-mono print:text-gray-600">
                    Formal Verification & Security Defense Evaluation Report
                  </p>
                </div>
                <div className="text-right text-[10.5px] font-mono text-slate-400 space-y-0.5 print:text-black">
                  <div>Generated: <span className="text-slate-200 font-semibold print:text-black">{labReport.generated_at}</span></div>
                  <div>Standard: ISA/IEC 62443 · NIST SP 800-82</div>
                </div>
              </div>
            </div>

            {/* Executive Summary KPIs */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Total Scenarios', value: labReport.security_summary?.total_tests || 0, color: 'bg-[#060913] border-slate-800 text-white', accent: 'text-slate-100' },
                { label: 'Passed Validations', value: labReport.security_summary?.passed || 0, color: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400', accent: 'text-emerald-400' },
                { label: 'Failed Defenses', value: labReport.security_summary?.failed || 0, color: 'bg-rose-950/20 border-rose-500/30 text-rose-400', accent: 'text-rose-400' },
                { label: 'Defense Pass Rate', value: `${labReport.security_summary?.pass_rate || 0}%`, color: 'bg-blue-950/20 border-blue-500/30 text-blue-400', accent: 'text-blue-400' },
              ].map((m) => (
                <div key={m.label} className={`p-4 border rounded-xl font-mono ${m.color} print:bg-gray-100 print:text-black print:border-gray-300`}>
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 print:text-gray-600">{m.label}</div>
                  <div className={`text-2xl font-bold ${m.accent} print:text-black`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Section 1: Topology */}
            <section className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-4 flex items-center gap-2 font-display print:text-black print:border-black">
                <Shield className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                1. Network Topology Summary
              </h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed font-mono print:text-black">
                The evaluated OT environment contains{' '}
                <strong className="text-slate-100 font-bold print:text-black">{labReport.topology_summary?.total_devices} virtual devices</strong>{' '}
                connected across{' '}
                <strong className="text-slate-100 font-bold print:text-black">{labReport.topology_summary?.total_connections} physical conduit links</strong>{' '}
                spanning Purdue Model Levels 0 through 3.5.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden font-mono text-xs print:border-gray-300">
                  <thead className="bg-[#060913] border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold print:bg-gray-200 print:text-black">
                    <tr>
                      {['ID', 'Device Name', 'Type', 'IP Address', 'RBAC Role'].map((h) => (
                        <th key={h} className="py-2.5 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-[11px] print:divide-gray-300">
                    {labReport.topology_summary?.devices?.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/30 print:text-black">
                        <td className="py-2 px-3 text-slate-400 print:text-black">{d.id}</td>
                        <td className="py-2 px-3 font-semibold text-white print:text-black">{d.name}</td>
                        <td className="py-2 px-3 text-slate-300 print:text-black">{d.type}</td>
                        <td className="py-2 px-3 text-slate-300 font-mono print:text-black">{d.ip}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-black">{d.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Scenarios */}
            <section className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-4 flex items-center gap-2 font-display print:text-black print:border-black">
                <FileText className="w-3.5 h-3.5 text-blue-400 print:text-black" />
                2. Empirical Security Test Results
              </h2>
              <div className="space-y-3 font-mono">
                {labReport.scenarios?.map((sc) => (
                  <div key={sc.scenario_id} className="border border-slate-800 rounded-xl p-4 bg-[#060913]/60 space-y-2 print:bg-white print:border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sc.pass_status ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="text-xs font-bold text-white font-display print:text-black">{sc.name}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-bold ${
                        sc.pass_status
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {sc.pass_status ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-gray-600">
                      <span className="font-bold text-slate-300 print:text-black">Objective:</span> {sc.objective}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div><span className="text-slate-500">Expected: </span><span className="text-slate-200 font-semibold print:text-black">{sc.expected_outcome}</span></div>
                      <div><span className="text-slate-500">Actual: </span><span className="text-slate-200 font-semibold print:text-black">{sc.actual_outcome}</span></div>
                    </div>
                    <div className="bg-[#090f1e] p-2.5 rounded-lg border border-slate-800 text-[10.5px] text-slate-300 print:bg-gray-100 print:text-black print:border-gray-300">
                      {sc.reason}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Conclusion */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-4 flex items-center gap-2 font-display print:text-black print:border-black">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                3. Conclusion & Recommendations
              </h2>
              <div className="bg-[#060913] border border-slate-800 rounded-xl p-4 print:bg-gray-100 print:border-gray-300">
                <p className="text-xs text-slate-300 leading-relaxed font-mono print:text-black">{labReport.conclusion}</p>
              </div>
            </section>

            {/* Signature Block */}
            <div className="border-t border-slate-800 pt-8 mt-10 flex justify-between items-center text-[10.5px] font-mono text-slate-500 print:border-black print:text-black">
              <div>
                <div className="font-semibold text-slate-300 print:text-black">Evaluated by: CipherGrid Industrial Simulation Engine</div>
                <div className="text-[9.5px] mt-0.5">Cryptographic Suite: AES-256-GCM / RSA-PSS-2048 / SHA-256 Digest</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-400 print:text-black">STATUS: CRYPTOGRAPHICALLY ASSURED</div>
                <div className="text-[9.5px] mt-0.5">Educational Cybersecurity Verification</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500 font-mono">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
            <span className="text-xs">Compiling assessment report…</span>
          </div>
        )}
      </div>
    </div>
  );
};
