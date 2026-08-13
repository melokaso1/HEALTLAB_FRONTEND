import type { ManagedUser, PermissionGroup, UserRoleType } from '../types/user.types';
import { apiFetch } from './api';
import { BACKEND_ROLE_MAP, FRONTEND_ROLE_MAP } from '../types/auth';

export const mockUsers: ManagedUser[] = [];

// ─── Tipo del backend (UsuarioDto) ─────────────────────────────────────────
interface BackendUsuario {
  id?: string;
  usuarioId?: string;
  empleadoId?: string;
  rolId?: string;
  username: string;
  email: string;
  activo: boolean;
  fechaCreacion?: string;
  ultimoLogin?: string;
  debeCambiarPassword?: boolean;
  tokenVersion?: number;
  empleado?: {
    persona?: { nombre: string; apellido: string };
  };
  rol?: { nombre?: string; nombreRol?: string };
}

// ─── Mapeo Backend → Frontend ─────────────────────────────────────────────
const mapBackendUser = (
  raw: BackendUsuario,
  roleMap?: Map<string, string>,
): ManagedUser => {
  const userId = raw.id || raw.usuarioId || `usr-${Math.random().toString(36).substr(2, 9)}`;
  const persona = raw.empleado?.persona;
  const fullName = persona
    ? `${persona.nombre} ${persona.apellido}`.trim()
    : raw.username;

  const rolFromMap = raw.rolId ? roleMap?.get(raw.rolId) : '';
  const rolNombre = raw.rol?.nombreRol || raw.rol?.nombre || rolFromMap || '';
  const usrNameLower = (raw.username || '').toLowerCase();
  const emailLower = (raw.email || '').toLowerCase();

  let role: UserRoleType = 'receptionist';
  if (
    rolNombre.toLowerCase().includes('admin') ||
    usrNameLower.includes('admin') ||
    usrNameLower.includes('legoat') ||
    emailLower.includes('admin')
  ) {
    role = 'admin';
  } else if (
    rolNombre.toLowerCase().includes('prof') ||
    rolNombre.toLowerCase().includes('med') ||
    usrNameLower.includes('medico') ||
    usrNameLower.includes('doctor')
  ) {
    role = 'professional';
  } else {
    role = (BACKEND_ROLE_MAP[rolNombre] as UserRoleType) ?? 'receptionist';
  }

  const initials = (fullName || 'US')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const lastAccess = raw.ultimoLogin
    ? new Date(raw.ultimoLogin).toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Sin acceso registrado';

  return {
    id: userId,
    name: fullName,
    email: raw.email,
    role,
    status: raw.activo ? 'active' : 'inactive',
    initials,
    avatarBg: role === 'admin' ? '#CA6702' : role === 'professional' ? '#0A9396' : '#005F73',
    lastAccess,
  };
};

// ─── Helpers de permisos (UI local) ───────────────────────────────────────
export const getRolePermissions = (role: UserRoleType): PermissionGroup[] => {
  const isAdmin = role === 'admin';
  const isProfessional = role === 'professional';

  return [
    {
      id: 'agenda',
      title: 'Agenda y Citas',
      icon: 'calendar',
      items: [
        { id: 'ver_propia', label: 'Ver propia agenda', status: 'allowed' },
        { id: 'crear_editar', label: 'Crear/Editar citas propias', status: 'allowed' },
        {
          id: 'ver_global',
          label: 'Ver agendas de citas globales',
          status: isAdmin ? 'allowed' : 'denied',
        },
      ],
    },
    {
      id: 'fichas',
      title: 'Fichas Clínicas',
      icon: 'file',
      items: [
        { id: 'acceso_hc', label: 'Acceso completo a H.C.', status: 'allowed' },
        {
          id: 'firmar_atencion',
          label: 'Firmar atenciones',
          status: isProfessional || isAdmin ? 'allowed' : 'denied',
        },
        { id: 'subir_doc', label: 'Subir documentos adjuntos', status: 'allowed' },
      ],
    },
    {
      id: 'config',
      title: 'Configuración Sistema',
      icon: 'gear',
      items: [
        {
          id: 'gestionar_usuarios',
          label: 'Gestionar usuarios',
          status: isAdmin ? 'allowed' : 'denied',
        },
        {
          id: 'config_clinica',
          label: 'Configuración de clínica',
          status: isAdmin ? 'allowed' : 'denied',
        },
      ],
    },
  ];
};

export const getRoleLabel = (role: UserRoleType): string => {
  const labels: Record<UserRoleType, string> = {
    admin: 'Administrador',
    professional: 'Profesional',
    receptionist: 'Recepcionista',
  };
  return labels[role] ?? role;
};

// ─── API ──────────────────────────────────────────────────────────────────
export const getUsersApi = async (): Promise<ManagedUser[]> => {
  try {
    const [data, roles] = await Promise.all([
      apiFetch<BackendUsuario[]>('/usuarios'),
      apiFetch<Array<{ id: string; nombreRol?: string }>>('/Roles').catch(() => []),
    ]);

    const roleMap = new Map<string, string>();
    if (Array.isArray(roles)) {
      roles.forEach((r) => {
        if (r.id && r.nombreRol) roleMap.set(r.id, r.nombreRol);
      });
    }

    return Array.isArray(data) ? data.map((u) => mapBackendUser(u, roleMap)) : [];
  } catch (error) {
    console.warn('[users.service] Conexión API /usuarios:', error);
    return [];
  }
};

export interface CreateUserPayload {
  empleadoId: string;
  rolId: string;
  username: string;
  email: string;
  password: string;
  activo?: boolean;
  debeCambiarPassword?: boolean;
}

