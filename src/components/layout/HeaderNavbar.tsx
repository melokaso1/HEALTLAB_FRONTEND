import React, { useMemo } from 'react';
import {
  Stethoscope,
  Users,
  Home,
  UserCheck,
  Calendar,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './HeaderNavbar.css';

export interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface HeaderNavbarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab = 'inicio',
  onSelectTab,
}) => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isDoctor = role === 'professional' || role === 'profesional' || role === 'doctor';
  const isReceptionist = role === 'receptionist' || role === 'recepcionista';

  const tabs: NavTab[] = useMemo(() => {
    if (isDoctor) {
      return [
        { id: 'agenda-medico', label: 'Mi Agenda', icon: <CalendarDays size={16} /> },
        { id: 'pacientes', label: 'Mis Pacientes', icon: <UserCheck size={16} /> },
        { id: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
        { id: 'historial-atencion', label: 'Historial de Atenciones', icon: <Clock size={16} /> },
      ];
    }

    if (isReceptionist) {
      return [
        { id: 'citas', label: 'Gestión de Citas', icon: <Calendar size={16} /> },
        { id: 'pacientes', label: 'Pacientes', icon: <UserCheck size={16} /> },
        { id: 'inicio', label: 'Inicio', icon: <Home size={16} /> },
      ];
    }

    // Default Admin Tabs (Director Médico)
    return [
      { id: 'inicio', label: 'Inicio', icon: <Home size={16} /> },
      { id: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
      { id: 'profesionales', label: 'Profesionales', icon: <Stethoscope size={16} /> },
      { id: 'pacientes', label: 'Pacientes', icon: <UserCheck size={16} /> },
      { id: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
      { id: 'historial-atencion', label: 'Historial y Reportes', icon: <Clock size={16} /> },
    ];
  }, [isDoctor, isReceptionist]);

  return (
    <nav className="header-navbar">
      <div className="header-navbar__tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`header-navbar__tab${isActive ? ' header-navbar__tab--active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="header-navbar__tab-icon">{tab.icon}</span>
              <span className="header-navbar__tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default HeaderNavbar;
