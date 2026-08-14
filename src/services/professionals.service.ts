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

// ─── API ──────────────────────────────────────────────────────────────────
export const getProfessionalsApi = async (): Promise<ProfessionalOption[]> => {
  const data = await apiFetch<BackendMedico[]>('/Medicos');
  return Array.isArray(data)
    ? data.filter((medico) => medico.activo).map(mapBackendMedico)
    : [];
};

export const getProfessionalById = async (id: string): Promise<ProfessionalOption | null> => {
  try {
    const raw = await apiFetch<BackendMedico>(`/Medicos/${id}`);
    return mapBackendMedico(raw);
  } catch (error) {
    console.warn(`[professionals.service] Error en GET /medicos/${id}:`, error);
    if ((error as { status?: number }).status === 404) return null;
    throw error;
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
  numeroDocumento: string;
  tipoDocumento?: string;
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
  const numeroDocumento = String(p.numeroDocumento || '').trim();
  if (!numeroDocumento || numeroDocumento.length > 30) {
    throw new Error('El documento del profesional es requerido y debe tener máximo 30 caracteres.');
  }

  // The transactional endpoint creates Persona, Empleado, and Médico together.
  const [tiposDoc, cargos, especialidades] = await Promise.all([
    apiFetch<Array<{ id: string; codigo?: string; nombre?: string }>>('/TiposDocumento'),
    apiFetch<Array<{ id: string; codigo?: string }>>('/Cargos'),
    apiFetch<Array<{ id: string; nombre?: string }>>('/Especialidades'),
  ]);
  const tipoDoc = Array.isArray(tiposDoc)
    ? tiposDoc.find((tipo) => tipo.codigo?.toUpperCase() === (p.tipoDocumento || 'CC').toUpperCase()) || tiposDoc[0]
    : undefined;
  const medCargo = Array.isArray(cargos)
    ? cargos.find((cargo) => cargo.codigo === 'MED') || cargos[0]
    : undefined;
  const especialidad = Array.isArray(especialidades)
    ? especialidades.find((item) => item.nombre?.trim().toLowerCase() === p.especialidad?.trim().toLowerCase()) || especialidades[0]
    : undefined;
  if (!tipoDoc?.id || !medCargo?.id || !especialidad?.id) {
    throw new Error('No se encontraron los catálogos requeridos para registrar el profesional.');
  }

  const raw = await apiFetch<BackendMedico>('/Medicos/completo', {
    method: 'POST',
    body: JSON.stringify({
      persona: {
        nombre: p.nombre || 'Nuevo',
        apellido: p.apellido || 'Médico',
        tipoDocumentoId: tipoDoc.id,
        numeroDocumento,
      },
      cargoId: medCargo.id,
      fechaIngreso: new Date().toLocaleDateString('en-CA'),
      registroProfesional: p.registroProfesional || '',
      especialidadId: especialidad.id,
      activo: true,
    }),
  });
  const createdBackend = mapBackendMedico(raw);
  return createdBackend;
};
