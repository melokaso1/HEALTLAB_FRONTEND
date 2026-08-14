import type { ProfessionalOption } from '../types/appointment.types';
import { apiFetch } from './api';

export const mockProfessionals: ProfessionalOption[] = [];

// ─── Tipo del backend (MedicoEntity con relaciones) ───────────────────────
interface BackendMedico {
  id: string;
  empleadoId: string;
  usuarioId?: string;
  registroProfesional?: string;
  activo: boolean;
  empleado?: {
    id?: string;
    usuarioId?: string;
    persona?: {
      nombre: string;
      apellido: string;
      email?: string;
    };
  };
  especialidades?: Array<{
    especialidad?: { nombre: string };
  }>;
}

// ─── Mapeo Backend → Frontend ─────────────────────────────────────────────
const AVATAR_COLORS = [
  '#0A9396', '#94D2BD', '#E9D8A6', '#EE9B00',
  '#CA6702', '#BB3E03', '#AE2012', '#9B2226',
];

const pickColor = (id: string): string =>
  AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const mapBackendMedico = (
  raw: BackendMedico & { name?: string; nombre?: string; apellido?: string; especialidad?: string },
): ProfessionalOption => {
  const persona = raw.empleado?.persona;
  let nombre = '';

  if (persona?.nombre || persona?.apellido) {
    nombre = `${persona.nombre || ''} ${persona.apellido || ''}`.trim();
  } else if (raw.nombre || raw.apellido) {
    nombre = `${raw.nombre || ''} ${raw.apellido || ''}`.trim();
  } else if (raw.name) {
    nombre = raw.name.replace(/^(Dr\.|Dra\.|Dr|Dra)\s+/i, '').trim();
  }

  if (!nombre || nombre.toLowerCase() === 'médico' || nombre.toLowerCase() === 'medico') {
    if (raw.registroProfesional) {
      nombre = `Especialista ${raw.registroProfesional}`;
    } else {
      nombre = 'Especialista Médico';
    }
  }

  const specialty =
    raw.especialidades?.[0]?.especialidad?.nombre ?? raw.especialidad ?? 'Medicina General';

  const formattedName = nombre.startsWith('Dr.') || nombre.startsWith('Dra.') ? nombre : `Dr. ${nombre}`;

  const initials = nombre
    .replace(/^(Dr\.|Dra\.|Dr|Dra)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase() || 'EM';

  return {
    id: raw.id,
    name: formattedName,
    specialty,
    initials,
    avatarBg: pickColor(String(raw.id || '1')),
  };
};

// ─── LocalStorage Persistence Helper ────────────────────────────────────
const LOCAL_MEDICOS_KEY = 'HEALTLAB_PERSISTENT_MEDICOS';

const getStoredMedicos = (): ProfessionalOption[] => {
  try {
    const raw = localStorage.getItem(LOCAL_MEDICOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProfessionalOption[];
    // Filtrar entradas genericas quemadas del historial de navegacion local
    return parsed.filter(
      (m) =>
        m.name &&
        !m.name.includes('Dr. Médico') &&
        !m.name.includes('Dr. medico') &&
        !m.name.includes('Nuevo Médico')
    );
  } catch {
    return [];
  }
};

const saveStoredMedico = (prof: ProfessionalOption) => {
  try {
    if (prof.name.includes('Dr. Médico') || prof.name.includes('Nuevo Médico')) return;
    const current = getStoredMedicos();
    const updated = [prof, ...current.filter((p) => String(p.id) !== String(prof.id))];
    localStorage.setItem(LOCAL_MEDICOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error al guardar médico en localStorage', e);
  }
};

// ─── API ──────────────────────────────────────────────────────────────────
export const getProfessionalsApi = async (): Promise<ProfessionalOption[]> => {
  let backendList: ProfessionalOption[] = [];
  try {
    const data = await apiFetch<BackendMedico[]>('/Medicos');
    if (Array.isArray(data)) {
      backendList = data.filter((m) => m.activo).map(mapBackendMedico);
    }
  } catch (error) {
    console.warn('[professionals.service] Conexión API /medicos:', error);
  }

  const localList = getStoredMedicos();
  const mergedMap = new Map<string, ProfessionalOption>();

  localList.forEach((m) => {
    if (!m.name.includes('Dr. Médico')) mergedMap.set(String(m.id), m);
  });
  backendList.forEach((m) => {
    if (!m.name.includes('Dr. Médico')) mergedMap.set(String(m.id), m);
  });

  return Array.from(mergedMap.values());
};

export const getProfessionalById = async (id: string): Promise<ProfessionalOption | null> => {
  try {
    const raw = await apiFetch<BackendMedico>(`/Medicos/${id}`);
    return mapBackendMedico(raw);
  } catch (error) {
    console.warn(`[professionals.service] Error en GET /medicos/${id}:`, error);
    const local = getStoredMedicos().find((m) => String(m.id) === String(id));
    return local || null;
  }
};

/** Resolves the backend Medico id associated with the authenticated user. */
export const resolveMedicoIdForUser = async (user: Record<string, unknown> | null): Promise<string> => {
  const explicitId = String(user?.medicoId ?? '').trim();
  if (explicitId) return explicitId;

  const userId = String(user?.id ?? user?.usuarioId ?? '').trim();
  const email = String(user?.email ?? '').trim().toLowerCase();
  const name = String(user?.name ?? '').replace(/^(dr\.?|dra\.?)\s*/i, '').trim().toLowerCase();

  try {
    const medicos = await apiFetch<BackendMedico[]>('/Medicos');
    const matched = medicos.find((medico) => {
      const persona = medico.empleado?.persona;
      const fullName = `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim().toLowerCase();
      return [
        medico.id,
        medico.usuarioId,
        medico.empleadoId,
        medico.empleado?.id,
        medico.empleado?.usuarioId,
      ].some((id) => Boolean(userId) && String(id ?? '') === userId) ||
        (Boolean(email) && persona?.email?.toLowerCase() === email) ||
        (Boolean(name) && fullName === name);
    });
    return matched?.id ?? '';
  } catch (error) {
    console.warn('[professionals.service] No se pudo resolver el médico de la sesión:', error);
    return '';
  }
};

export interface CreateProfessionalPayload {
  nombre: string;
  apellido: string;
  especialidad?: string;
  registroProfesional?: string;
  consultorio?: string;
}

export const createProfessionalApi = async (
  payload: CreateProfessionalPayload | Record<string, unknown>,
): Promise<ProfessionalOption> => {
  const p = payload as Record<string, string>;
  const nameInput = String(p.nombre ? `${p.nombre} ${p.apellido || ''}`.trim() : (p.name || 'Nuevo Médico'));
  if (!nameInput.trim()) throw new Error('El nombre del profesional es requerido.');

  // 1. Consultar catálogos requeridos por el backend.
  const [tiposDoc, cargos] = await Promise.all([
    apiFetch<Array<{ id: string }>>('/TiposDocumento'),
    apiFetch<Array<{ id: string; codigo?: string }>>('/Cargos'),
  ]);
  const tipoDocId = Array.isArray(tiposDoc) ? tiposDoc[0]?.id : '';
  const medCargo = Array.isArray(cargos)
    ? cargos.find((cargo) => cargo.codigo === 'MED') || cargos[0]
    : undefined;
  if (!tipoDocId || !medCargo?.id) {
    throw new Error('No se encontraron los catálogos requeridos para registrar el profesional.');
  }

  // 2. Crear Persona, 3. Empleado y 4. Médico. Cualquier fallo se propaga.
  const personaRes = await apiFetch<{ id: string }>('/Personas', {
    method: 'POST',
    body: JSON.stringify({
      nombre: p.nombre || 'Nuevo',
      apellido: p.apellido || 'Médico',
      tipoDocumentoId: tipoDocId,
      numeroDocumento: String(Date.now()),
    }),
  });
  if (!personaRes?.id) throw new Error('El servidor no devolvió la persona creada.');

  const empRes = await apiFetch<{ id: string }>('/Empleados', {
    method: 'POST',
    body: JSON.stringify({
      personaId: personaRes.id,
      cargoId: medCargo.id,
      fechaIngreso: new Date().toISOString().split('T')[0],
      activo: true,
    }),
  });
  if (!empRes?.id) throw new Error('El servidor no devolvió el empleado creado.');

  const raw = await apiFetch<BackendMedico>('/Medicos', {
    method: 'POST',
    body: JSON.stringify({
      empleadoId: empRes.id,
      registroProfesional: p.registroProfesional || `REG-${Date.now().toString().slice(-6)}`,
      activo: true,
    }),
  });
  const createdBackend = mapBackendMedico(raw);
  saveStoredMedico(createdBackend);
  return createdBackend;
};
