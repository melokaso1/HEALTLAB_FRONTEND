import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderDashboard from './HeaderDashboard';
import HeaderNavbar from './HeaderNavbar';
import { useTheme } from '../../context/ThemeContext';
import Loading from '../common/Loading';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

const routeTabMap: Record<string, string> = {
  '/admin': 'inicio',
  '/inicio': 'inicio',
  '/agenda-medico': 'agenda-medico',
  '/mi-agenda': 'agenda-medico',
  '/profesional': 'agenda-medico',
  '/estadisticas': 'historial-atencion',
  '/reportes': 'historial-atencion',
  '/historial': 'historial-atencion',
  '/profesionales': 'profesionales',
  '/usuarios-roles': 'usuarios',
  '/usuarios': 'usuarios',
  '/pacientes': 'pacientes',
  '/gestion-citas': 'citas',
  '/citas': 'citas',
  '/historial-atencion': 'historial-atencion',
  '/perfil': 'configuracion',
  '/configuracion': 'configuracion',
  '/settings': 'configuracion',
};

const tabRouteMap: Record<string, string> = {
  'historial-atencion': '/historial-atencion',
  profesionales: '/profesionales',
  usuarios: '/usuarios',
  inicio: '/inicio',
  'agenda-medico': '/agenda-medico',
  pacientes: '/pacientes',
  citas: '/citas',
  configuracion: '/configuracion',
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userName = 'Juan Perez',
  userRole = 'Administrador',
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const activeTab = routeTabMap[location.pathname] || 'inicio';

  useEffect(() => {
    if (!isNavigating) return;
    const timer = window.setTimeout(() => setIsNavigating(false), 180);
    return () => window.clearTimeout(timer);
  }, [location.pathname, isNavigating]);

  const handleSelectTab = (tabId: string) => {
    const targetRoute = tabRouteMap[tabId] || '/admin';
    if (targetRoute === location.pathname) return;
    setIsNavigating(true);
    navigate(targetRoute);
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
        {/* Decorative left strip featuring HEALTLAB background pattern */}
        <div className="dashboard-layout__left-strip" />

        {/* Content Viewport */}
        <main className="dashboard-layout__content">{children}</main>
        {isNavigating && <Loading overlay text="Cargando sección..." />}
      </div>
    </div>
  );
};

export default DashboardLayout;
