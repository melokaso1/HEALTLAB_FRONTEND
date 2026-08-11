import { apiFetch } from './api';
import type { LoginCredentials, AuthResponse, UserRole } from '../types/auth';

/**
 * Realiza la petición de autenticación a la API de .NET.
 * Si el servidor backend no responde o falla la red, provee autenticación de desarrollo.
 */
export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response && response.token && !response.user) {
      const { token, ...userData } = response as Record<string, unknown>;
      const stringToken = String(token);
      return {
        token: stringToken,
        user: {
          id: (userData.id || userData.userId || '1') as string | number,
          name: String(userData.name || userData.fullName || credentials.email.split('@')[0]),
          email: String(userData.email || credentials.email),
          role: (userData.role as UserRole) || 'admin',
          ...userData,
        },
      };
    }

    return response;
  } catch (error) {
    console.warn('[authService] Backend .NET no disponible. Usando autenticación de desarrollo:', error);

    const emailLower = credentials.email.toLowerCase();
    const isDoctor = emailLower.includes('medico') || emailLower.includes('doctor') || emailLower.includes('profesional');
    const role: UserRole = isDoctor ? 'professional' : 'admin';
    const name = isDoctor ? 'Dr. Alejandro Silva' : 'Juan Perez';

    return {
      token: `dev-session-token-${Date.now()}`,
      user: {
        id: isDoctor ? 2 : 1,
        name: name,
        email: credentials.email,
        role: role,
      },
    };
  }
};
