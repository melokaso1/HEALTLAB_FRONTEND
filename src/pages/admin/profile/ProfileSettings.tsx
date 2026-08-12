import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Bell,
  Moon,
  Save,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import medicoAvatar from '../../../assets/images/medico1.jpeg';
import './ProfileSettings.css';

const ProfileSettings: React.FC = () => {
  const { user, logout } = useAuth();

  // Personal Info Form State
  const [fullName, setFullName] = useState<string>(user?.name || 'Dr. María García');
  const [email, setEmail] = useState<string>(user?.email || 'maria.garcia@healtlab.es');
  const [phone, setPhone] = useState<string>('+57 (301) 123-4567');
  const [specialty, setSpecialty] = useState<string>('Cirugía General');
  const [avatarPreview, setAvatarPreview] = useState<string>(medicoAvatar);

  // Preferences State
  const [darkModeDefault, setDarkModeDefault] = useState<boolean>(true);
  const [rememberPassword, setRememberPassword] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password Visibility Eye Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Toast Feedback Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Avatar Upload Handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUri = URL.createObjectURL(file);
      setAvatarPreview(imageUri);
      showToast('Foto de perfil actualizada correctamente');
    }
  };

  // Save Personal Info Submit
  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Información personal guardada con éxito');
  };

  // Update Password Submit
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Por favor ingrese su contraseña actual');
      return;
    }
    if (newPassword.length < 6) {
      showToast('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Contraseña actualizada de forma segura');
  };

  return (
    <div className="profile-settings">
      {/* Toast Banner Notification */}
      {toastMessage && (
        <div className="profile-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="profile-settings__header">
        <h1 className="profile-settings__title">Perfil y Configuración</h1>
        <p className="profile-settings__subtitle">
          Gestiona los ajustes de tu cuenta y preferencias.
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="profile-settings__grid">
        {/* Left Column: Personal Info & Preferences */}
        <div className="profile-settings__col">
          {/* Card 1: Información Personal */}
          <div className="profile-card">
            <h2 className="profile-card__title">Información Personal</h2>

            <form onSubmit={handleSavePersonalInfo}>
              {/* Profile Picture Row */}
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper">
                  <img src={avatarPreview} alt="Foto de perfil" className="profile-avatar-img" />
                </div>
                <div className="profile-avatar-info">
                  <span className="profile-avatar-label">Foto de Perfil</span>
                  <span className="profile-avatar-sub">JPG, GIF o PNG. Tamaño máx de 800K.</span>
                  <label htmlFor="avatar-upload" className="profile-avatar-btn">
                    <Upload size={14} />
                    <span>Cambiar Imagen</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Nombre Completo</label>
                  <div className="profile-input-wrapper">
                    <User size={16} className="profile-input-icon" />
                    <input
                      type="text"
                      className="profile-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Correo Electrónico</label>
                  <div className="profile-input-wrapper">
                    <Mail size={16} className="profile-input-icon" />
                    <input
                      type="email"
                      className="profile-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Número de Teléfono</label>
                  <div className="profile-input-wrapper">
                    <Phone size={16} className="profile-input-icon" />
                    <input
                      type="text"
                      className="profile-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Especialidad</label>
                  <div className="profile-input-wrapper">
                    <Stethoscope size={16} className="profile-input-icon" />
                    <input
                      type="text"
                      className="profile-input"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-card__footer">
                <button type="submit" className="profile-btn profile-btn--primary">
                  <Save size={15} />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Preferencias */}
          <div className="profile-card">
            <h2 className="profile-card__title">Preferencias</h2>

            <div className="profile-preferences-list">
              <div className="profile-pref-row">
                <div className="profile-pref-info">
                  <Moon size={16} className="profile-pref-icon" />
                  <span>Activar modo oscuro por defecto</span>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={darkModeDefault}
                    onChange={(e) => setDarkModeDefault(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="profile-pref-row">
                <div className="profile-pref-info">
                  <ShieldCheck size={16} className="profile-pref-icon" />
                  <span>Recordar contraseña en este dispositivo</span>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={rememberPassword}
                    onChange={(e) => setRememberPassword(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="profile-pref-row">
                <div className="profile-pref-info">
                  <Bell size={16} className="profile-pref-icon" />
                  <span>Recibir notificaciones por correo electrónico</span>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sesión & Seguridad */}
        <div className="profile-settings__col">
          {/* Card 3: Sesión (Red Danger Box) */}
          <div className="profile-card profile-card--danger">
            <h2 className="profile-card__title profile-card__title--danger">Sesión</h2>
            <p className="profile-card__desc">
              Cerrar sesión de forma segura en todos los dispositivos.
            </p>
            <button
              type="button"
              className="profile-btn profile-btn--danger"
              onClick={logout}
            >
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>

          {/* Card 4: Seguridad */}
          <div className="profile-card">
            <h2 className="profile-card__title">Seguridad</h2>
            <p className="profile-card__desc">
              Asegúrate de que tu cuenta utiliza una contraseña larga y aleatoria para mayor seguridad.
            </p>

            <form onSubmit={handleUpdatePassword} className="profile-security-form">
              {/* Contraseña Actual */}
              <div className="profile-field">
                <label className="profile-label">Contraseña Actual</label>
                <div className="profile-input-wrapper">
                  <Lock size={16} className="profile-input-icon" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="profile-input profile-input--password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="profile-eye-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="profile-field">
                <label className="profile-label">Nueva Contraseña</label>
                <div className="profile-input-wrapper">
                  <Lock size={16} className="profile-input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="profile-input profile-input--password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="profile-eye-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="profile-field">
                <label className="profile-label">Confirmar Contraseña</label>
                <div className="profile-input-wrapper">
                  <Lock size={16} className="profile-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="profile-input profile-input--password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="profile-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="profile-card__footer">
                <button type="submit" className="profile-btn profile-btn--primary" style={{ width: '100%' }}>
                  <ShieldCheck size={15} />
                  <span>Actualizar Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
