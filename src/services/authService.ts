import { apiFetch } from './api';
import type { LoginCredentials, AuthResponse, UserRole } from '../types/auth';

/**
 * Realiza la petición de autenticación a la API de .NET.
 * Endpoint esperable: POST http://localhost:5000/api/auth/login
 */
export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Si el backend .NET retorna la estructura plana (ej: { token, id, name, role, email }),
  // normalizamos para asegurar que siempre haya response.user
  if (response && response.token && !response.user) {
    const { token, ...userData } = response as Record<string, unknown>;
    const stringToken = String(token);
    return {
      token: stringToken,
      user: {
        id: (userData.id || userData.userId || '1') as string | number,
        name: String(userData.name || userData.fullName || credentials.email.split('@')[0]),
        email: String(userData.email || credentials.email),
        role: (userData.role as UserRole) || 'professional',
        ...userData,
      },
    };
  }

  return response;
};
