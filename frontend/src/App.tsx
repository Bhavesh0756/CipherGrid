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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f1f3f5] text-slate-900 font-sans">
      {/* Top Application Bar */}
      <Topbar />

      {/* Main Workspace with Sidebar and Content View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {error && (
            <div className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between z-30">
              <span className="font-mono">Simulator Notice: {error}</span>
            </div>
          )}
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
};

export default App;
