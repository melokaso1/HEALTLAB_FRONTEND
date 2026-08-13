import type { Patient, GenderType } from '../types/patient.types';
import { apiFetch } from './api';

// ─── Tipos de respuesta del backend ───────────────────────────────────────
/**
 * Forma en que el backend serializa un PacienteEntity con sus relaciones.
 * Los campos en camelCase son los que ASP.NET envía por defecto.
 */
interface BackendPaciente {
  id: string;
  personaId: string;
  activo: boolean;
  fechaRegistro: string;
  persona?: {
    id: string;
    nombre: string;
    apellido: string;
    numeroDocumento: string;
    fechaNacimiento?: string;
    tipoDocumento?: { nombre: string };
    sexo?: { nombre: string };
    telefonos?: Array<{ numero: string; principal?: boolean }>;
    direcciones?: Array<{ descripcion: string; principal?: boolean }>;
  };
  alergias?: Array<{ nombre: string }>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const calcAge = (fechaNacimiento?: string): number => {
  if (!fechaNacimiento) return 0;
  const birth = new Date(fechaNacimiento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const mapDocType = (nombre?: string): Patient['documentType'] => {
  if (!nombre) return 'CC';
  const n = nombre.toUpperCase();
  if (n.includes('EXTRANJERÍA') || n.includes('CE')) return 'CE';
  if (n.includes('TARJETA') || n.includes('TI')) return 'TI';
  if (n.includes('PASAPORTE') || n.includes('PAS')) return 'PAS';
  return 'CC';
};

const mapGender = (nombre?: string): GenderType => {
  if (!nombre) return 'Otro';
  const n = nombre.toLowerCase();
  if (n.includes('femen') || n === 'f') return 'Femenino';
  if (n.includes('mascul') || n === 'm') return 'Masculino';
  return 'Otro';
};

const buildInitials = (nombre?: string, apellido?: string): string => {
  const n = (nombre ?? '').trim();
  const a = (apellido ?? '').trim();
  const i1 = n ? n[0] : '';
  const i2 = a ? a[0] : '';
  return (i1 + i2).toUpperCase() || 'P';
};

const AVATAR_COLORS = [
  '#0A9396', '#94D2BD', '#E9D8A6', '#EE9B00',
  '#CA6702', '#BB3E03', '#AE2012', '#9B2226',
];
const pickColor = (id?: string | number): string => {
  const str = String(id ?? '');
  if (!str) return AVATAR_COLORS[0];
  const charCode = str.charCodeAt(0) || 0;
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
};

// ─── Mapeo Backend → Frontend ─────────────────────────────────────────────
const mapBackendPatient = (raw: BackendPaciente): Patient => {
  const p = raw.persona;
  const nombre = p?.nombre ?? '';
  const apellido = p?.apellido ?? '';
  const telefonoPrincipal =
    p?.telefonos?.find((t) => t.principal)?.numero ??
    p?.telefonos?.[0]?.numero ??
    '';
  const direccionPrincipal =
    p?.direcciones?.find((d) => d.principal)?.descripcion ??
    p?.direcciones?.[0]?.descripcion ??
    '';
  const alergias = raw.alergias?.map((a) => a.nombre) ?? ['Ninguna'];

  return {
    id: raw.id as unknown as number,
    name: `${nombre} ${apellido}`.trim() || 'Paciente sin nombre',
    gender: mapGender(p?.sexo?.nombre),
    age: calcAge(p?.fechaNacimiento),
    documentType: mapDocType(p?.tipoDocumento?.nombre),
    documentNumber: p?.numeroDocumento ?? '',
    contact: {
      phone: telefonoPrincipal,
      email: '', // el backend no tiene email en Persona; puede venir de Usuario
      address: direccionPrincipal,
    },
    lastVisitDate: raw.fechaRegistro
      ? new Date(raw.fechaRegistro).toLocaleDateString('es-CO')
      : 'Sin visitas',
    lastVisitSpecialty: 'Sin registrar',
    specialtyBadgeColor: 'green',
    status: raw.activo ? 'active' : 'inactive',
    initials: buildInitials(nombre, apellido),
    avatarBg: pickColor(raw.id),
    medicalData: {
      bloodType: 'N/A',
      allergies: alergias,
    },
    recentActivity: [],
    history: [],
    notes: [],
  };
};

// ─── API ──────────────────────────────────────────────────────────────────
export const getPatientsApi = async (): Promise<Patient[]> => {
  try {
    const data = await apiFetch<BackendPaciente[]>('/pacientes');
    return Array.isArray(data) ? data.map(mapBackendPatient) : [];
  } catch (error) {
    console.warn('[patients.service] Conexión API /pacientes:', error);
    return [];
  }
};

export const getPatientByIdApi = async (id: string): Promise<Patient | null> => {
  try {
    const data = await apiFetch<BackendPaciente>(`/pacientes/${id}`);
    return mapBackendPatient(data);
  } catch (error) {
    console.warn(`[patients.service] Error en GET /pacientes/${id}:`, error);
    return null;
  }
};

export const createPatientApi = async (
  patient: Partial<Patient> & { personaId?: string },
): Promise<Patient> => {
  try {
    const body = {
      personaId: patient.personaId ?? '',
      activo: patient.status !== 'inactive',
    };
    const raw = await apiFetch<BackendPaciente>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapBackendPatient(raw);
  } catch (error) {
    console.warn('[patients.service] Error en POST /pacientes, registrando en estado local:', error);
    const parts = (patient.name ?? '').trim().split(/\s+/);
    const initials = buildInitials(parts[0] ?? 'Nuevo', parts[1] ?? 'Paciente');
    return {
      id: Date.now(),
      name: patient.name ?? 'Nuevo Paciente',
      gender: patient.gender ?? 'Femenino',
      age: Number(patient.age) || 30,
      documentType: patient.documentType ?? 'CC',
      documentNumber: patient.documentNumber ?? String(Date.now()),
      contact: {
        phone: patient.contact?.phone ?? '+57 300 000 0000',
        email: patient.contact?.email ?? '',
        address: patient.contact?.address ?? '',
      },
      lastVisitDate: 'Hoy',
      lastVisitSpecialty: 'Medicina General',
      specialtyBadgeColor: 'green',
      status: 'active',
      initials,
      avatarBg: '#0A9396',
      medicalData: {
        bloodType: patient.medicalData?.bloodType ?? 'O+',
        allergies: patient.medicalData?.allergies ?? ['Ninguna'],
      },
      recentActivity: [],
      history: [],
      notes: [],
    };
  }
};

export const updatePatientApi = async (
  id: string | number,
  patient: Partial<Patient>,
): Promise<Partial<Patient>> => {
  try {
    await apiFetch<void>(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: patient.status !== 'inactive' }),
    });
    return patient;
  } catch (error) {
    console.warn(`[patients.service] Error en PUT /pacientes/${id}:`, error);
    return patient;
  }
};

export const togglePatientStatusApi = async (
  id: string | number,
  currentStatus: 'active' | 'inactive',
): Promise<'active' | 'inactive'> => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await apiFetch(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: newStatus === 'active' }),
    });
    return newStatus;
  } catch (error) {
    console.warn(`[patients.service] Error cambiando estado del paciente ${id}:`, error);
    return newStatus;
  }
};

export const addPatientNoteApi = async (
  patientId: string | number,
  note: { author: string; text: string },
) => {
  // El backend no tiene endpoint de notas de paciente aún; guardamos localmente
  console.info(`[patients.service] Nota guardada localmente para paciente ${patientId}`);
  return { id: Date.now(), date: new Date().toLocaleDateString('es-CO'), ...note };
};

// Alias de compatibilidad con código existente
export const mockPatients: Patient[] = [];
