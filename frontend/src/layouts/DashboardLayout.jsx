import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  FlaskConical, 
  ShieldCheck, 
  Radio, 
  ScrollText, 
  Info, 
  Activity, 
  RefreshCw,
  Lock,
  Wifi,
  WifiOff,
  ChevronRight,
  Hexagon,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

export const DashboardLayout = ({ activeTab, onTabChange, children }) => {
  const [serverOnline, setServerOnline] = useState(false);
  const [tlsReady, setTlsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    { id: 'overview',       label: 'Overview',             sublabel: 'Security Dashboard',     icon: LayoutDashboard, color: 'text-sky-400' },
    { id: 'devices',        label: 'Industrial Devices',   sublabel: 'SCADA Device Registry',  icon: Cpu,             color: 'text-blue-400' },
    { id: 'crypto',         label: 'Cryptography Lab',     sublabel: 'AES · RSA · SHA-256',    icon: FlaskConical,    color: 'text-violet-400' },
    { id: 'access',         label: 'Access Control',       sublabel: 'RBAC · 802.1X · EAP',   icon: ShieldCheck,     color: 'text-teal-400' },
    { id: 'communication',  label: 'Secure Channel',       sublabel: 'TLS 1.3 · IPsec',        icon: Radio,           color: 'text-cyan-400' },
    { id: 'logs',           label: 'Audit Logs',           sublabel: 'Security Event Stream',  icon: ScrollText,      color: 'text-amber-400' },
    { id: 'project-info',   label: 'Documentation',        sublabel: 'Project Specification',  icon: Info,            color: 'text-slate-400' },
  ];

  const activeNav = navItems.find(i => i.id === activeTab);

  return (
    <div className="min-h-screen bg-[#050a14] text-slate-100 flex flex-col md:flex-row antialiased bg-grid-pattern">
      {/* ── Sidebar ── */}
      <aside
        className={`${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-full bg-[#080f1e]/95 border-r border-[#1a2844] flex flex-col shrink-0 transition-all duration-300 backdrop-blur-xl`}
        style={{ willChange: 'width' }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1a2844] shrink-0">
          <div className="flex items-center gap-3">
            {/* Hexagonal Logo Mark */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 brand-hex bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-900/40">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080f1e]" />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0 animate-fade-in">
                <div className="font-bold text-sm tracking-tight text-white leading-none">
                  AegisGrid
                  <span className="text-sky-400 ml-1">ICS</span>
                </div>
                <div className="text-[10px] font-mono-code text-sky-400/70 uppercase tracking-[0.15em] mt-0.5">
                  Cybersecurity Platform
                </div>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5 animate-fade-in animate-delay-100">
              <span className="w-1 h-3 rounded-full bg-sky-500/60" />
              Network Security Simulation Suite
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Navigation
            </div>
          )}
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative overflow-hidden animate-fade-in ${
                  isActive
                    ? 'nav-item-active text-sky-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {/* Active left border (for non-active-class browsers fallback) */}
                <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-400'}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium leading-none ${isActive ? 'text-sky-200' : ''}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-slate-400 truncate">
                      {item.sublabel}
                    </div>
                  </div>
                )}
                {isActive && !sidebarCollapsed && (
                  <ChevronRight className="w-3 h-3 text-sky-400/60 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="p-3 border-t border-[#1a2844] space-y-1.5 shrink-0">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} text-[11px] px-1`}>
            {!sidebarCollapsed && <span className="text-slate-500">Backend API</span>}
            <span className="flex items-center gap-1.5">
              {serverOnline ? (
                <>
                  <span className="live-indicator w-2 h-2 rounded-full bg-emerald-400 text-emerald-400" />
                  {!sidebarCollapsed && <span className="text-emerald-400 font-mono-code text-[10px]">LIVE</span>}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  {!sidebarCollapsed && <span className="text-rose-400 font-mono-code text-[10px]">OFFLINE</span>}
                </>
              )}
            </span>
          </div>

          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} text-[11px] px-1`}>
            {!sidebarCollapsed && <span className="text-slate-500">TLS 1.3 / PKI</span>}
            <span className="flex items-center gap-1.5">
              <Lock className={`w-3 h-3 ${tlsReady ? 'text-sky-400' : 'text-amber-400'}`} />
              {!sidebarCollapsed && (
                <span className={`font-mono-code text-[10px] ${tlsReady ? 'text-sky-400' : 'text-amber-400'}`}>
                  {tlsReady ? 'X.509 READY' : 'PENDING'}
                </span>
              )}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-[#080f1e]/90 border-b border-[#1a2844] px-5 flex items-center justify-between shrink-0 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 hidden sm:block">AegisGrid</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
              <span className="flex items-center gap-1.5 font-medium text-sky-300">
                {activeNav && React.createElement(activeNav.icon, { className: 'w-3.5 h-3.5' })}
                <span>{activeNav?.label}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Status */}
            <button
              onClick={checkStatus}
              disabled={isRefreshing}
              title="Refresh System Status"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all btn-press flex items-center gap-1.5 px-2.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* System Status Chip */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono-code">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">SCADA Subsystem</span>
              <span className="text-teal-400">v2.0</span>
            </div>

            {/* Live dot */}
            <div
              title={serverOnline ? 'Backend Connected' : 'Backend Offline'}
              className={`w-2.5 h-2.5 rounded-full live-indicator ${serverOnline ? 'bg-emerald-400 text-emerald-400' : 'bg-rose-500 text-rose-500'}`}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          <div key={activeTab} className="animate-fade-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
