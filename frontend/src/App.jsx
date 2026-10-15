import React, { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { IndustrialDevices } from './pages/IndustrialDevices';
import { CryptographyLab } from './pages/CryptographyLab';
import { AccessControl } from './pages/AccessControl';
import { SecureCommunication } from './pages/SecureCommunication';
import { SecurityEventLogs } from './pages/SecurityEventLogs';
import { ProjectInformation } from './pages/ProjectInformation';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');

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
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
