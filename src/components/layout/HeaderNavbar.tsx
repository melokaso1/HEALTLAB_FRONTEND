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

const tabs: NavTab[] = [
  { id: 'profesionales', label: 'Profesionales', icon: <Stethoscope size={16} /> },
  { id: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
  { id: 'inicio', label: 'Inicio', icon: <Home size={16} /> },
  { id: 'pacientes', label: 'Pacientes', icon: <UserCheck size={16} /> },
  { id: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
  { id: 'historial-atencion', label: 'Historial y Reportes', icon: <Clock size={16} /> },
];

const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab = 'inicio',
  onSelectTab,
}) => {
  return (
    <nav className="header-navbar">
      <div className="header-navbar__tabs">
        {visibleTabs.map((tab) => {
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
