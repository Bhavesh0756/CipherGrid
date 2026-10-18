import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Play,
  Save,
  ShieldCheck,
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
    description: 'Unauthorized write attempt (0x06) from Rogue Tap to PLC-01 was rejected.',
    time: '2m ago',
    type: 'warning',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Crypto Session Established',
    description: 'Supervisory SCADA Server established authenticated TLS session with Switch.',
    time: '14m ago',
    type: 'success',
    unread: false,
  },
  {
    id: 'notif-3',
    title: 'Topology Synchronized',
    description: '7 industrial control nodes active with zero packet drop in Level 0-3.',
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
  } = useSimulatorStore();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);

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
      case 'network-lab': return 'Interactive Industrial Topology';
      case 'device-inventory': return 'Purdue Model Asset Directory';
      case 'packet-inspector': return 'Deep Simulation Event Analysis';
      case 'security-center': return 'Cryptographic & Access Control Workbench';
      case 'event-logs': return 'Persistent System & Audit Records';
      case 'lab-reports': return 'Security Evaluation & Technical Audit';
      case 'dashboard': return 'System Telemetry & Statistics';
      case 'settings': return 'Configuration & Security Parameters';
      default: return 'Interactive Industrial Topology';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between text-slate-700 select-none z-20 shrink-0">
      {/* Left: Section Context Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
          <span className="text-[15px] font-bold text-slate-900 tracking-tight">
            {getSectionTitle()}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <span className="text-slate-300 font-light text-sm mx-1">|</span>

        <span className="text-[13px] text-slate-500 font-normal truncate">
          {getSectionSubtitle()}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Online/Offline Status Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                : backendStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span>{backendStatus === 'connected' ? 'Online' : backendStatus === 'checking' ? 'Connecting' : 'Offline'}</span>
        </div>

        {/* Primary Action: Simulate */}
        <button
          onClick={() => setMessageModalOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate</span>
        </button>

        {/* Secondary Action: Save */}
        <button
          onClick={saveTopology}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer"
          title="Save current topology state"
        >
          <Save className="w-3.5 h-3.5 text-slate-600" />
          <span>Save</span>
        </button>

        {/* Notifications Icon & Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2 rounded-lg border transition-colors shadow-2xs cursor-pointer relative ${
              isNotificationsOpen
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-11 w-84 bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
              {/* Popover Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10.5px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                      );
                    }}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      item.unread ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                        item.type === 'warning'
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : item.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}
                    >
                      {item.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {item.type === 'success' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {item.type === 'info' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {item.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                    )}
                  </div>
                ))}
              </div>

              {/* Popover Footer */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center">
                <button
                  onClick={() => {
                    setActiveSection('event-logs');
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View All Security Logs</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Circle */}
        <div
          className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs select-none cursor-pointer hover:ring-2 hover:ring-blue-500/40 transition-all"
          title="Bhavesh Gambhirrao"
        >
          BG
        </div>
      </div>
    </header>
  );
};
