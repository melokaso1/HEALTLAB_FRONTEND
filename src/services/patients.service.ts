import type { Patient, GenderType } from '../types/patient.types';
import { apiFetch, type ApiError } from './api';
import { getTiposDocumentoApi } from './catalogs.service';

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
const mapBackendPatient = (raw: BackendPaciente & { name?: string; nombre?: string; apellido?: string; numeroDocumento?: string }): Patient => {
  const p = raw.persona;
  let nombre = p?.nombre ?? raw.nombre ?? '';
  let apellido = p?.apellido ?? raw.apellido ?? '';
  let fullName = `${nombre} ${apellido}`.trim();

  if (!fullName && raw.name && raw.name !== 'Nuevo Paciente') {
    fullName = raw.name;
  }
  if (!fullName) fullName = 'Paciente sin nombre';

  const docNum = p?.numeroDocumento ?? raw.numeroDocumento ?? '';
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
    name: fullName,
    gender: mapGender(p?.sexo?.nombre),
    age: calcAge(p?.fechaNacimiento),
    documentType: mapDocType(p?.tipoDocumento?.nombre),
    documentNumber: docNum,
    contact: {
      phone: telefonoPrincipal,
      email: '',
      address: direccionPrincipal,
    },
    lastVisitDate: raw.fechaRegistro
      ? new Date(raw.fechaRegistro).toLocaleDateString('es-CO')
      : 'Sin visitas',
    lastVisitSpecialty: 'Sin registrar',
    specialtyBadgeColor: 'green',
    status: raw.activo ? 'active' : 'inactive',
    initials: buildInitials(nombre || fullName, apellido),
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
  const data = await apiFetch<BackendPaciente[]>('/Pacientes');
  return Array.isArray(data) ? data.map(mapBackendPatient) : [];
};

export const getPatientByIdApi = async (id: string): Promise<Patient | null> => {
  try {
    const data = await apiFetch<BackendPaciente>(`/Pacientes/${id}`);
    return mapBackendPatient(data);
  } catch (error) {
    if ((error as ApiError).status === 404) return null;
    throw error;
  }
};

/**
 * Busca un paciente por número de documento (cédula).
 * GET /pacientes/por-documento/{numeroDocumento}
 * 404 → null; otros errores se re-lanzan.
 */
export const getPatientByDocumentApi = async (
  numeroDocumento: string,
): Promise<Patient | null> => {
  const doc = numeroDocumento.trim();
  if (!doc) {
    throw new Error('El número de documento es requerido');
  }

  try {
    const data = await apiFetch<BackendPaciente>(
      `/Pacientes/por-documento/${encodeURIComponent(doc)}`,
    );
    return mapBackendPatient(data);
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 409) throw error;
    if (apiError.status !== 404) throw error;

    const tipos = await getTiposDocumentoApi();
    const cc = tipos.find((tipo) =>
      tipo.codigo?.toUpperCase() === 'CC' || tipo.nombre.toUpperCase() === 'CC' ||
      tipo.nombre.toUpperCase().includes('CÉDULA'),
    );
    if (!cc) return null;
    return searchPatientApi(cc.id, doc);
  }
};

export const searchPatientApi = async (
  tipoDocumentoId: string,
  numeroDocumento: string,
): Promise<Patient | null> => {
  try {
    const data = await apiFetch<BackendPaciente>(
      `/Pacientes/buscar?tipoDocumento=${encodeURIComponent(tipoDocumentoId)}&numeroDocumento=${encodeURIComponent(numeroDocumento.trim())}`,
    );
    return mapBackendPatient(data);
  } catch (error) {
    if ((error as ApiError).status === 404) return null;
    throw error;
  }
};

export const createPatientApi = async (
  patient: Partial<Patient> & { personaId?: string },
): Promise<Patient> => {
  const parts = (patient.name ?? '').trim().split(/\s+/);
  // 1. Obtener TipoDocumentoId real del backend
  const tiposDoc = await getTiposDocumentoApi();
  const tipoDoc = tiposDoc.find((tipo) =>
    tipo.codigo?.toUpperCase() === (patient.documentType ?? 'CC').toUpperCase() ||
    tipo.nombre.toUpperCase() === (patient.documentType ?? 'CC').toUpperCase(),
  );
  if (!tipoDoc) throw new Error('No se encontró el tipo de documento seleccionado.');

  // 2. Crear Persona en /Personas si no existe
  let personaId = patient.personaId && patient.personaId.length === 36 ? patient.personaId : '';
  if (!personaId) {
    const personaRes = await apiFetch<{ id: string }>('/Personas', {
      method: 'POST',
      body: JSON.stringify({
        nombre: parts[0] ?? 'Nuevo',
        apellido: parts.slice(1).join(' ') || 'Paciente',
        tipoDocumentoId: tipoDoc.id,
        numeroDocumento: patient.documentNumber,
        telefonos: patient.contact?.phone
          ? [{ numero: patient.contact.phone, principal: true }]
          : [],
        direcciones: patient.contact?.address
          ? [{ descripcion: patient.contact.address, principal: true }]
          : [],
      }),
    });
    personaId = personaRes.id;
  }

  // 3. Crear Paciente en /Pacientes
  const raw = await apiFetch<BackendPaciente>('/Pacientes', {
    method: 'POST',
    body: JSON.stringify({ personaId, activo: patient.status !== 'inactive' }),
  });
  return mapBackendPatient(raw);
};

export const updatePatientApi = async (
  id: string | number,
  patient: Partial<Patient>,
): Promise<Partial<Patient>> => {
  try {
    await apiFetch<void>(`/Pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: patient.status !== 'inactive' }),
    });
    return patient;
  } catch (error) {
    throw error;
  }
};

export const togglePatientStatusApi = async (
  id: string | number,
  currentStatus: 'active' | 'inactive',
): Promise<'active' | 'inactive'> => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await apiFetch(`/Pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: newStatus === 'active' }),
    });
    return newStatus;
  } catch (error) {
    throw error;
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
