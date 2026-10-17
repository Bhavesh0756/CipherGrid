import React, { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { IndustrialDevices } from './pages/IndustrialDevices';
import { CryptographyLab } from './pages/CryptographyLab';
import { AccessControl } from './pages/AccessControl';
import { SecureCommunication } from './pages/SecureCommunication';
import { SecurityEventLogs } from './pages/SecurityEventLogs';
import { ProjectInformation } from './pages/ProjectInformation';
import { AegisEntrySequence } from './components/AegisEntrySequence';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');

  // Check if initial boot sequence has already executed in this session
  const [isBooted, setIsBooted] = useState(() => {
    try {
      return sessionStorage.getItem('aegisgrid_session_booted') === 'true';
    } catch {
      return false;
    }
  });

  const [showEntrySequence, setShowEntrySequence] = useState(() => {
    try {
      return sessionStorage.getItem('aegisgrid_session_booted') !== 'true';
    } catch {
      return true;
    }
  });

  const [bootIteration, setBootIteration] = useState(0);

  const handleEntryComplete = () => {
    setIsBooted(true);
    setShowEntrySequence(false);
  };

  const handleReplayBootSequence = () => {
    setBootIteration(prev => prev + 1);
    setShowEntrySequence(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard onNavigate={setActiveTab} />;
      case 'devices':
        return <IndustrialDevices />;
      case 'crypto':
        return <CryptographyLab />;
      case 'access':
        return <AccessControl />;
      case 'communication':
        return <SecureCommunication />;
      case 'logs':
        return <SecurityEventLogs />;
      case 'project-info':
        return <ProjectInformation />;
      default:
        return <OverviewDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <>
      {showEntrySequence && (
        <AegisEntrySequence 
          key={bootIteration}
          onComplete={handleEntryComplete} 
          forcePlay={true}
        />
      )}
      <DashboardLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onReplayBoot={handleReplayBootSequence}
        isBooted={isBooted}
      >
        {renderContent()}
      </DashboardLayout>
    </>
  );
}

export default App;

