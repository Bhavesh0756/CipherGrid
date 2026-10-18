import React, { useEffect } from 'react';
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
  const { activeSection, fetchTopology, error } = useSimulatorStore();

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f6fa] text-slate-800 font-sans">
      {/* Sidebar spanning full height */}
      <Sidebar />

      {/* Main workspace container with Topbar and content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />

        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {error && (
            <div className="bg-rose-600 text-white px-4 py-1.5 text-xs flex items-center gap-2 z-30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
};

export default App;
