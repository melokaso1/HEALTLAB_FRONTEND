import React from 'react';
import {
  Stethoscope,
  Users,
  Home,
  UserCheck,
  Calendar,
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

const allTabs: NavTab[] = [
  { id: 'inicio', label: 'Inicio', icon: <Home size={16} /> },
  { id: 'profesionales', label: 'Profesionales', icon: <Stethoscope size={16} /> },
  { id: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
  { id: 'pacientes', label: 'Pacientes', icon: <UserCheck size={16} /> },
  { id: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
  { id: 'historial-atencion', label: 'Historial', icon: <Clock size={16} /> },
];

const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab = 'inicio',
  onSelectTab,
}) => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isDoctor =
    role === 'professional' ||
    role === 'profesional' ||
    role === 'medico' ||
    role === 'doctor';
  const isReceptionist =
    role === 'receptionist' ||
    role === 'recepcionista';

  let visibleTabs = allTabs;

  if (isDoctor) {
    visibleTabs = [
      { id: 'agenda-medico', label: 'Mi Agenda', icon: <Calendar size={16} /> },
      { id: 'pacientes', label: 'Mis Pacientes', icon: <UserCheck size={16} /> },
      { id: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
      { id: 'historial-atencion', label: 'Historial de Atenciones', icon: <Clock size={16} /> },
    ];
  } else if (isReceptionist) {
    visibleTabs = allTabs.filter((t) =>
      ['inicio', 'pacientes', 'citas', 'historial-atencion'].includes(t.id)
    );
  }

  return (
    <nav className="header-navbar">
      <div className="header-navbar__tabs">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              title={tab.label}
              aria-label={tab.label}
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
