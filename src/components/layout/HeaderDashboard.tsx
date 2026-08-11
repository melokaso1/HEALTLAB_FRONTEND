import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
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
        {/* Dark/Light mode button */}
        <button
          type="button"
          className="header-dashboard__theme-btn"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>

        {/* Notifications bell */}
        <button
          type="button"
          className="header-dashboard__notif-btn"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          <span className="header-dashboard__notif-badge" />
        </button>

        {/* User profile card */}
        <div className="header-dashboard__user">
          <img
            src={medicoAvatar}
            alt={userName}
            className="header-dashboard__user-avatar"
          />
          <div className="header-dashboard__user-info">
            <span className="header-dashboard__user-name">{userName}</span>
            <span className="header-dashboard__user-role">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;