export const createUserApi = async (
  payload: CreateUserPayload & { roleType?: string },
): Promise<ManagedUser> => {
  // 0. Pre-validar contraseña antes de realizar escrituras en la base de datos
  if (!payload.password || payload.password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  let personaId = '';

  try {
    // 1. Sanitizar Username para cumplir con Backend UsernameValueObject (^[a-z0-9._\-]+$, min 5 chars)
    let sanitizedUsername = payload.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (sanitizedUsername.length < 5) {
      sanitizedUsername = payload.username.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    }
    if (sanitizedUsername.length < 5) {
      sanitizedUsername = `${sanitizedUsername}user_${Date.now().toString().slice(-4)}`;
    }

    // 2. Obtener catálogos requeridos (TipoDocumento, Rol, Cargo)
    let tipoDocId = '';
    let rolId = payload.rolId && payload.rolId.length === 36 ? payload.rolId : '';
    let cargoId = '';

    try {
      const tiposDoc = await apiFetch<Array<{ id: string }>>('/TiposDocumento');
      if (Array.isArray(tiposDoc) && tiposDoc[0]) tipoDocId = tiposDoc[0].id;

      const roles = await apiFetch<Array<{ id: string; nombreRol?: string }>>('/Roles');
      if (Array.isArray(roles) && roles.length > 0) {
        const targetRoleName = payload.roleType || 'receptionist';
        let matchedRole = roles[0];
        if (targetRoleName === 'admin') {
          matchedRole = roles.find((r) => r.nombreRol === 'Administrador') || roles[0];
        } else if (targetRoleName === 'professional') {
          matchedRole = roles.find((r) => r.nombreRol === 'Profesional') || roles[0];
        } else {
          matchedRole = roles.find((r) => r.nombreRol === 'Recepcionista') || roles[0];
        }
        rolId = matchedRole.id;
      }

      const cargos = await apiFetch<Array<{ id: string }>>('/Cargos');
      if (Array.isArray(cargos) && cargos[0]) cargoId = cargos[0].id;
    } catch (err) {
      console.warn('[users.service] Error consultando catálogos:', err);
    }

    // 3. Crear Persona en /Personas
    const parts = payload.username.trim().split(/\s+/);
    if (tipoDocId) {
      const personaRes = await apiFetch<{ id: string }>('/Personas', {
        method: 'POST',
        body: JSON.stringify({
          nombre: parts[0] || 'Usuario',
          apellido: parts.slice(1).join(' ') || 'Sistema',
          tipoDocumentoId: tipoDocId,
          numeroDocumento: `DOC${Date.now().toString().slice(-7)}`,
        }),
      });
      if (personaRes?.id) personaId = personaRes.id;
    }

    // 4. Crear Empleado en /Empleados vinculando PersonaId y CargoId
    let empleadoId = payload.empleadoId && payload.empleadoId.length === 36 ? payload.empleadoId : '';
    if (personaId && cargoId) {
      const empRes = await apiFetch<{ id: string }>('/Empleados', {
        method: 'POST',
        body: JSON.stringify({
          personaId,
          cargoId,
          fechaIngreso: new Date().toISOString().split('T')[0],
          activo: true,
        }),
      });
      if (empRes?.id) empleadoId = empRes.id;
    }

    // 5. Crear Usuario en /Usuarios vinculando EmpleadoId y RolId
    if (empleadoId && rolId) {
      const raw = await apiFetch<BackendUsuario>('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          empleadoId,
          rolId,
          username: sanitizedUsername,
          email: payload.email,
          password: payload.password,
          activo: payload.activo ?? true,
          debeCambiarPassword: payload.debeCambiarPassword ?? false,
        }),
      });
      return mapBackendUser(raw);
    }

    throw new Error('No se pudieron asociar el Empleado y Rol para el nuevo usuario.');
  } catch (error) {
    console.error('[users.service] Error en flujo de creación de usuario en backend:', error);
    // Rollback: Eliminar la persona huérfana creada si el paso final de Usuario falló
    if (personaId) {
      console.warn(`[users.service] Revirtiendo creación de Persona huérfana ${personaId}...`);
      await apiFetch(`/Personas/${personaId}`, { method: 'DELETE' }).catch(() => {});
    }
    throw error;
  }
};

export interface UpdateUserPayload {
  rolId?: string;
  activo?: boolean;
  debeCambiarPassword?: boolean;
}

export const updateUserApi = async (
  id: string | number,
  payload: UpdateUserPayload,
): Promise<Partial<ManagedUser>> => {
  try {
    await apiFetch<void>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    // Mapear el cambio de rol si vino
    const result: Partial<ManagedUser> = {};
    if (payload.activo !== undefined) result.status = payload.activo ? 'active' : 'inactive';
    return result;
  } catch (error) {
    console.warn(`[users.service] Error en PUT /usuarios/${id}:`, error);
    return {};
  }
};

export const toggleUserStatusApi = async (
  id: string | number,
  currentStatus: 'active' | 'inactive',
): Promise<'active' | 'inactive'> => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: newStatus === 'active' }),
    });
    return newStatus;
  } catch (error) {
    console.warn(`[users.service] Error al cambiar estado del usuario ${id}:`, error);
    return newStatus;
  }
};

export const changeUserRoleApi = async (
  id: string | number,
  newRole: UserRoleType,
  rolId: string,
): Promise<UserRoleType> => {
  try {
    await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ rolId }),
    });
    return newRole;
  } catch (error) {
    console.warn(`[users.service] Error al cambiar rol del usuario ${id}:`, error);
    return newRole;
  }
};

// Alias exportados para compatibilidad
export { FRONTEND_ROLE_MAP };
