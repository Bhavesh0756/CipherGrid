import React, { useEffect } from 'react';
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
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fafaf9' }}>
      {/* Module header — hidden on print */}
      <div className="px-6 pt-5 pb-4 border-b border-stone-100 bg-white shrink-0 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-tight">Lab Reports</h1>
              <p className="text-[11px] text-stone-400 mt-0.5">Formal security evaluation · ISA/IEC 62443 & NIST SP 800-82</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLabReport()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-[6px] border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 text-[11.5px] font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button
              onClick={handleExportScenarios}
              className="flex items-center gap-1.5 px-3 py-[6px] border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 text-[11.5px] font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Scenarios CSV
            </button>
            <button
              onClick={handleExportEvents}
              className="flex items-center gap-1.5 px-3 py-[6px] border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-600 text-[11.5px] font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Events CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-[6px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11.5px] font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
        {labReport ? (
          <div className="bg-white border border-stone-200/60 shadow-sm rounded-xl max-w-4xl w-full p-10 text-stone-800 select-text print:border-none print:shadow-none print:p-0 print:rounded-none">

            {/* Report header */}
            <div className="border-b-2 border-stone-900 pb-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Industrial Cybersecurity Assessment</span>
                  </div>
                  <h1 className="text-xl font-bold text-stone-950 uppercase tracking-tight leading-tight">
                    {labReport.title}
                  </h1>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Formal Verification & Security Evaluation Report
                  </p>
                </div>
                <div className="text-right text-[10.5px] font-mono text-stone-500 space-y-0.5">
                  <div>Generated: {labReport.generated_at}</div>
                  <div>Standard: ISA/IEC 62443 · NIST SP 800-82</div>
                </div>
              </div>
            </div>

            {/* Executive summary KPIs */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Total Scenarios', value: labReport.security_summary?.total_tests || 0, color: 'bg-stone-50 border-stone-200', text: 'text-stone-900' },
                { label: 'Passed', value: labReport.security_summary?.passed || 0, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
                { label: 'Failed', value: labReport.security_summary?.failed || 0, color: 'bg-rose-50 border-rose-200', text: 'text-rose-800' },
                { label: 'Success Rate', value: `${labReport.security_summary?.pass_rate || 0}%`, color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' },
              ].map(m => (
                <div key={m.label} className={`p-3 border rounded-lg ${m.color}`}>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1">{m.label}</div>
                  <div className={`text-xl font-bold ${m.text}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Section 1: Topology */}
            <section className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                1. Network Topology Summary
              </h2>
              <p className="text-[12px] text-stone-600 mb-4">
                The evaluated network consists of{' '}
                <strong className="text-stone-800">{labReport.topology_summary?.total_devices} virtual devices</strong>{' '}
                connected across{' '}
                <strong className="text-stone-800">{labReport.topology_summary?.total_connections} physical links</strong>{' '}
                spanning Purdue Model Levels 0 through 3.5.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-stone-200 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-semibold">
                    <tr>
                      {['ID', 'Device Name', 'Type', 'IP Address', 'Role'].map(h => (
                        <th key={h} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    {labReport.topology_summary?.devices?.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50">
                        <td className="py-1.5 px-3 text-stone-400">{d.id}</td>
                        <td className="py-1.5 px-3 font-sans font-semibold text-stone-800">{d.name}</td>
                        <td className="py-1.5 px-3 font-sans text-stone-600">{d.type}</td>
                        <td className="py-1.5 px-3 text-stone-700">{d.ip}</td>
                        <td className="py-1.5 px-3 font-sans text-stone-500">{d.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Scenarios */}
            <section className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                2. Empirical Security Test Results
              </h2>
              <div className="space-y-3">
                {labReport.scenarios?.map((sc) => (
                  <div key={sc.scenario_id} className="border border-stone-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sc.pass_status
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : <XCircle className="w-4 h-4 text-rose-600" />
                        }
                        <span className="text-[12px] font-bold text-stone-800">{sc.name}</span>
                      </div>
                      <span className={`px-2 py-[2px] rounded-md text-[9.5px] font-mono font-bold ${
                        sc.pass_status ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sc.pass_status ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500"><span className="font-medium text-stone-700">Objective:</span> {sc.objective}</p>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div><span className="text-stone-400">Expected: </span><span className="font-medium text-stone-700">{sc.expected_outcome}</span></div>
                      <div><span className="text-stone-400">Actual: </span><span className="font-medium text-stone-700">{sc.actual_outcome}</span></div>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-md border border-stone-100 text-[10.5px] font-mono text-stone-600">
                      {sc.reason}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Conclusion */}
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                3. Conclusion & Recommendations
              </h2>
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                <p className="text-[12px] text-stone-700 leading-relaxed">{labReport.conclusion}</p>
              </div>
            </section>

            {/* Signature block */}
            <div className="border-t border-stone-200 pt-8 mt-10 flex justify-between items-center text-[10.5px] text-stone-400">
              <div>
                <div className="font-medium">Audited by: ICS Cybersecurity Simulation Engine</div>
                <div className="text-[9.5px] mt-0.5">Cryptographic Suite: AES-256-GCM / RSA-PSS-2048 / SHA-256</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[11px] font-semibold text-stone-700">STATUS: VERIFIED</div>
                <div className="text-[9.5px] mt-0.5">Educational Simulation Certification</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-stone-400">
            <RefreshCw className="w-5 h-5 animate-spin text-stone-300 mr-2" />
            <span className="text-[12px]">Compiling lab report…</span>
          </div>
        )}
      </div>
    </div>
  );
};
