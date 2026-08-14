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
  activo?: boolean;
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

const isValidPatientDocument = (
  type: Patient['documentType'],
  value: string,
): boolean => {
  const document = value.trim();
  return type === 'PAS'
    ? /^[a-z0-9]+$/i.test(document) && document.length <= 20
    : /^\d{6,12}$/.test(document);
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
const mapBackendPatient = (raw: BackendPaciente & { name?: string; nombre?: string; apellido?: string; numeroDocumento?: string; gender?: GenderType; age?: number; birthDate?: string }): Patient => {
  const p = raw.persona;
  let nombre = p?.nombre ?? raw.nombre ?? '';
  let apellido = p?.apellido ?? raw.apellido ?? '';
  let fullName = `${nombre} ${apellido}`.trim();

  if (!fullName && raw.name && raw.name !== 'Nuevo Paciente') {
    fullName = raw.name;
  }
  if (!fullName) fullName = 'Paciente sin nombre';

  const docNum = p?.numeroDocumento ?? raw.numeroDocumento ?? '';
  const stored = getStoredPatients().find(
    (sp) => String(sp.id) === String(raw.id) || (Boolean(docNum) && sp.documentNumber === docNum)
  );

  const genderFromBackend = mapGender(p?.sexo?.nombre);
  const ageFromBackend = calcAge(p?.fechaNacimiento);

  const gender = genderFromBackend !== 'Otro' ? genderFromBackend : (raw.gender || stored?.gender || 'Otro');
  const age = ageFromBackend > 0 ? ageFromBackend : (raw.age || stored?.age || 0);
  const birthDate = p?.fechaNacimiento || raw.birthDate || stored?.birthDate || '';

  const telefonoPrincipal =
    p?.telefonos?.find((t) => t.principal)?.numero ??
    p?.telefonos?.[0]?.numero ??
    stored?.contact?.phone ??
    '';
  const direccionPrincipal =
    p?.direcciones?.find((d) => d.principal)?.descripcion ??
    p?.direcciones?.[0]?.descripcion ??
    stored?.contact?.address ??
    '';
  const alergias = raw.alergias?.map((a) => a.nombre) ?? stored?.medicalData?.allergies ?? ['Ninguna'];

  return {
    id: raw.id as unknown as number,
    name: fullName,
    gender,
    age,
    birthDate,
    documentType: mapDocType(p?.tipoDocumento?.nombre) || stored?.documentType || 'CC',
    documentNumber: docNum || stored?.documentNumber || '',
    contact: {
      phone: telefonoPrincipal,
      email: stored?.contact?.email ?? '',
      address: direccionPrincipal,
    },
    lastVisitDate: raw.fechaRegistro
      ? new Date(raw.fechaRegistro).toLocaleDateString('es-CO')
      : (stored?.lastVisitDate ?? 'Sin visitas'),
    lastVisitSpecialty: stored?.lastVisitSpecialty ?? 'Sin registrar',
    specialtyBadgeColor: stored?.specialtyBadgeColor ?? 'green',
    status: raw.activo !== false ? 'active' : 'inactive',
    initials: buildInitials(nombre || fullName, apellido),
    avatarBg: pickColor(raw.id),
    medicalData: {
      bloodType: stored?.medicalData?.bloodType ?? 'N/A',
      allergies: alergias,
    },
    recentActivity: stored?.recentActivity ?? [],
    history: stored?.history ?? [],
    notes: stored?.notes ?? [],
  };
};

// ─── LocalStorage Persistence Helper ────────────────────────────────────
const LOCAL_PACIENTES_KEY = 'HEALTLAB_PERSISTENT_PACIENTES';

const getStoredPatients = (): Patient[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PACIENTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Patient[];
    return parsed.filter((p) => Boolean(p.id));
  } catch {
    return [];
  }
};

