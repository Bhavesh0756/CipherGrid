import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  FlaskConical, 
  ShieldCheck, 
  Radio, 
  ScrollText, 
  Info, 
  Shield, 
  Activity, 
  RefreshCw,
  Lock,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export const DashboardLayout = ({ activeTab, onTabChange, children }) => {
  const [serverOnline, setServerOnline] = useState(false);
  const [tlsReady, setTlsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    setIsRefreshing(true);
    try {
      const healthRes = await api.getHealth();
      setServerOnline(healthRes.ok && healthRes.data?.status === 'ONLINE');
      const tlsRes = await api.getTlsStatus();
      setTlsReady(tlsRes.ok && tlsRes.data?.tls_ready);
    } catch {
      setServerOnline(false);
      setTlsReady(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'devices', label: 'Industrial Devices', icon: Cpu },
    { id: 'crypto', label: 'Cryptography Lab', icon: FlaskConical },
    { id: 'access', label: 'Access Control', icon: ShieldCheck },
    { id: 'communication', label: 'Secure Communication', icon: Radio },
    { id: 'logs', label: 'Security Event Logs', icon: ScrollText },
    { id: 'project-info', label: 'Project Information', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0d1629] border-r border-[#1e2e4f] flex flex-col shrink-0 select-none">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-[#1e2e4f]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Industrial SecureSim
              </h1>
              <span className="text-[11px] text-cyan-400/80 font-mono-code uppercase tracking-wider">
                ICS Security Platform
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 bg-slate-900/60 rounded px-2.5 py-1 border border-slate-800">
            Network Security Microproject
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Subsystems Footer */}
        <div className="p-4 border-t border-[#1e2e4f] bg-[#090f1d] text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Backend API:</span>
            <span className="flex items-center gap-1.5 font-mono-code">
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={serverOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {serverOnline ? 'Connected' : 'Offline'}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">TLS 1.3 / PKI:</span>
            <span className="flex items-center gap-1.5 font-mono-code">
              <Lock className={`w-3 h-3 ${tlsReady ? 'text-cyan-400' : 'text-amber-400'}`} />
              <span className={tlsReady ? 'text-cyan-400' : 'text-amber-400'}>
                {tlsReady ? 'X.509 Ready' : 'Pending'}
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 bg-[#0d1629]/90 border-b border-[#1e2e4f] px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Module Navigation
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-medium text-cyan-400 capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={checkStatus}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5 text-xs px-2.5"
              title="Refresh System Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono-code text-slate-400">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>SCADA Subsystem v1.0</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
