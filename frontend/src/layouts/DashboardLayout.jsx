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
  WifiOff,
  ChevronRight,
  Zap,
  Terminal
} from 'lucide-react';
import { api, BASE_URL } from '../services/api';

export const DashboardLayout = ({ 
  activeTab, 
  onTabChange, 
  onReplayBoot,
  isBooted = true,
  children 
}) => {
  const [serverOnline, setServerOnline] = useState(false);
  const [tlsReady, setTlsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [connState, setConnState] = useState('CHECKING'); // 'ONLINE' | 'WAKING_UP' | 'DISCONNECTED' | 'CHECKING'

  const checkStatus = async () => {
    setIsRefreshing(true);
    try {
      const healthRes = await api.getHealth();
      if (healthRes.ok && healthRes.data?.status === 'ONLINE') {
        setServerOnline(true);
        setConnState('ONLINE');
        const tlsRes = await api.getTlsStatus();
        setTlsReady(tlsRes.ok && tlsRes.data?.tls_ready);
      } else {
        setServerOnline(false);
        setTlsReady(false);
        if (healthRes.data?.isColdStart) {
          setConnState('WAKING_UP');
        } else {
          setConnState('DISCONNECTED');
        }
      }
    } catch {
      setServerOnline(false);
      setTlsReady(false);
      setConnState('DISCONNECTED');
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
    <div className="min-h-screen bg-[#080e18] text-slate-100 flex flex-col md:flex-row antialiased bg-grid-pattern selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ── Sidebar matching Reference ── */}
      <aside
        className={`${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-full bg-[#080e18] border-r border-[#111f33] flex flex-col shrink-0 transition-all duration-300 backdrop-blur-2xl relative z-40 ${isBooted ? 'aegis-reveal-sidebar' : ''}`}
        style={{ willChange: 'width' }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#111f33] shrink-0">
          <div className="flex items-center justify-between">
            <button 
              type="button"
              onClick={onReplayBoot}
              title={onReplayBoot ? "Click to replay AegisGrid boot sequence" : undefined}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              {/* Reference Logo Mark: Rounded Cyber Square */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:shadow-cyan-400/40 transition-shadow">
                <Zap className="w-4 h-4 text-slate-950 font-extrabold group-hover:scale-110 transition-transform" strokeWidth={2.8} />
              </div>

              {!sidebarCollapsed && (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white leading-none group-hover:text-cyan-300 transition-colors">
                    AegisGrid
                  </span>
                  <span className="text-cyan-400 font-mono-code text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40">
                    ICS
                  </span>
                </div>
              )}
            </button>

            {!sidebarCollapsed && (
              <button 
                type="button"
                onClick={onReplayBoot}
                title="System Settings / Diagnostics"
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-[#0c1626] transition-colors"
              >
                <Terminal className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
              </button>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-[#0c1626] border border-[#162942] text-[11px] text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="font-medium">SCADA Telemetry Simulator</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-500 rotate-90" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                style={{ animationDelay: `${idx * 25}ms` }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-[#0d2033]/90 text-white border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#0c1626] border border-transparent hover:border-[#162942]'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold leading-none ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </div>
                    <div className={`text-[10px] mt-1 truncate ${isActive ? 'text-cyan-300/80 font-mono-code' : 'text-slate-500 group-hover:text-slate-400'}`}>
                      {item.sublabel}
                    </div>
                  </div>
                )}
                {isActive && !sidebarCollapsed && (
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Reference Sidebar Footer */}
        <div className="p-3 border-t border-[#111f33] space-y-2 shrink-0 bg-[#070d17]/80">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-code px-1">
            <span className="flex items-center gap-1.5">
              <span>⏱</span>
              <span>System 125:18:35</span>
            </span>
            <span className="text-slate-400 font-semibold">Version 3.0</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Shell ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Reference Top Header */}
        <header className={`h-14 bg-[#080e18]/90 border-b border-[#111f33] px-6 flex items-center justify-between shrink-0 backdrop-blur-2xl sticky top-0 z-30 ${isBooted ? 'aegis-reveal-header' : ''}`}>
          <div className="flex items-center gap-2 min-w-0">
            {/* Breadcrumbs matching reference: AegisGrid > [icon] Overview */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">AegisGrid</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="flex items-center gap-1.5 font-bold text-white">
                {activeNav && React.createElement(activeNav.icon, { className: 'w-3.5 h-3.5 text-cyan-400' })}
                <span>{activeNav?.label}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Boot Diagnostics / Quick Replay */}
            {onReplayBoot && (
              <button
                type="button"
                onClick={onReplayBoot}
                title="Replay System Boot Diagnostics"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c1626] hover:bg-[#112036] border border-[#162942] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Diagnostics</span>
              </button>
            )}

            {/* Refresh Button matching reference */}
            <button
              onClick={checkStatus}
              disabled={isRefreshing}
              title="Refresh System Status"
              className="px-3 py-1.5 rounded-xl bg-[#0c1626] hover:bg-[#112036] text-slate-300 hover:text-white border border-[#162942] transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>Refresh</span>
            </button>

            {/* Backend Status Badge matching reference: "Backend: ACTIVE" with green indicator dot */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono-code font-bold shadow-sm ${
              connState === 'ONLINE'
                ? 'bg-[#0a1824] border-[#13303d] text-teal-300'
                : connState === 'WAKING_UP'
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}>
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Backend:</span>
              <span className="text-white">
                {connState === 'ONLINE' ? 'ACTIVE' : connState === 'WAKING_UP' ? 'WAKING UP' : 'OFFLINE'}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ml-0.5 ${
                connState === 'ONLINE' 
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' 
                  : connState === 'WAKING_UP'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`} />
            </div>
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
