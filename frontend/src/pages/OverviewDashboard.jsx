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
  TrendingUp,
  Activity,
  Sparkles,
  Layers
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
    <div className="bg-[#0b0f19]/95 border border-[#1e2a40] rounded-xl px-4 py-3 text-xs shadow-2xl backdrop-blur-xl space-y-1.5">
      <p className="text-white font-mono-code font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
        <span>{label}</span>
        <span className="text-[10px] text-cyan-400 font-normal">SCADA Node</span>
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            {p.name}:
          </span>
          <span className="font-mono-code font-bold text-white">{p.value} frames</span>
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
      <div className="flex flex-col items-center justify-center min-h-[440px] gap-4 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/40">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-white font-bold tracking-tight">Initializing AegisGrid Core</p>
          <p className="text-xs text-slate-400 mt-1 font-mono-code">Querying SQLite audit database & SCADA controller…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl alert-critical animate-fade-in max-w-2xl mx-auto my-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-sm text-rose-200">Backend Connection Error</h3>
        </div>
        <p className="text-xs text-rose-300/80 mb-4 font-mono-code leading-relaxed">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-xs text-rose-200 border border-rose-700/60 transition-colors btn-press font-semibold"
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
    <div className="space-y-6">
      {/* ── Elevated Hero Banner matching Reference ── */}
      <div className="relative overflow-hidden bg-[#0a1220] border border-[#14243b] rounded-2xl p-6 shadow-2xl aegis-stagger-1">
        {/* Abstract Cyber Mesh Constellation Graphic */}
        <svg 
          className="absolute top-0 right-0 w-[480px] h-full opacity-25 pointer-events-none" 
          viewBox="0 0 480 220" 
          fill="none"
        >
          <path d="M40 180 L130 90 L210 130 L290 50 L380 100 L460 30" stroke="#06b6d4" strokeWidth="1" />
          <path d="M130 90 L200 40 L290 50 L360 20" stroke="#14b8a6" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M210 130 L280 180 L380 100 L440 160" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M200 40 L210 130 L350 170 L380 100" stroke="#06b6d4" strokeWidth="0.8" />
          <circle cx="40" cy="180" r="3" fill="#06b6d4" />
          <circle cx="130" cy="90" r="3" fill="#14b8a6" />
          <circle cx="200" cy="40" r="2.5" fill="#38bdf8" />
          <circle cx="210" cy="130" r="3.5" fill="#06b6d4" />
          <circle cx="290" cy="50" r="3" fill="#2dd4bf" />
          <circle cx="280" cy="180" r="2.5" fill="#0ea5e9" />
          <circle cx="350" cy="170" r="2.5" fill="#14b8a6" />
          <circle cx="380" cy="100" r="3.5" fill="#06b6d4" />
          <circle cx="460" cy="30" r="3" fill="#38bdf8" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-500/40 text-[10px] font-mono-code text-teal-300 uppercase tracking-wider font-semibold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                LIVE SCADA INGRESS
              </span>
              <span className="text-[10px] text-slate-400 font-mono-code">
                Purdue Model Tier 1-3 Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              AegisGrid <span className="text-gradient">Security Operations</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Software-defined industrial control telemetry engine. Enforces hardware admission, AEAD authenticated payload encryption, and real-time least-privilege policy verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleQuickSimulate}
              disabled={!!simulating}
              className="px-4 py-2.5 rounded-xl bg-[#0e2a38]/85 hover:bg-[#13384a] text-cyan-300 text-xs font-bold border border-cyan-500/50 flex items-center gap-2 transition-all btn-press shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-60 cursor-pointer"
            >
              <Radio className={`w-4 h-4 text-cyan-400 ${simulating === 'auth' ? 'animate-pulse text-cyan-200' : ''}`} />
              <span>{simulating === 'auth' ? 'Processing Payload…' : 'Simulate Auth Message'}</span>
            </button>
            <button
              onClick={handleSimulateAttack}
              disabled={!!simulating}
              className="px-4 py-2.5 rounded-xl bg-[#2a1218]/85 hover:bg-[#381820] text-rose-300 text-xs font-bold border border-rose-500/50 flex items-center gap-2 transition-all btn-press shadow-[0_0_15px_rgba(244,63,94,0.15)] disabled:opacity-60 cursor-pointer"
            >
              <ShieldAlert className={`w-4 h-4 text-rose-400 ${simulating === 'attack' ? 'animate-pulse' : ''}`} />
              <span>{simulating === 'attack' ? 'Injecting Threat…' : 'Simulate Attack'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 6 Stat Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 aegis-stagger-2">
        {[
          { title: 'Enrolled Devices',  value: stats?.total_devices ?? 0,         subtitle: 'Active virtual nodes',       icon: Cpu,             color: 'cyan'    },
          { title: 'Authorized Nodes',  value: stats?.authorized_devices ?? 0,    subtitle: 'Permitted SCADA links',      icon: ShieldCheck,     color: 'emerald' },
          { title: 'Frames Ingested',   value: stats?.messages_processed ?? 0,    subtitle: 'Processed telemetry',        icon: MessageSquareCode,color: 'sky'    },
          { title: 'Policy Dropped',    value: stats?.rejected_requests ?? 0,     subtitle: 'Blocked by RBAC',            icon: ShieldAlert,     color: 'rose'    },
          { title: 'Integrity Alerts',  value: stats?.integrity_failures ?? 0,    subtitle: 'Tampered payloads caught',   icon: AlertTriangle,   color: 'amber'   },
          { title: 'TLS 1.3 Transport', value: stats?.secure_connection_status?.tls_ready ? 'READY' : 'PENDING',
                                         subtitle: stats?.secure_connection_status?.active_protocol || 'TLS 1.3 Strict',
                                         icon: Lock, color: 'teal' },
        ].map((card, i) => (
          <div key={i} className="animate-fade-slide-up" style={{ animationDelay: `${i * 45}ms` }}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* ── End-to-End Cryptographic Communication Pipeline ── */}
      <div className="aegis-stagger-3">
        <CommunicationFlow lastSimulation={lastSimulation} />
      </div>

      {/* ── Charts & Live Security Event Stream matching Reference ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 aegis-stagger-4">
        {/* Luminous Bar Chart */}
        <div className="lg:col-span-7 bg-[#0b1524] border border-[#14243b] rounded-2xl p-6 shadow-xl flex flex-col card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Message Integrity & Access Audit
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Authenticated payloads (AES-256-GCM verified) vs Policy-blocked violations per device
              </p>
            </div>
            <span className="text-[10px] font-mono-code text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30 shadow-sm">
              Live SQLite Audit
            </span>
          </div>

          <div className="h-64 w-full flex-1 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }} barGap={6}>
                <defs>
                  <linearGradient id="barAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="barRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#14243b" vertical={false} />
                <XAxis
                  dataKey="device_id"
                  stroke="#1b3252"
                  fontSize={10}
                  tickLine={false}
                  angle={-12}
                  textAnchor="end"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis stroke="#1b3252" fontSize={10} tickLine={false} allowDecimals={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#94a3b8' }}
                  iconSize={8}
                  iconType="circle"
                />
                <Bar dataKey="accepted" name="Authenticated (Permitted)" fill="url(#barAccepted)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="rejected" name="Violation (Policy Dropped)" fill="url(#barRejected)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Security Events Stream */}
        <div className="lg:col-span-5 bg-[#0b1524] border border-[#14243b] rounded-2xl p-6 shadow-xl flex flex-col card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Recent Security Events</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Live tamper-evident ledger activity</p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-cyan-500/10 cursor-pointer"
            >
              <span>Explore All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-64 pr-1">
            {stats?.recent_events && stats.recent_events.length > 0 ? (
              stats.recent_events.map((evt, i) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-[#08101c] border border-[#14243b] hover:border-cyan-500/30 transition-all flex items-start gap-3 group animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="mt-0.5 shrink-0">
                    {evt.result === 'ALLOW' || evt.result === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {evt.event_type}
                      </span>
                      <Badge variant={evt.severity} size="xs">{evt.severity}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{evt.message}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono-code">
                      <span className="px-1.5 py-0.2 rounded bg-[#0b1524] border border-[#14243b] text-slate-400">{evt.device_id || 'CORE'}</span>
                      <span>•</span>
                      <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Zap className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium">No recent security events.</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Use the simulation triggers above to generate live frames.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
