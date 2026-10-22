import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Play,
  Save,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'warning' | 'success' | 'info';
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Rogue Write Blocked',
    description: 'Unauthorized write attempt (0x06) from Rogue Tap to PLC-01 was rejected by RBAC policy.',
    time: '2m ago',
    type: 'warning',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Crypto Session Established',
    description: 'SCADA Server established AES-256-GCM authenticated session with RTU/Switch.',
    time: '14m ago',
    type: 'success',
    unread: false,
  },
  {
    id: 'notif-3',
    title: 'Topology Synchronized',
    description: 'Industrial nodes active with zero packet drop in Purdue Levels 0-3.5.',
    time: '1h ago',
    type: 'info',
    unread: false,
  },
];

export const Topbar: React.FC = () => {
  const {
    saveTopology,
    isLoading,
    setMessageModalOpen,
    activeSection,
    setActiveSection,
    devices,
  } = useSimulatorStore();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [currentTime, setCurrentTime] = useState<string>('');

  const notifRef = useRef<HTMLDivElement>(null);

  // Live ICS clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setBackendStatus('connected');
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'network-lab': return 'Network Lab';
      case 'device-inventory': return 'Device Inventory';
      case 'packet-inspector': return 'Packet Inspector';
      case 'security-center': return 'Security Center';
      case 'event-logs': return 'Event Logs';
      case 'lab-reports': return 'Lab Reports';
      case 'dashboard': return 'Telemetry Overview';
      case 'settings': return 'Settings';
      default: return 'Network Lab';
    }
  };

  const getSectionSubtitle = () => {
    switch (activeSection) {
      case 'network-lab': return 'Interactive OT Topology & Packet Simulation';
      case 'device-inventory': return 'Purdue Model Asset Directory & Keys';
      case 'packet-inspector': return 'Wireshark-Grade Cryptographic Dissector';
      case 'security-center': return '9 Automated Defense Scenarios';
      case 'event-logs': return 'Immutable Relational Audit Trail';
      case 'lab-reports': return 'Formal Cryptographic Evaluation';
      case 'dashboard': return 'Real-Time SCADA KPI Telemetry';
      case 'settings': return 'Cryptographic Engine Parameters';
      default: return 'Interactive OT Topology';
    }
  };

  return (
    <header className="h-14 bg-[#080d1a]/95 border-b border-slate-800/80 px-5 flex items-center justify-between text-slate-200 select-none z-20 shrink-0 backdrop-blur-md">
      {/* Left: Section Context Title & HUD Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-xs bg-blue-500 rotate-45" />
          <span className="text-[14px] font-bold text-white tracking-tight font-display">
            {getSectionTitle()}
          </span>
        </div>

        <span className="text-slate-700 font-mono text-sm">/</span>

        <span className="text-[12px] text-slate-400 font-medium truncate hidden md:inline">
          {getSectionSubtitle()}
        </span>
      </div>

      {/* Middle: Live Cyber HUD Pill */}
      <div className="hidden lg:flex items-center gap-3 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || '00:00:00'} UTC</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-slate-700" />
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-slate-400">DEFCON:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            GUARDED
          </span>
        </div>
      </div>

      {/* Right: Actions & Status */}
      <div className="flex items-center gap-2.5">
        {/* Backend Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-500'
                : backendStatus === 'checking'
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span className={backendStatus === 'connected' ? 'text-emerald-400' : 'text-slate-400'}>
            {backendStatus === 'connected' ? 'API 200 OK' : backendStatus === 'checking' ? 'SYNCING' : 'OFFLINE'}
          </span>
        </div>

        {/* Primary Action: Dispatch / Simulate */}
        <button
          onClick={() => setMessageModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer border border-blue-500/40 active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch Packet</span>
        </button>

        {/* Secondary Action: Save */}
        <button
          onClick={saveTopology}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="Save current topology state"
        >
          <Save className="w-3.5 h-3.5 text-slate-400" />
          <span>Save</span>
        </button>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer relative ${
              isNotificationsOpen
                ? 'bg-slate-800 border-slate-700 text-slate-100'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Alerts & Audit Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-11 w-84 bg-[#0d1527] border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#090f1c]/90">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white font-display">System Alerts</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded-full">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10.5px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                      );
                    }}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      item.unread ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                        item.type === 'warning'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : item.type === 'success'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {item.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {item.type === 'success' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {item.type === 'info' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {item.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-slate-800/80 bg-[#090f1c]/90 flex items-center justify-center">
                <button
                  onClick={() => {
                    setActiveSection('event-logs');
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full py-1.5 text-center text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Open Audit Event Logs</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Operator Badge */}
        <div
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center select-none cursor-pointer hover:bg-slate-700 transition-colors"
          title="ICS Operator Console"
        >
          BG
        </div>
      </div>
    </header>
  );
};
