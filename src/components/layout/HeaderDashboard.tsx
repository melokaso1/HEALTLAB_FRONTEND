import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Settings,
  Home,
  Calendar,
  CalendarDays,
  UserCheck,
  Stethoscope,
  Clock,
  Smile,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import healtlabIcon from '../../assets/icons/HEALTLAB_sintitulo.png';
import healtlabTitle from '../../assets/icons/HEALTLAB_Titulo.png';
import medicoAvatar from '../../assets/images/medico1.jpeg';
import './HeaderDashboard.css';

interface HeaderDashboardProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userName?: string;
  userRole?: string;
}

const HeaderDashboard: React.FC<HeaderDashboardProps> = ({
  darkMode,
  onToggleDarkMode,
  userName = 'Juan Perez',
  userRole = 'Director Médico',
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('Disponible');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const role = (user?.role || '').toLowerCase();
  const isDoctor = role === 'professional' || role === 'profesional' || role === 'doctor';
  const isReceptionist = role === 'receptionist' || role === 'recepcionista';

  return (
    <header className="header-dashboard">
      {/* Brand logo left */}
      <div className="header-dashboard__brand">
        <img
          src={healtlabIcon}
          alt="HEALTLAB Icono"
          className="header-dashboard__logo-icon"
        />
        <img
          src={healtlabTitle}
          alt="HEALTLAB"
          className="header-dashboard__logo-title"
        />
      </div>

      {/* Right controls: Theme toggle, Notifications, User profile */}
      <div className="header-dashboard__actions">
        {/* Dark/Light mode toggle switch */}
        <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />

        {/* Notifications bell */}
        <button
          type="button"
          className="header-dashboard__notif-btn"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          <span className="header-dashboard__notif-badge" />
        </button>

        {/* User Profile Dropdown Container - Avatar Only Button */}
        <div className="header-dashboard__user-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className={`header-dashboard__user-avatar-btn${menuOpen ? ' header-dashboard__user-avatar-btn--open' : ''}`}
            onClick={toggleMenu}
            aria-label="Menú de usuario"
            aria-expanded={menuOpen}
          >
            <img
              src={medicoAvatar}
              alt={userName}
              className="header-dashboard__user-avatar"
            />
          </button>

          {/* Floating Popover Dropdown */}
          {menuOpen && (
            <div className="github-profile-dropdown">
              {/* Profile Card Header: Nombre, Correo, Rol */}
              <div className="github-profile-card">
                <div className="github-profile-card__avatar-row">
                  <img
                    src={medicoAvatar}
                    alt={userName}
                    className="github-profile-card__avatar"
                  />
                  <div className="github-profile-card__details">
                    <span className="github-profile-card__name">{userName}</span>
                    <span className="github-profile-card__email">
                      {user?.email || 'juan.perez@healtlab.com'}
                    </span>
                    <span className="github-profile-card__role">{userRole}</span>
                  </div>
                  <button
                    type="button"
                    className="github-profile-card__switch-btn"
                    title="Cambiar cuenta"
                  >
                    <ArrowRightLeft size={14} />
                  </button>
                </div>

                {/* Status bar button */}
                <button
                  type="button"
                  className="github-profile-card__status-btn"
                  onClick={() =>
                    setUserStatus((prev) =>
                      prev === 'Disponible' ? 'En Consulta' : 'Disponible'
                    )
                  }
                >
                  <Smile size={14} className="github-status-icon" />
                  <span>{userStatus}</span>
                </button>
              </div>

              <div className="github-dropdown-divider" />

              {/* Menu Navigation Links filtered by User Role */}
              <div className="github-dropdown-menu">
                {isDoctor ? (
                  <>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/agenda-medico')}
                    >
                      <CalendarDays size={16} />
                      <span>Mi Agenda</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/pacientes')}
                    >
                      <UserCheck size={16} />
                      <span>Mis Pacientes</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/gestion-citas')}
                    >
                      <Calendar size={16} />
                      <span>Citas</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/historial-atencion')}
                    >
                      <Clock size={16} />
                      <span>Historial de Atenciones</span>
                    </button>
                  </>
                ) : isReceptionist ? (
                  <>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/gestion-citas')}
                    >
                      <Calendar size={16} />
                      <span>Gestión de Citas</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/pacientes')}
                    >
                      <UserCheck size={16} />
                      <span>Pacientes</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/admin')}
                    >
                      <Home size={16} />
                      <span>Inicio</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/usuarios')}
                    >
                      <UserCheck size={16} />
                      <span>Usuarios</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/profesionales')}
                    >
                      <Stethoscope size={16} />
                      <span>Profesionales</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/pacientes')}
                    >
                      <UserCheck size={16} />
                      <span>Pacientes</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/gestion-citas')}
                    >
                      <Calendar size={16} />
                      <span>Gestión de Citas</span>
                    </button>
                    <button
                      type="button"
                      className="github-dropdown-item"
                      onClick={() => handleNavigate('/historial-atencion')}
                    >
                      <Clock size={16} />
                      <span>Historial y Reportes</span>
                    </button>
                  </>
                )}

                <div className="github-dropdown-divider" />

                <button
                  type="button"
                  className="github-dropdown-item"
                  onClick={() => handleNavigate('/configuracion')}
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </button>
              </div>

              <div className="github-dropdown-divider" />

              {/* Sign out item */}
              <button
                type="button"
                className="github-dropdown-item github-dropdown-item--logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;
