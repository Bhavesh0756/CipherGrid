import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { EntryAnimation } from './components/EntryAnimation/EntryAnimation';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { DeviceInventory } from './pages/DeviceInventory';
import { EventLogs } from './pages/EventLogs';
import { LabReports } from './pages/LabReports';
import { NetworkLab } from './pages/NetworkLab';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { PacketInspector } from './pages/PacketInspector';
import { SecurityCenter } from './pages/SecurityCenter';
import { Settings } from './pages/Settings';
import { useSimulatorStore } from './store/useSimulatorStore';

export const App: React.FC = () => {
  const { activeSection, fetchTopology, error, clearError } = useSimulatorStore();

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  // Auto-dismiss transient error after 6 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'network-lab':
        return <NetworkLab />;
      case 'device-inventory':
        return <DeviceInventory />;
      case 'packet-inspector':
        return <PacketInspector />;
      case 'security-center':
        return <SecurityCenter />;
      case 'event-logs':
        return <EventLogs />;
      case 'lab-reports':
        return <LabReports />;
      case 'dashboard':
        return <OverviewDashboard />;
      case 'settings':
        return <Settings />;
      default:
        return <NetworkLab />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-white">
      {/* High-Tech Cyber Entry Sequence Overlay */}
      <EntryAnimation />

      {/* Sidebar spanning full height */}
      <Sidebar />

      {/* Main workspace container with Topbar and content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#070b14]">
        <Topbar />

        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 bg-[#070b14]">
          {error && (
            <div className="bg-rose-950/80 border-b border-rose-500/40 text-rose-200 px-4 py-2 text-xs flex items-center justify-between z-30 shrink-0 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="font-mono font-medium">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="p-1 rounded hover:bg-rose-900/60 text-rose-300 hover:text-white transition-colors cursor-pointer"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
};

export default App;
