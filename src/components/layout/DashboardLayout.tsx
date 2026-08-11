import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderDashboard from './HeaderDashboard';
import HeaderNavbar from './HeaderNavbar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

const routeTabMap: Record<string, string> = {
  '/admin': 'inicio',
  '/inicio': 'inicio',
  '/estadisticas': 'reportes',
  '/profesionales': 'profesionales',
  '/usuarios-roles': 'usuarios',
  '/pacientes': 'pacientes',
  '/gestion-citas': 'citas',
  '/historial-atencion': 'historial',
  '/perfil': 'inicio',
};

const tabRouteMap: Record<string, string> = {
  reportes: '/estadisticas',
  profesionales: '/profesionales',
  usuarios: '/usuarios-roles',
  inicio: '/admin',
  pacientes: '/pacientes',
  citas: '/gestion-citas',
  historial: '/historial-atencion',
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName = 'Juan Perez',
  userRole = 'Director Médico',
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = routeTabMap[location.pathname] || 'inicio';

  const handleSelectTab = (tabId: string) => {
    const targetRoute = tabRouteMap[tabId] || '/admin';
    navigate(targetRoute);
  };

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
        <HeaderNavbar activeTab={activeTab} onSelectTab={handleSelectTab} />
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
