import { apiFetch } from './api';
import type {
  BackendPermiso,
  BackendRolPermiso,
  AsignarRolPermisoDto,
} from '../types/permission.types';

/**
 * Obtiene el catálogo completo de permisos del sistema.
 * Endpoint: GET /api/Permisos
 */
export const getPermisosApi = async (): Promise<BackendPermiso[]> => {
  try {
    const data = await apiFetch<BackendPermiso[]>('/Permisos');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[permissions.service] Error en GET /Permisos:', error);
    return [];
  }
};

/**
 * Obtiene un permiso por su ID único.
 * Endpoint: GET /api/Permisos/{id}
 */
export const getPermisoByIdApi = async (id: string): Promise<BackendPermiso | null> => {
  try {
    const data = await apiFetch<BackendPermiso>(`/Permisos/${id}`);
    return data;
  } catch (error) {
    console.warn(`[permissions.service] Error en GET /Permisos/${id}:`, error);
    return null;
  }
};

/**
 * Obtiene todas las asignaciones de permisos a roles.
 * Endpoint: GET /api/RolPermisos
 */
export const getRolPermisosApi = async (): Promise<BackendRolPermiso[]> => {
  try {
    const data = await apiFetch<BackendRolPermiso[]>('/RolPermisos');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[permissions.service] Error en GET /RolPermisos:', error);
    return [];
  }
};

/**
 * Obtiene la lista de permisos asignados a un rol específico por su GUID o nombre.
 * Endpoint: GET /api/RolPermisos/rol/{rolId}
 */
export const getRolPermisosByRolIdApi = async (
  rolId: string,
): Promise<BackendRolPermiso[]> => {
  if (
    !rolId ||
    rolId === 'admin' ||
    rolId === 'administrador' ||
    rolId === 'receptionist' ||
    rolId === 'recepcionista' ||
    rolId === 'professional' ||
    rolId === 'medico'
  ) {
    return [];
  }
  try {
    const data = await apiFetch<BackendRolPermiso[]>(`/RolPermisos/rol/${rolId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

/**
 * Asigna un permiso a un rol en el backend.
 * Endpoint: POST /api/RolPermisos
 */
export const assignRolPermisoApi = async (
  payload: AsignarRolPermisoDto,
): Promise<BackendRolPermiso> => {
  try {
    const data = await apiFetch<BackendRolPermiso>('/RolPermisos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error) {
    console.error('[permissions.service] Error en POST /RolPermisos:', error);
    throw error;
  }
};

/**
 * Revoca o elimina la asignación de un permiso a un rol por ID de la asignación.
 * Endpoint: DELETE /api/RolPermisos/{id}
 */
export const deleteRolPermisoApi = async (id: string): Promise<boolean> => {
  try {
    await apiFetch<void>(`/RolPermisos/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error(`[permissions.service] Error en DELETE /RolPermisos/${id}:`, error);
    return false;
  }
};
