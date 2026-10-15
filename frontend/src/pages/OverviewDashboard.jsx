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
  ExternalLink,
  Radio,
  CheckCircle2,
  XCircle,
  Database
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

export const OverviewDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSimulation, setLastSimulation] = useState(null);

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

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickSimulate = async () => {
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
      if (res.data) {
        setLastSimulation(res.data);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateAttack = async () => {
    try {
      // Simulate rogue sensor attempting an unauthorized emergency trip
      const res = await api.simulateDeviceMessage('ROUGE-SENSOR-X', {
        action: 'emergency_trip',
        payload: { command: 'TRIP_ALL_BREAKERS' },
      });
      if (res.data) {
        setLastSimulation(res.data);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm">Connecting to SCADA Security Subsystem and querying SQLite database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
          <h3 className="font-semibold text-sm">Dashboard Data Query Error</h3>
        </div>
        <p className="text-xs text-rose-400/90 mt-2">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-3 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-xs text-rose-200 border border-rose-700/50"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const chartData = stats?.chart_by_device && stats.chart_by_device.length > 0
    ? stats.chart_by_device
    : [
        { device_id: 'PLC-TURBINE-01', accepted: 4, rejected: 0 },
        { device_id: 'RTU-SUBSTATION-4', accepted: 2, rejected: 0 },
        { device_id: 'SENSOR-PRESSURE-99', accepted: 3, rejected: 0 },
        { device_id: 'ROUGE-SENSOR-X', accepted: 0, rejected: 3 },
      ];

  return (
    <div className="space-y-6">
      {/* Top Header / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#0d1629]/70 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Industrial SCADA Security Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cryptographic monitoring, RBAC policy enforcement, and message integrity verification for virtual ICS devices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickSimulate}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 flex items-center gap-2 transition-colors"
          >
            <Radio className="w-4 h-4" />
            <span>Simulate Authorized Msg</span>
          </button>
          <button
            onClick={handleSimulateAttack}
            className="px-3.5 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/40 flex items-center gap-2 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Simulate Unauthorized Attack</span>
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Virtual Devices"
          value={stats?.total_devices ?? 0}
          subtitle="Enrolled industrial endpoints"
          icon={Cpu}
          color="blue"
        />
        <StatCard
          title="Authorized Devices"
          value={stats?.authorized_devices ?? 0}
          subtitle="Active permitted nodes"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Messages Processed"
          value={stats?.messages_processed ?? 0}
          subtitle="Total telemetry frames"
          icon={MessageSquareCode}
          color="cyan"
        />
        <StatCard
          title="Rejected Access"
          value={stats?.rejected_requests ?? 0}
          subtitle="Blocked by RBAC policy"
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Integrity Failures"
          value={stats?.integrity_failures ?? 0}
          subtitle="Tampered payloads detected"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Secure TLS Status"
          value={stats?.secure_connection_status?.tls_ready ? 'ONLINE' : 'CONFIG'}
          subtitle={stats?.secure_connection_status?.active_protocol || 'TLS 1.3 Ready'}
          icon={Lock}
          color="teal"
        />
      </div>

      {/* End-to-End Communication Flow Component */}
      <CommunicationFlow lastSimulation={lastSimulation} />

      {/* Charts & Recent Security Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Bar Chart: Accepted vs Rejected Messages */}
        <div className="lg:col-span-7 bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Message Transmission Integrity Audit
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of Cryptographically Accepted vs RBAC-Rejected Messages by Device ID
              </p>
            </div>
            <span className="text-xs font-mono-code text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Live SQLite Data
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                <XAxis 
                  dataKey="device_id" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090f1d', borderColor: '#1e2e4f', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="accepted" name="Accepted (Authenticated)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected (Blocked by Policy)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Security Events Feed */}
        <div className="lg:col-span-5 bg-[#0d1629]/90 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Recent Security Audit Events
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time cryptographic & RBAC event log
              </p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-72 pr-1">
            {stats?.recent_events && stats.recent_events.length > 0 ? (
              stats.recent_events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-2.5"
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
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {evt.event_type}
                      </span>
                      <Badge variant={evt.severity} size="xs">
                        {evt.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{evt.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono-code">
                      <span>{evt.device_id || 'SYSTEM'}</span>
                      <span>•</span>
                      <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent security events found in database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
