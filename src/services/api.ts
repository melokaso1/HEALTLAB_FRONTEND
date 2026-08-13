const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5077/api';

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      const error: ApiError = new Error('Sesión expirada o no autorizada');
      error.status = 401;
      throw error;
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
