import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, LogIn, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Header from '../../../components/layout/Header';
import ThemeToggle from '../../../components/common/ThemeToggle';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  validateLoginForm,
  handleForgotPassword,
} from '../../../services/auth.service';
import medicoImg from '../../../assets/images/medico1.jpeg';
import './Login.css';

const Login: React.FC = () => {
  const { login, isLoading: authLoading } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email: string | null; password: string | null }>({
    email: null,
    password: null,
  });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loading = isLoading || authLoading;

  /**
   * Handler principal de login.
   * Conecta con AuthContext y redirige al dashboard.
   */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccess(null);

    // Validación del formulario
    const validation = validateLoginForm({ email, password });
    setErrors(validation);

    if (validation.email || validation.password) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({ email, password });
      setSuccess(`¡Bienvenido, ${user.name}!`);

      const targetPath = (user.role || '').toLowerCase() === 'admin' ? '/admin' : '/admin';
      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 300);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión. Inténtalo de nuevo.';
      setGlobalError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = () => {
    handleForgotPassword(email);
  };

  return (
    <div className={`login-page${darkMode ? ' dark-mode' : ''}`}>
      <div className="login-container">
        {/* Columna izquierda: Imagen del médico */}
        <div className="login-image-panel">
          <img
            src={medicoImg}
            alt="Profesional médico de HEALTLAB"
            className="login-image-panel__img"
          />
        </div>

        {/* Columna derecha: Formulario */}
        <div className="login-form-panel">
          <div className="login-form-content">
            <div className="login-form-wrapper">
              {/* Header / Logo Healtlab */}
              <Header />

              {/* Badge */}
              <div className="login-badge">
                <Shield size={15} strokeWidth={2.2} className="login-badge__icon" />
                <span className="login-badge__text">Sistema de Gestión Clínica</span>
              </div>

              {/* Títulos */}
              <h1 className="login-title">Bienvenido de vuelta</h1>
              <p className="login-subtitle">
                Ingresa tus credenciales para entrar al sistema
              </p>

              {/* Tarjeta */}
              <div className="login-card">
                {/* Avatar */}
                <div className="login-avatar">
                  <User size={46} strokeWidth={1.8} />
                </div>

                {/* Mensajes globales */}
                {globalError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={16} className="login-error__icon" />
                    <span className="login-error__text">{globalError}</span>
                  </div>
                )}

                {success && (
                  <div className="login-success" role="status">
                    <CheckCircle size={16} className="login-success__icon" />
                    <span className="login-success__text">{success}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} noValidate>
                  {/* Campo usuario / correo */}
                  <div className="login-field">
                    <div className="login-field__header">
                      <label htmlFor="login-username" className="login-field__label">
                        Usuario o correo electrónico
                      </label>
                    </div>
                    <div className="login-field__input-wrapper">
                      <span className="login-field__input-icon">
                        <User size={16} strokeWidth={2} />
                      </span>
                      <input
                        id="login-username"
                        type="text"
                        className={`login-field__input${errors.email ? ' login-field__input--error' : ''}`}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                        }}
                        placeholder="Usuario o correo electrónico"
                        autoComplete="username"
                        disabled={loading}
                      />
                    </div>
                    {errors.email && (
                      <p className="login-field__error">{errors.email}</p>
                    )}
                  </div>

                  {/* Campo contraseña */}
                  <div className="login-field">
                    <div className="login-field__header">
                      <label htmlFor="login-password" className="login-field__label">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        className="login-field__forgot"
                        onClick={onForgotPassword}
                        tabIndex={-1}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="login-field__input-wrapper">
                      <span className="login-field__input-icon">
                        <Lock size={16} strokeWidth={2} />
                      </span>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`login-field__input${errors.password ? ' login-field__input--error' : ''}`}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                        }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="login-field__toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff size={16} strokeWidth={2} />
                        ) : (
                          <Eye size={16} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="login-field__error">{errors.password}</p>
                    )}
                  </div>

                  {/* Recordarme */}
                  <label className="login-remember" htmlFor="login-remember">
                    <span className="login-remember__checkbox">
                      <input
                        id="login-remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                      />
                      <span className="login-remember__checkmark" />
                    </span>
                    <span className="login-remember__text">
                      Recordarme en este dispositivo
                    </span>
                  </label>

                  {/* Botón principal */}
                  <button
                    type="submit"
                    className={`login-btn${loading ? ' login-btn--loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="login-btn__spinner" />
                    ) : (
                      <>
                        <LogIn size={18} strokeWidth={2.2} />
                        <span>Iniciar sesión</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón modo oscuro/claro en esquina superior derecha */}
      <div className="login-top-right-toggle">
        <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
      </div>
    </div>
  );
};

export default Login;
