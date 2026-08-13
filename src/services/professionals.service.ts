import type { ProfessionalOption } from '../types/appointment.types';
import { apiFetch } from './api';

export const mockProfessionals: ProfessionalOption[] = [];

// ─── Tipo del backend (MedicoEntity con relaciones) ───────────────────────
interface BackendMedico {
  id: string;
  empleadoId: string;
  registroProfesional?: string;
  activo: boolean;
  empleado?: {
    persona?: {
      nombre: string;
      apellido: string;
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

const mapBackendMedico = (raw: BackendMedico): ProfessionalOption => {
  const persona = raw.empleado?.persona;
  const nombre = persona ? `${persona.nombre} ${persona.apellido}`.trim() : 'Médico';
  const specialty =
    raw.especialidades?.[0]?.especialidad?.nombre ?? 'Medicina General';

  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return {
    id: raw.id,
    name: `Dr. ${nombre}`,
    specialty,
    initials,
    avatarBg: pickColor(raw.id),
  };
};

// ─── API ──────────────────────────────────────────────────────────────────
export const getProfessionalsApi = async (): Promise<ProfessionalOption[]> => {
  try {
    const data = await apiFetch<BackendMedico[]>('/medicos');
    return Array.isArray(data)
      ? data.filter((m) => m.activo).map(mapBackendMedico)
      : [];
  } catch (error) {
    console.warn('[professionals.service] Conexión API /medicos:', error);
    return [];
  }
};

export const getProfessionalById = async (id: string): Promise<ProfessionalOption | null> => {
  try {
    const raw = await apiFetch<BackendMedico>(`/medicos/${id}`);
    return mapBackendMedico(raw);
  } catch (error) {
    console.warn(`[professionals.service] Error en GET /medicos/${id}:`, error);
    return null;
  }
};