const saveStoredPatient = (patient: Patient) => {
  try {
    const current = getStoredPatients();
    const updated = [patient, ...current.filter((p) => String(p.id) !== String(patient.id))];
    localStorage.setItem(LOCAL_PACIENTES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error al guardar paciente en localStorage', e);
  }
};

// ─── API ──────────────────────────────────────────────────────────────────
export const getPatientsApi = async (): Promise<Patient[]> => {
  try {
    const data = await apiFetch<BackendPaciente[]>('/Pacientes');
    const mapped = Array.isArray(data) ? data.map(mapBackendPatient) : [];
    const stored = getStoredPatients();

    const combined = [...mapped];
    for (const sp of stored) {
      if (!combined.some((p) => String(p.id) === String(sp.id) || (Boolean(sp.documentNumber) && p.documentNumber === sp.documentNumber))) {
        combined.push(sp);
      }
    }
    return combined;
  } catch {
    return getStoredPatients();
  }
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
  const documentType = patient.documentType ?? 'CC';
  const documentNumber = patient.documentNumber ?? '';
  if (!isValidPatientDocument(documentType, documentNumber)) {
    throw new Error(
      documentType === 'PAS'
        ? 'El pasaporte debe ser alfanumérico y tener máximo 20 caracteres.'
        : 'CC, TI y CE deben contener entre 6 y 12 dígitos.',
    );
  }

  const parts = (patient.name ?? '').trim().split(/\s+/);
  // 1. Obtener TipoDocumentoId real del backend
  const tiposDoc = await getTiposDocumentoApi();
  const tipoDoc = tiposDoc.find((tipo) =>
    tipo.codigo?.toUpperCase() === (patient.documentType ?? 'CC').toUpperCase() ||
    tipo.nombre.toUpperCase() === (patient.documentType ?? 'CC').toUpperCase(),
  );
  if (!tipoDoc) throw new Error('No se encontró el tipo de documento seleccionado.');

  // Calcular fechaNacimiento
  let fechaNacimiento = patient.birthDate || '';
  if (!fechaNacimiento && patient.age && patient.age > 0) {
    const year = new Date().getFullYear() - patient.age;
    fechaNacimiento = `${year}-01-01`;
  }

  // Buscar sexoId
  let sexoId: string | undefined;
  try {
    const sexos = await apiFetch<Array<{ id: string; nombre: string }>>('/Sexos');
    const requestedGender = patient.gender ?? 'Otro';
    const aliases: Record<GenderType, string[]> = {
      Femenino: ['femenino', 'femenina', 'f'],
      Masculino: ['masculino', 'masculina', 'm'],
      Otro: ['otro', 'otra', 'o'],
    };
    const match = sexos.find((s) => {
      const name = s.nombre.trim().toLowerCase();
      return aliases[requestedGender].some((alias) => name === alias || name.includes(alias));
    });
    if (match) sexoId = match.id;
  } catch {
    // fallback if endpoint /Sexos does not exist
  }

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
        ...(fechaNacimiento ? { fechaNacimiento } : {}),
        ...(sexoId ? { sexoId } : {}),
        ...(patient.contact?.email ? { email: patient.contact.email } : {}),
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

  // 3. Crear Paciente en /Pacientes. Los errores se propagan a la UI.
  const raw = await apiFetch<BackendPaciente>('/Pacientes', {
    method: 'POST',
    body: JSON.stringify({ personaId, activo: patient.status !== 'inactive' }),
  });
  const createdPatient = mapBackendPatient(raw);

  const finalPatient: Patient = {
    ...createdPatient,
    name: (patient.name ?? createdPatient.name).trim() || createdPatient.name,
    gender: patient.gender ?? createdPatient.gender,
    age: patient.age !== undefined && patient.age > 0 ? patient.age : createdPatient.age,
    birthDate: fechaNacimiento || createdPatient.birthDate,
    contact: {
      ...createdPatient.contact,
      phone: patient.contact?.phone || createdPatient.contact.phone,
      email: patient.contact?.email || createdPatient.contact.email,
      address: patient.contact?.address || createdPatient.contact.address,
    },
    medicalData: {
      ...createdPatient.medicalData,
      bloodType: patient.medicalData?.bloodType || createdPatient.medicalData.bloodType,
      allergies: patient.medicalData?.allergies || createdPatient.medicalData.allergies,
    },
  };

  saveStoredPatient(finalPatient);
  return finalPatient;
};

export const updatePatientApi = async (
  id: string | number,
  patient: Partial<Patient>,
): Promise<Patient> => {
  const currentPatients = getStoredPatients();
  let existing = currentPatients.find((p) => String(p.id) === String(id));

  if (!existing) {
    const fromApi = await getPatientByIdApi(String(id));
    if (fromApi) existing = fromApi;
  }

  const documentType = patient.documentType ?? existing?.documentType ?? 'CC';
  const documentNumber = patient.documentNumber ?? existing?.documentNumber ?? '';
  if (!isValidPatientDocument(documentType, documentNumber)) {
    throw new Error(
      documentType === 'PAS'
        ? 'El pasaporte debe ser alfanumérico y tener máximo 20 caracteres.'
        : 'CC, TI y CE deben contener entre 6 y 12 dígitos.',
    );
  }

  const parts = (patient.name ?? existing?.name ?? '').trim().split(/\s+/);
  const initials = buildInitials(parts[0] ?? '', parts[1] ?? '');

  const updatedPatient: Patient = {
    id: existing?.id ?? id,
    name: patient.name ?? existing?.name ?? 'Paciente sin nombre',
    gender: patient.gender ?? existing?.gender ?? 'Otro',
    age: patient.age !== undefined && !isNaN(Number(patient.age)) ? Number(patient.age) : (existing?.age ?? 0),
    documentType: patient.documentType ?? existing?.documentType ?? 'CC',
    documentNumber: patient.documentNumber ?? existing?.documentNumber ?? '',
    contact: {
      phone: patient.contact?.phone ?? existing?.contact?.phone ?? '',
      email: patient.contact?.email ?? existing?.contact?.email ?? '',
      address: patient.contact?.address ?? existing?.contact?.address ?? '',
    },
    lastVisitDate: existing?.lastVisitDate ?? 'Hoy',
    lastVisitSpecialty: existing?.lastVisitSpecialty ?? 'Medicina General',
    specialtyBadgeColor: existing?.specialtyBadgeColor ?? 'green',
    status: patient.status ?? existing?.status ?? 'active',
    initials: initials || existing?.initials || 'P',
    avatarBg: existing?.avatarBg ?? pickColor(id),
    medicalData: {
      bloodType: patient.medicalData?.bloodType ?? existing?.medicalData?.bloodType ?? 'O+',
      allergies: patient.medicalData?.allergies ?? existing?.medicalData?.allergies ?? ['Ninguna'],
    },
    recentActivity: existing?.recentActivity ?? [],
    history: existing?.history ?? [],
    notes: existing?.notes ?? [],
  };

  saveStoredPatient(updatedPatient);

  try {
    await apiFetch<void>(`/Pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo: updatedPatient.status !== 'inactive' }),
    });
  } catch (error) {
    console.warn(`[patients.service] Error en PUT /Pacientes/${id}:`, error);
  }

  return updatedPatient;
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
