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
  Zap,
  ShieldAlert,
  Terminal
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
    { id: 'overview',       label: 'Overview',             sublabel: 'Security Operations',    icon: LayoutDashboard, color: 'text-cyan-400' },
    { id: 'devices',        label: 'Industrial Devices',   sublabel: 'SCADA Node Registry',    icon: Cpu,             color: 'text-sky-400' },
    { id: 'crypto',         label: 'Cryptography Lab',     sublabel: 'AES · RSA · SHA-256',    icon: FlaskConical,    color: 'text-violet-400' },
    { id: 'access',         label: 'Access Control',       sublabel: 'RBAC · 802.1X · EAP',   icon: ShieldCheck,     color: 'text-teal-400' },
    { id: 'communication',  label: 'Secure Channel',       sublabel: 'TLS 1.3 · IPsec',        icon: Radio,           color: 'text-cyan-400' },
    { id: 'logs',           label: 'Audit Ledger',         sublabel: 'Tamper-Evident Stream',  icon: ScrollText,      color: 'text-amber-400' },
    { id: 'project-info',   label: 'Architecture Dossier', sublabel: 'System Specifications',  icon: Info,            color: 'text-slate-400' },
  ];

  const activeNav = navItems.find(i => i.id === activeTab);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row antialiased bg-grid-pattern selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ── Sidebar ── */}
      <aside
        className={`${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-full bg-[#0a0d15]/95 border-r border-[#161f30] flex flex-col shrink-0 transition-all duration-300 backdrop-blur-2xl relative z-40`}
        style={{ willChange: 'width' }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#161f30] shrink-0">
          <div className="flex items-center gap-3">
            {/* Hexagonal Cyber Logo Mark */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 brand-hex bg-gradient-to-br from-cyan-400 via-sky-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-900/40">
                <Zap className="w-4 h-4 text-slate-950 font-extrabold" strokeWidth={2.8} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0d15]" />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0 animate-fade-in">
                <div className="font-extrabold text-sm tracking-tight text-white leading-none flex items-center gap-1">
                  AegisGrid
                  <span className="text-cyan-400 font-mono-code text-xs px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">ICS</span>
                </div>
                <div className="text-[10px] font-mono-code text-slate-400 uppercase tracking-[0.14em] mt-1">
                  Defense Platform
                </div>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-[#0e1422] border border-[#1a253a] text-[10px] text-slate-300 flex items-center gap-2 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SCADA Telemetry Simulator</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-2 pt-1.5 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Operations Center
            </div>
          )}
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden animate-fade-in ${
                  isActive
                    ? 'bg-cyan-500/10 text-white border border-cyan-500/30 shadow-lg shadow-cyan-950/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 group-hover:text-slate-400 truncate">
                      {item.sublabel}
                    </div>
                  </div>
                )}
                {isActive && !sidebarCollapsed && (
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="p-3 border-t border-[#161f30] space-y-2 shrink-0 bg-[#07090e]/60">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} text-[11px] px-1`}>
            {!sidebarCollapsed && <span className="text-slate-400 font-medium">Backend API</span>}
            <span className="flex items-center gap-1.5">
              {serverOnline ? (
                <>
                  <span className="live-indicator w-2 h-2 rounded-full bg-emerald-400 text-emerald-400" />
                  {!sidebarCollapsed && <span className="text-emerald-400 font-mono-code text-[10px] font-bold">ONLINE</span>}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  {!sidebarCollapsed && <span className="text-rose-400 font-mono-code text-[10px] font-bold">DISCONNECTED</span>}
                </>
              )}
            </span>
          </div>

          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} text-[11px] px-1`}>
            {!sidebarCollapsed && <span className="text-slate-400 font-medium">Transport Security</span>}
            <span className="flex items-center gap-1.5">
              <Lock className={`w-3 h-3 ${tlsReady ? 'text-cyan-400' : 'text-amber-400'}`} />
              {!sidebarCollapsed && (
                <span className={`font-mono-code text-[10px] font-bold ${tlsReady ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {tlsReady ? 'TLS 1.3 SECURE' : 'PENDING'}
                </span>
              )}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Shell ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-[#0a0d15]/90 border-b border-[#161f30] px-6 flex items-center justify-between shrink-0 backdrop-blur-2xl sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium hidden sm:block">AegisGrid</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
              <span className="flex items-center gap-1.5 font-bold text-white">
                {activeNav && React.createElement(activeNav.icon, { className: `w-3.5 h-3.5 ${activeNav.color}` })}
                <span>{activeNav?.label}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Status Button */}
            <button
              onClick={checkStatus}
              disabled={isRefreshing}
              title="Refresh System Status"
              className="p-1.5 px-3 rounded-xl bg-[#0f1422] hover:bg-[#161d30] text-slate-300 hover:text-white border border-[#1f2b42] transition-all btn-press flex items-center gap-1.5 text-xs shadow-sm font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Subsystem Health Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1422] border border-[#1f2b42] text-[11px] font-mono-code">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">Core Subsystem</span>
              <span className="text-teal-400 font-bold">ACTIVE</span>
            </div>

            {/* Live Indicator */}
            <div
              title={serverOnline ? 'Backend Connected' : 'Backend Offline'}
              className={`w-2.5 h-2.5 rounded-full live-indicator ${serverOnline ? 'bg-emerald-400 text-emerald-400' : 'bg-rose-500 text-rose-500'}`}
            />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-5 md:p-7 overflow-y-auto">
          <div key={activeTab} className="animate-fade-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
