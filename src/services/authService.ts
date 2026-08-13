import { apiFetch } from './api';
import type {
  LoginCredentials,
  AuthResponse,
  BackendLoginResponse,
  UserRole,
} from '../types/auth';
import { BACKEND_ROLE_MAP } from '../types/auth';

// ─── Constantes de storage ─────────────────────────────────────────────────
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const SESSION_KEY = 'sesionId';

// ─── Helpers de almacenamiento ────────────────────────────────────────────
export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const getStoredRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getStoredSessionId = (): string | null => localStorage.getItem(SESSION_KEY);

export const clearAuthStorage = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const saveAuthStorage = (response: AuthResponse): void => {
  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  if (response.user.sesionId) {
    localStorage.setItem(SESSION_KEY, response.user.sesionId);
  }
};

// ─── Mapeo del backend al frontend ────────────────────────────────────────
const mapBackendResponse = (
  raw: BackendLoginResponse,
): AuthResponse => {
  const role: UserRole = BACKEND_ROLE_MAP[raw.rolNombre] ?? 'receptionist';

  return {
    token: raw.accessToken,
    refreshToken: raw.refreshToken,
    user: {
      id: raw.usuarioId,
      name: raw.username,
      email: raw.email,
      role,
      sesionId: raw.sesionId,
      debeCambiarPassword: raw.debeCambiarPassword,
    },
  };
};

// ─── Login ─────────────────────────────────────────────────────────────────
/**
 * Autentica al usuario contra el backend .NET.
 * En caso de fallo de red provee autenticación de desarrollo.
 */
export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const raw = await apiFetch<BackendLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        usernameOrEmail: credentials.email, // el backend acepta email o username
        password: credentials.password,
      }),
    });

    return mapBackendResponse(raw);
  } catch (error) {
    console.warn('[authService] Backend no disponible, usando autenticación de desarrollo:', error);

    // ─── Fallback de desarrollo ──────────────────────────────────────────
    const emailLower = credentials.email.toLowerCase();
    let role: UserRole = 'admin';
    let name = 'Admin Sistema';
    let id = 'dev-admin-001';

    if (emailLower.includes('recep') || emailLower.includes('ana')) {
      role = 'receptionist';
      name = 'Ana Martínez';
      id = 'dev-recep-003';
    } else if (
      emailLower.includes('medico') ||
      emailLower.includes('doctor') ||
      emailLower.includes('profesional')
    ) {
      role = 'professional';
      name = 'Dra. Sarah Jenkins';
      id = 'dev-prof-002';
    }

    return {
      token: `dev-access-token-${Date.now()}`,
      refreshToken: `dev-refresh-token-${Date.now()}`,
      user: { id, name, email: credentials.email, role },
    };
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────
/**
 * Solicita un nuevo accessToken usando el refreshToken almacenado.
 * Devuelve null si no hay refreshToken o la petición falla.
 */
export const refreshTokenApi = async (): Promise<AuthResponse | null> => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  // No enviar refreshes en sesiones de desarrollo
  if (refreshToken.startsWith('dev-')) return null;

  try {
    const raw = await apiFetch<BackendLoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return mapBackendResponse(raw);
  } catch (error) {
    console.warn('[authService] No se pudo renovar el token:', error);
    return null;
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────
/**
 * Invalida la sesión en el backend.
 * Silencia errores para no bloquear el logout local.
 */
export const logoutApi = async (): Promise<void> => {
  const sesionId = getStoredSessionId();

  // No llamar al backend en sesiones de desarrollo
  const token = getStoredToken();
  if (!token || token.startsWith('dev-')) return;

  try {
    if (sesionId) {
      await apiFetch(`/auth/logout/${sesionId}`, { method: 'POST' });
    } else {
      await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    }
  } catch (error) {
    // El logout local siempre procede aunque el backend falle
    console.warn('[authService] Error al invalidar sesión en backend:', error);
  }
};
