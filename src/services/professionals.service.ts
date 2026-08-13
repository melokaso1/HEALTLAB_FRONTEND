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

// ─── LocalStorage Persistence Helper ────────────────────────────────────
const LOCAL_MEDICOS_KEY = 'HEALTLAB_PERSISTENT_MEDICOS';

const getStoredMedicos = (): ProfessionalOption[] => {
  try {
    const raw = localStorage.getItem(LOCAL_MEDICOS_KEY);
    return raw ? (JSON.parse(raw) as ProfessionalOption[]) : [];
  } catch {
    return [];
  }
};

const saveStoredMedico = (prof: ProfessionalOption) => {
  try {
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
    const data = await apiFetch<BackendMedico[]>('/medicos');
    if (Array.isArray(data)) {
      backendList = data.filter((m) => m.activo).map(mapBackendMedico);
    }
  } catch (error) {
    console.warn('[professionals.service] Conexión API /medicos:', error);
  }

  const localList = getStoredMedicos();
  const mergedMap = new Map<string, ProfessionalOption>();

  // Cargar primero los de localStorage
  localList.forEach((m) => mergedMap.set(String(m.id), m));
  // Luego los del backend (sobrescribe si coincide ID de backend)
  backendList.forEach((m) => mergedMap.set(String(m.id), m));

  return Array.from(mergedMap.values());
};

export const getProfessionalById = async (id: string): Promise<ProfessionalOption | null> => {
  try {
    const raw = await apiFetch<BackendMedico>(`/medicos/${id}`);
    return mapBackendMedico(raw);
  } catch (error) {
    console.warn(`[professionals.service] Error en GET /medicos/${id}:`, error);
    const local = getStoredMedicos().find((m) => String(m.id) === String(id));
    return local || null;
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
  const fallbackId = `prof-${Date.now()}`;
  const nameInput = String(p.nombre ? `${p.nombre} ${p.apellido || ''}`.trim() : (p.name || 'Nuevo Médico'));
  const formattedName = nameInput.startsWith('Dr.') || nameInput.startsWith('Dra.') ? nameInput : `Dr. ${nameInput}`;
  const initials = nameInput.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'DM';

  const localProf: ProfessionalOption = {
    id: fallbackId,
    name: formattedName,
    specialty: String(p.especialidad || p.specialty || 'Medicina General'),
    initials,
    avatarBg: pickColor(fallbackId),
  };

  try {
    const apiBody = {
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      especialidad: p.especialidad || 'Medicina General',
      registroProfesional: p.registroProfesional || `REG-${Date.now().toString().slice(-6)}`,
      consultorio: p.consultorio || '101',
      activo: true,
      persona: {
        nombre: p.nombre || '',
        apellido: p.apellido || '',
        numeroDocumento: String(Date.now()),
      },
    };

    const raw = await apiFetch<BackendMedico>('/medicos', {
      method: 'POST',
      body: JSON.stringify(apiBody),
    });
    const createdBackend = mapBackendMedico(raw);
    saveStoredMedico(createdBackend);
    return createdBackend;
  } catch (error) {
    console.warn('[professionals.service] Error en POST /medicos, guardando en persistencia local:', error);
    saveStoredMedico(localProf);
    return localProf;
  }
};
