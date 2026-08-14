export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5077/api';
const AUTH_STORAGE_KEYS = ['token', 'refreshToken', 'user', 'sesionId'] as const;

const clearSession = (): void => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const sendRequest = (token: string | null) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(url, { ...options, headers });
    };

    let response = await sendRequest(localStorage.getItem('token'));

    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const isRefreshRequest = cleanEndpoint.toLowerCase() === '/auth/refresh';

      if (refreshToken && !isRefreshRequest) {
        const refreshResponse = await fetch(`${API_BASE_URL}/Auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshed = await refreshResponse.json() as {
            accessToken: string;
            refreshToken: string;
            usuarioId: string;
            username: string;
            email: string;
            rolNombre: string;
            sesionId?: string;
            debeCambiarPassword?: boolean;
          };
          localStorage.setItem('token', refreshed.accessToken);
          localStorage.setItem('refreshToken', refreshed.refreshToken);
          localStorage.setItem('user', JSON.stringify({
            id: refreshed.usuarioId,
            name: refreshed.username,
            email: refreshed.email,
            role: refreshed.rolNombre,
            sesionId: refreshed.sesionId,
            debeCambiarPassword: refreshed.debeCambiarPassword,
          }));
          if (refreshed.sesionId) localStorage.setItem('sesionId', refreshed.sesionId);
          response = await sendRequest(refreshed.accessToken);
        }
      }

      if (response.status === 401) {
        clearSession();

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        const error: ApiError = new Error('Sesión expirada o no autorizada');
        error.status = 401;
        throw error;
      }
    }

    if (!response.ok) {
      let errorData: unknown = null;
      const text = await response.text().catch(() => '');
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = text;
        }
      }

      const errorMessage =
        (typeof errorData === 'object' && errorData !== null && ('message' in errorData || 'title' in errorData || 'error' in errorData)
          ? String((errorData as Record<string, unknown>).message || (errorData as Record<string, unknown>).title || (errorData as Record<string, unknown>).error)
          : null) ||
        (typeof errorData === 'string' && errorData) ||
        `Error HTTP ${response.status}: ${response.statusText}`;

      const error: ApiError = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const resText = await response.text().catch(() => '');
    if (!resText) {
      return {} as T;
    }
    try {
      return JSON.parse(resText) as T;
    } catch {
      return resText as unknown as T;
    }
  } catch (error) {
    if (error instanceof Error && (error as ApiError).status) {
      throw error;
    }
    // Network or parse errors
    const networkError: ApiError = new Error(
      (error as Error)?.message || 'No se pudo conectar con el servidor backend'
    );
    throw networkError;
  }
}
