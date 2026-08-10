/**
 * Servicio de autenticación - Funciones placeholder.
 * Preparado para conectar con el backend .NET cuando esté disponible.
 *
 * Utiliza el servicio `loginApi` de `authService.ts` para la comunicación real.
 * Este archivo contiene helpers adicionales de validación y la lógica
 * de login placeholder para desarrollo.
 */

import type { LoginCredentials } from '../types/auth';

/**
 * Validación básica del correo electrónico.
 */
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'El correo electrónico es obligatorio';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Ingresa un correo electrónico válido';
  }
  return null;
};

/**
 * Validación básica de la contraseña.
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
};

/**
 * Valida las credenciales completas del formulario.
 */
export const validateLoginForm = (
  credentials: LoginCredentials
): { email: string | null; password: string | null } => {
  return {
    email: validateEmail(credentials.email),
    password: validatePassword(credentials.password),
  };
};

/**
 * Placeholder: Login con Google.
 * Preparado para integrar con OAuth 2.0 / Google Identity Services.
 */
export const handleGoogleLogin = async (): Promise<void> => {
  // TODO: Implementar autenticación con Google OAuth 2.0
  console.log('[auth.service] Google login - pendiente de implementación');
};

/**
 * Placeholder: Recuperación de contraseña.
 * Preparado para conectar con el endpoint de recovery del backend.
 */
export const handleForgotPassword = async (email?: string): Promise<void> => {
  // TODO: Implementar recuperación de contraseña via API
  console.log('[auth.service] Forgot password para:', email || 'sin email');
};
