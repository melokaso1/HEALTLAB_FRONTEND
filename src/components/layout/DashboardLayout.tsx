import React, { useState } from 'react';
import HeaderDashboard from './HeaderDashboard';
import HeaderNavbar from './HeaderNavbar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName = 'Juan Perez',
  userRole = 'Director Médico',
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div className={`dashboard-layout${darkMode ? ' dark-mode' : ''}`}>
      {/* Sticky Top Header Container */}
      <div className="dashboard-layout__sticky-header">
        <HeaderDashboard
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          userName={userName}
          userRole={userRole}
        />
        <HeaderNavbar activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>

      {/* Main Body Area */}
      <div className="dashboard-layout__body">
        {/* Decorative left strip featuring login background pattern */}
        <div className="dashboard-layout__left-strip" />

        {/* Content Viewport */}
        <main className="dashboard-layout__content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
