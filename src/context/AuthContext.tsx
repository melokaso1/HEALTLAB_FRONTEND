/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, AuthResponse } from '../types/auth';
import type { BackendPermiso } from '../types/permission.types';
import {
  loginApi,
  logoutApi,
  refreshTokenApi,
  saveAuthStorage,
  clearAuthStorage,
} from '../services/authService';
import { getRolPermisosByRolIdApi, getPermisosApi } from '../services/permissions.service';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: BackendPermiso[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  hasPermission: (codigo: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? (JSON.parse(savedUser) as User) : null;
    } catch (e) {
      console.error('Error al parsear el usuario almacenado en localStorage', e);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  );

  const [permissions, setPermissions] = useState<BackendPermiso[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Carga dinámica de permisos del backend según el rol del usuario
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions([]);
        return;
      }
      try {
        const rolId = (user as unknown as { rolId?: string }).rolId || user.role;
        const rolPermisos = await getRolPermisosByRolIdApi(rolId);
        if (rolPermisos.length > 0) {
          const activePerms = rolPermisos
            .map((rp) => rp.permiso)
            .filter((p): p is BackendPermiso => !!p);
          setPermissions(activePerms);
        } else {
          // Fallback: cargar catálogo completo si no hay filtro por rol especifico
          const allPerms = await getPermisosApi();
          setPermissions(allPerms);
        }
      } catch (error) {
        console.warn('[AuthContext] Error al cargar permisos dinámicos del backend:', error);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (codigo: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || (user.role as string) === 'administrador') return true;
    return permissions.some(
      (p) => p.codigo?.toUpperCase() === codigo.toUpperCase() || p.nombre?.toLowerCase() === codigo.toLowerCase(),
    );
  };

  // ─── Login ───────────────────────────────────────────────────────────────
  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await loginApi(credentials);

      if (!response.token || !response.user) {
        throw new Error('Respuesta de autenticación inválida del servidor');
      }

      setToken(response.token);
      setUser(response.user);
      saveAuthStorage(response);

      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutApi(); // invalida la sesión en el backend
    } finally {
      setUser(null);
      setToken(null);
      setPermissions([]);
      clearAuthStorage();
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  // ─── Refresh Token ───────────────────────────────────────────────────────
  const refresh = async (): Promise<boolean> => {
    const newAuth = await refreshTokenApi();
    if (!newAuth) return false;

    setToken(newAuth.token);
    setUser(newAuth.user);
    saveAuthStorage(newAuth);
    return true;
  };

  const value: AuthContextType = {
    user,
    token,
    permissions,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refresh,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
