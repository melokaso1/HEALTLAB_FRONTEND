import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Settings,
  Smile,
  ArrowRightLeft,
  CheckCheck,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSignalR } from '../../context/SignalRContext';
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
   const { notifications, unreadCount, markAllNotificationsAsRead, clearNotifications } = useSignalR();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('Disponible');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header-dashboard">
      {/* Brand logo & title */}
      <div
        className="header-dashboard__brand"
        onClick={() => navigate('/inicio')}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={healtlabIcon}
          alt="Icono HEALTLAB"
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
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="header-dashboard__notif-btn"
            aria-label="Notificaciones"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="header-dashboard__notif-badge-count">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13.5px' }}>Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="notif-unread-count">{unreadCount} nuevas</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="notif-action-btn"
                    title="Marcar todas como leídas"
                    onClick={markAllNotificationsAsRead}
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    type="button"
                    className="notif-action-btn"
                    title="Limpiar notificaciones"
                    onClick={clearNotifications}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="notif-dropdown__list">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      No tienes notificaciones pendientes.
                    </p>
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}>
                      <div className="notif-item__icon">
                        {n.type === 'success' ? (
                          <CheckCircle size={16} color="#00A896" />
                        ) : n.type === 'warning' ? (
                          <AlertTriangle size={16} color="#EE9B00" />
                        ) : (
                          <Info size={16} color="#6366F1" />
                        )}
                      </div>
                      <div className="notif-item__content">
                        <div className="notif-item__title">{n.title}</div>
                        <div className="notif-item__msg">{n.message}</div>
                        <div className="notif-item__time">
                          {new Date(n.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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

              <div className="github-dropdown-menu">
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
