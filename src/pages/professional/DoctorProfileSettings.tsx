import React, { useState } from 'react';
import {
  Mail,
  Clock,
  IdCard,
  Building2,
  Camera,
  Sun,
  Moon,
  Globe,
  Bell,
  KeyRound,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../services/api';
import medicoAvatar from '../../assets/images/medico1.jpeg';
import './DoctorProfileSettings.css';

const DoctorProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form / Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Doctor Profile Info
  const doctorName = user?.name || 'Dr. Julian Moore';
  const specialty = 'Cardiología Intervencionista';
  const email = user?.email || 'j.moore@mediflow.pro';
  const schedule = 'Lun - Vie 08:00 - 17:00';
  const medicalId = 'MED-8492-CM';
  const facility = 'Pabellón Central - Torre B';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Por favor ingrese su contraseña actual');
      return;
    }
    if (newPassword.length < 8) {
      showToast('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden');
      return;
    }

    try {
      await apiFetch('/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Contraseña actualizada exitosamente en el servidor.');
    } catch (error: unknown) {
      console.error('[DoctorProfileSettings] Error al actualizar clave:', error);
      showToast(error instanceof Error ? error.message : 'Error al actualizar la contraseña en el servidor.');
    }
  };

  return (
    <div className="doc-profile-page">
      {/* Header Title Section */}
      <div className="doc-profile__header">
        <h1 className="doc-profile__title">Configuración de Perfil</h1>
        <p className="doc-profile__subtitle">
          Administra tu información profesional y preferencias de cuenta.
        </p>
      </div>

      {/* Main Grid: Info Card Left + Preferences & Security Right */}
      <div className="doc-profile__grid">
        {/* Left Column: Main Doctor Professional Info Card */}
        <div className="prof-card doc-profile-main-card">
          {/* Avatar Section */}
          <div className="doc-avatar-container">
            <div className="doc-avatar-wrapper">
              <img src={medicoAvatar} alt={doctorName} className="doc-avatar-img" />
              <button
                type="button"
                className="doc-avatar-edit-btn"
                title="Cambiar foto de perfil"
                onClick={() => showToast('Seleccione una imagen para cambiar foto de perfil')}
              >
                <Camera size={14} />
              </button>
            </div>
            <h2 className="doc-profile-name">{doctorName}</h2>
            <span className="doc-profile-specialty">{specialty}</span>
          </div>

          {/* 4 Metadata Info Boxes Grid */}
          <div className="doc-meta-grid">
            <div className="doc-meta-box">
              <div className="doc-meta-box__header">
                <Mail size={16} className="doc-meta-icon" />
                <span className="doc-meta-label">CORREO ELECTRÓNICO</span>
              </div>
              <span className="doc-meta-value">{email}</span>
            </div>

            <div className="doc-meta-box">
              <div className="doc-meta-box__header">
                <Clock size={16} className="doc-meta-icon" />
                <span className="doc-meta-label">HORARIO ASIGNADO</span>
              </div>
              <span className="doc-meta-value">{schedule}</span>
            </div>

            <div className="doc-meta-box">
              <div className="doc-meta-box__header">
                <IdCard size={16} className="doc-meta-icon" />
                <span className="doc-meta-label">ID MÉDICO</span>
              </div>
              <span className="doc-meta-value">{medicalId}</span>
            </div>

            <div className="doc-meta-box">
              <div className="doc-meta-box__header">
                <Building2 size={16} className="doc-meta-icon" />
                <span className="doc-meta-label">CENTRO PRINCIPAL</span>
              </div>
              <span className="doc-meta-value">{facility}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Security Cards */}
        <div className="doc-profile-side">
          {/* Card 1: Preferencias */}
          <div className="prof-card side-pref-card">
            <h3 className="side-card-title">Preferencias</h3>

            {/* Tema de Interfaz */}
            <div className="pref-item">
              <span className="pref-item-label">Tema de Interfaz</span>
              <div className="theme-toggle-group">
                <button
                  type="button"
                  className={`theme-opt-btn${!darkMode ? ' theme-opt-btn--active' : ''}`}
                  onClick={() => darkMode && toggleDarkMode()}
                >
                  <Sun size={14} />
                  <span>Claro</span>
                </button>
                <button
                  type="button"
                  className={`theme-opt-btn${darkMode ? ' theme-opt-btn--active' : ''}`}
                  onClick={() => !darkMode && toggleDarkMode()}
                >
                  <Moon size={14} />
                  <span>Oscuro</span>
                </button>
              </div>
            </div>

            {/* Idioma */}
            <button
              type="button"
              className="pref-link-item"
              onClick={() => showToast('Idioma del sistema: Español (Predeterminado)')}
            >
              <div className="pref-link-left">
                <Globe size={16} className="pref-link-icon" />
                <span>Idioma (Español)</span>
              </div>
              <span className="pref-link-arrow">›</span>
            </button>

            {/* Notificaciones */}
            <button
              type="button"
              className="pref-link-item"
              onClick={() => showToast('Notificaciones por correo y sistema activadas')}
            >
              <div className="pref-link-left">
                <Bell size={16} className="pref-link-icon" />
                <span>Notificaciones</span>
              </div>
              <span className="pref-link-arrow">›</span>
            </button>
          </div>

          {/* Card 2: Seguridad */}
          <div className="prof-card side-sec-card">
            <h3 className="side-card-title">Seguridad</h3>

            <button
              type="button"
              className="btn-sec-action btn-sec-action--change-pass"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <KeyRound size={15} />
              <span>Cambiar contraseña</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content change-pass-modal">
            <div className="modal-header">
              <div className="modal-header__title-group">
                <Lock size={18} />
                <h3 className="modal-title">Cambiar Contraseña</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Contraseña Actual</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repita la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary btn-save-pass">
                  <CheckCircle2 size={16} />
                  <span>Actualizar Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast message */}
      {toastMsg && <div className="toast-msg">{toastMsg}</div>}
    </div>
  );
};

export default DoctorProfileSettings;
