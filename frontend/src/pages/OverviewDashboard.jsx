import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  MessageSquareCode, 
  AlertTriangle, 
  Lock, 
  ArrowUpRight,
  RefreshCw,
  Radio,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { CommunicationFlow } from '../components/CommunicationFlow';
import { api } from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#080f1e] border border-[#1e3158] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-mono-code mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const OverviewDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSimulation, setLastSimulation] = useState(null);
  const [simulating, setSimulating] = useState(null); // 'auth' | 'attack'

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardStats();
      if (res.ok && res.data?.success) {
        setStats(res.data);
      } else {
        setError(res.data?.error || 'Failed to load dashboard metrics from backend.');
      }
    } catch (err) {
      setError(err.message || 'Error contacting API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleQuickSimulate = async () => {
    setSimulating('auth');
    try {
      const res = await api.simulateDeviceMessage('PLC-TURBINE-01', {
        action: 'report_status',
        payload: {
          temperature_c: (70 + Math.random() * 8).toFixed(1),
          pressure_psi: (410 + Math.random() * 15).toFixed(1),
          turbine_rpm: 3600,
          status: 'NOMINAL',
        },
      });
      if (res.data) { setLastSimulation(res.data); fetchStats(); }
    } catch (err) { console.error(err); }
    finally { setSimulating(null); }
  };

  const handleSimulateAttack = async () => {
    setSimulating('attack');
    try {
      const res = await api.simulateDeviceMessage('ROUGE-SENSOR-X', {
        action: 'emergency_trip',
        payload: { command: 'TRIP_ALL_BREAKERS' },
      });
      if (res.data) { setLastSimulation(res.data); fetchStats(); }
    } catch (err) { console.error(err); }
    finally { setSimulating(null); }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-fade-in">
        <div className="relative">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-300 font-medium">Initializing AegisGrid ICS</p>
          <p className="text-xs text-slate-500 mt-1 font-mono-code">Connecting to SCADA security subsystem...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl alert-critical animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-sm text-rose-200">Backend Connection Error</h3>
        </div>
        <p className="text-xs text-rose-400/80 mb-4 font-mono-code">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-xs text-rose-200 border border-rose-700/50 transition-colors btn-press"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const chartData = stats?.chart_by_device && stats.chart_by_device.length > 0
    ? stats.chart_by_device
    : [
        { device_id: 'PLC-TURBINE-01',    accepted: 4, rejected: 0 },
        { device_id: 'RTU-SUBSTATION-4',  accepted: 2, rejected: 0 },
        { device_id: 'SENSOR-P-99',       accepted: 3, rejected: 0 },
        { device_id: 'ROUGE-SENSOR-X',    accepted: 0, rejected: 3 },
      ];

  return (
    <div className="space-y-5">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0c1428] to-[#0d1a35] border border-[#1a2844] rounded-xl p-5 flowing-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono-code text-sky-400 uppercase tracking-wider">
                Live
              </span>
              <span className="text-[10px] text-slate-500 font-mono-code">SCADA Cybersecurity Center</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              AegisGrid <span className="text-gradient">Security Dashboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Real-time cryptographic monitoring, RBAC policy enforcement, and message integrity verification for virtual ICS endpoints.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleQuickSimulate}
              disabled={!!simulating}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold shadow-md shadow-sky-900/40 flex items-center gap-2 transition-all btn-press"
            >
              <Radio className={`w-3.5 h-3.5 ${simulating === 'auth' ? 'animate-pulse' : ''}`} />
              <span>{simulating === 'auth' ? 'Processing...' : 'Simulate Auth Message'}</span>
            </button>
            <button
              onClick={handleSimulateAttack}
              disabled={!!simulating}
              className="px-4 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold shadow-md shadow-rose-950/40 flex items-center gap-2 transition-all btn-press"
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${simulating === 'attack' ? 'animate-pulse' : ''}`} />
              <span>{simulating === 'attack' ? 'Processing...' : 'Simulate Attack'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 6 Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: 'Total Devices',     value: stats?.total_devices ?? 0,         subtitle: 'Enrolled endpoints',         icon: Cpu,             color: 'blue'   },
          { title: 'Authorized Nodes',  value: stats?.authorized_devices ?? 0,    subtitle: 'Active permitted nodes',     icon: ShieldCheck,     color: 'emerald' },
          { title: 'Messages Processed',value: stats?.messages_processed ?? 0,    subtitle: 'Total telemetry frames',     icon: MessageSquareCode,color: 'sky'   },
          { title: 'RBAC Rejections',   value: stats?.rejected_requests ?? 0,     subtitle: 'Blocked by policy',          icon: ShieldAlert,     color: 'rose'   },
          { title: 'Integrity Failures',value: stats?.integrity_failures ?? 0,    subtitle: 'Tampered payloads caught',   icon: AlertTriangle,   color: 'amber'  },
          { title: 'TLS 1.3 Status',    value: stats?.secure_connection_status?.tls_ready ? 'LIVE' : 'PENDING',
                                         subtitle: stats?.secure_connection_status?.active_protocol || 'TLS 1.3',
                                         icon: Lock, color: 'teal' },
        ].map((card, i) => (
          <div key={i} className="animate-fade-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* ── Communication Flow ── */}
      <div className="animate-fade-slide-up animate-delay-300">
        <CommunicationFlow lastSimulation={lastSimulation} />
      </div>

      {/* ── Charts & Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-slide-up animate-delay-400">
        {/* Bar Chart */}
        <div className="lg:col-span-7 bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                Message Integrity Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Accepted (authenticated) vs Rejected (RBAC blocked) messages per device
              </p>
            </div>
            <span className="text-[10px] font-mono-code text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/30">
              SQLite Live
            </span>
          </div>

          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2844" vertical={false} />
                <XAxis
                  dataKey="device_id"
                  stroke="#334155"
                  fontSize={10}
                  tickLine={false}
                  angle={-12}
                  textAnchor="end"
                  tick={{ fill: '#64748b' }}
                />
                <YAxis stroke="#334155" fontSize={10} tickLine={false} allowDecimals={false} tick={{ fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#94a3b8' }}
                  iconSize={8}
                  iconType="circle"
                />
                <Bar dataKey="accepted" name="Accepted (Authenticated)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected (Policy Block)"  fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="lg:col-span-5 bg-[#0c1428]/90 border border-[#1a2844] rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col card-hover">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Recent Security Events</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live cryptographic & RBAC event stream</p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-64 pr-0.5">
            {stats?.recent_events && stats.recent_events.length > 0 ? (
              stats.recent_events.map((evt, i) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-[#080f1e] border border-[#1a2844] hover:border-[#1e3158] transition-colors flex items-start gap-2.5 group animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="mt-0.5 shrink-0">
                    {evt.result === 'ALLOW' || evt.result === 'SUCCESS' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {evt.event_type}
                      </span>
                      <Badge variant={evt.severity} size="xs">{evt.severity}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{evt.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600 font-mono-code">
                      <span>{evt.device_id || 'SYSTEM'}</span>
                      <span>·</span>
                      <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Zap className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-xs text-slate-600">No recent security events.</p>
                <p className="text-[10px] text-slate-700 mt-0.5">Use the simulator buttons above to generate events.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
