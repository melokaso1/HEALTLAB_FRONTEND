import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
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

        {/* User profile dropdown container */}
        <div className="header-dashboard__user-wrapper" ref={dropdownRef}>
          <div
            className={`header-dashboard__user${menuOpen ? ' header-dashboard__user--open' : ''}`}
            onClick={toggleMenu}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleMenu()}
          >
            <img
              src={medicoAvatar}
              alt={userName}
              className="header-dashboard__user-avatar"
            />
            <div className="header-dashboard__user-info">
              <span className="header-dashboard__user-name">{userName}</span>
              <span className="header-dashboard__user-role">{userRole}</span>
            </div>
            <ChevronDown
              size={16}
              className={`header-dashboard__user-chevron${menuOpen ? ' header-dashboard__user-chevron--rotated' : ''}`}
            />
          </div>

          {/* Floating Dropdown Menu */}
          {menuOpen && (
            <div className="header-dashboard__user-dropdown">
              <div className="header-dashboard__dropdown-header">
                <span className="header-dashboard__dropdown-name">{userName}</span>
                <span className="header-dashboard__dropdown-email">
                  {user?.email || 'admin@healtlab.com'}
                </span>
              </div>
              <div className="header-dashboard__dropdown-divider" />
              <button
                type="button"
                className="header-dashboard__dropdown-item header-dashboard__dropdown-item--logout"
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
