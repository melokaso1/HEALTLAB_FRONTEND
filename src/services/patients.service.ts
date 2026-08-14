import type { Patient, GenderType } from '../types/patient.types';
import { apiFetch, type ApiError } from './api';
import { getSexosApi, getTiposDocumentoApi } from './catalogs.service';

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
  telefono?: string;
  direccion?: string;
  tipoSangre?: string;
  email?: string;
  persona?: {
    id: string;
    nombre: string;
    apellido: string;
    numeroDocumento: string;
    fechaNacimiento?: string;
    tipoDocumento?: string | { nombre: string };
    sexo?: string | { nombre: string };
    email?: string;
    telefono?: string;
    direccion?: string;
    telefonos?: Array<{ numero?: string; telefono?: string; principal?: boolean }>;
    direcciones?: Array<{ descripcion?: string; direccion?: string; principal?: boolean }>;
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
  return document.length <= 30 && (type === 'PAS'
    ? /^[a-z0-9]+$/i.test(document)
    : /^\d{6,12}$/.test(document));
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

const backendName = (value?: string | { nombre: string }): string =>
  typeof value === 'string' ? value : value?.nombre ?? '';

const normalizePhone = (value?: string): string =>
  (value ?? '').replace(/^(m[oó]vil|fijo)\s*:\s*/i, '').trim();

const matchSexoId = (
  sexos: Array<{ id: string; nombre?: string; codigo?: string }>,
  gender?: GenderType,
): string | undefined => {
  const match = sexos.find((item) => {
    const nombre = (item.nombre ?? '').toLowerCase();
    const codigo = (item.codigo ?? '').toUpperCase();
    if (gender === 'Femenino') return nombre.includes('femen') || codigo === 'F';
    if (gender === 'Masculino') return nombre.includes('mascul') || codigo === 'M';
    return nombre.includes('otro') || codigo === 'O' || codigo === 'N';
  });
  return match?.id ?? (gender === 'Otro' ? sexos[0]?.id : undefined);
};

// ─── Mapeo Backend → Frontend ─────────────────────────────────────────────
const mapBackendPatient = (raw: BackendPaciente & { name?: string; nombre?: string; apellido?: string; numeroDocumento?: string; gender?: GenderType; age?: number; birthDate?: string }): Patient => {
  const p = raw.persona;
  const nombre = p?.nombre ?? raw.nombre ?? '';
  const apellido = p?.apellido ?? raw.apellido ?? '';
  let fullName = `${nombre} ${apellido}`.trim();

  if (!fullName && raw.name && raw.name !== 'Nuevo Paciente') {
    fullName = raw.name;
  }
  if (!fullName) fullName = 'Paciente sin nombre';

  const docNum = p?.numeroDocumento ?? raw.numeroDocumento ?? '';
  const genderFromBackend = mapGender(backendName(p?.sexo));
  const ageFromBackend = calcAge(p?.fechaNacimiento);

  const gender = genderFromBackend !== 'Otro' ? genderFromBackend : (raw.gender || 'Otro');
  const age = ageFromBackend > 0 ? ageFromBackend : (raw.age || 0);
  const birthDate = p?.fechaNacimiento || raw.birthDate || '';

  const telefonoPrincipal =
    raw.telefono ??
    p?.telefono ??
    p?.telefonos?.find((t) => t.principal)?.numero ??
    p?.telefonos?.find((t) => t.principal)?.telefono ??
    p?.telefonos?.[0]?.numero ??
    p?.telefonos?.[0]?.telefono ??
    '';
  const direccionPrincipal =
    raw.direccion ??
    p?.direccion ??
    p?.direcciones?.find((d) => d.principal)?.descripcion ??
    p?.direcciones?.find((d) => d.principal)?.direccion ??
    p?.direcciones?.[0]?.descripcion ??
    p?.direcciones?.[0]?.direccion ??
    '';
  const alergias = raw.alergias?.map((a) => a.nombre) ?? ['Ninguna'];

  return {
    id: raw.id as unknown as number,
    name: fullName,
    gender,
    age,
    birthDate,
    documentType: mapDocType(backendName(p?.tipoDocumento)),
    documentNumber: docNum,
    contact: {
      phone: telefonoPrincipal,
      email: raw.email ?? p?.email ?? '',
      address: direccionPrincipal,
    },
    lastVisitDate: 'Sin visitas',
    lastVisitSpecialty: 'Sin registrar',
    specialtyBadgeColor: 'green',
    status: raw.activo !== false ? 'active' : 'inactive',
    initials: buildInitials(nombre || fullName, apellido),
    avatarBg: pickColor(raw.id),
    medicalData: {
      bloodType: raw.tipoSangre ?? 'N/A',
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
 * GET /Pacientes/buscar?tipoDocumento=&numeroDocumento=
 * 404 → null; otros errores se re-lanzan.
 */
export const getPatientByDocumentApi = async (
  numeroDocumento: string,
  documentType: Patient['documentType'] = 'CC',
): Promise<Patient | null> => {
  const doc = numeroDocumento.trim();
  if (!doc) {
    throw new Error('El número de documento es requerido');
  }
  if (doc.length > 30) throw new Error('El número de documento no puede superar 30 caracteres.');

  const tipos = await getTiposDocumentoApi();
  const tipo = tipos.find((item) =>
    item.codigo?.toUpperCase() === documentType ||
    item.nombre.toUpperCase() === documentType,
  );
  if (!tipo) throw new Error('No se encontró el tipo de documento seleccionado.');
  return searchPatientApi(tipo.id, doc);
};

export const searchPatientApi = async (
  tipoDocumentoId: string,
  numeroDocumento: string,
): Promise<Patient | null> => {
  if (numeroDocumento.trim().length > 30) {
    throw new Error('El número de documento no puede superar 30 caracteres.');
  }
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
  patient: Partial<Patient> & { personaId?: string; phoneType?: string },
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
  const sexos = await getSexosApi();
  const sexoId = matchSexoId(sexos, patient.gender);
  if (!sexoId) throw new Error('No se encontró el sexo seleccionado.');

  // Calcular fechaNacimiento
  let fechaNacimiento = patient.birthDate || '';
  if (!fechaNacimiento && patient.age && patient.age > 0) {
    const year = new Date().getFullYear() - patient.age;
    fechaNacimiento = `${year}-01-01`;
  }

  const raw = await apiFetch<BackendPaciente>('/Pacientes/completo', {
    method: 'POST',
    body: JSON.stringify({
      persona: {
        nombre: parts[0] ?? 'Nuevo',
        apellido: parts.slice(1).join(' ') || 'Paciente',
        tipoDocumentoId: tipoDoc.id,
        numeroDocumento: documentNumber.trim(),
        ...(fechaNacimiento ? { fechaNacimiento } : {}),
        sexoId,
      },
      telefono: normalizePhone(patient.contact?.phone) || undefined,
      tipoTelefono: patient.phoneType || undefined,
      direccion: patient.contact?.address || undefined,
      email: patient.contact?.email?.trim() || undefined,
      tipoSangre: patient.medicalData?.bloodType || undefined,
      activo: patient.status !== 'inactive',
    }),
  });
  const createdPatient = mapBackendPatient(raw);

  const finalPatient: Patient = {
    ...createdPatient,
    name: (patient.name ?? createdPatient.name).trim() || createdPatient.name,
    documentType,
    documentNumber: documentNumber.trim(),
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

  return finalPatient;
};

export const updatePatientApi = async (
  id: string | number,
  patient: Partial<Patient>,
): Promise<Patient> => {
  const existing = await getPatientByIdApi(String(id));

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

  const tiposDoc = await getTiposDocumentoApi();
  const tipoDoc = tiposDoc.find((tipo) =>
    tipo.codigo?.toUpperCase() === documentType ||
    tipo.nombre.toUpperCase() === documentType,
  );
  const sexos = await getSexosApi();
  const sexoId = matchSexoId(sexos, updatedPatient.gender);
  if (!tipoDoc?.id || !sexoId) {
    throw new Error('No se encontraron los catálogos requeridos para actualizar el paciente.');
  }

  const raw = await apiFetch<BackendPaciente>(`/Pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      persona: {
        nombre: parts[0] ?? '',
        apellido: parts.slice(1).join(' '),
        tipoDocumentoId: tipoDoc.id,
        numeroDocumento: documentNumber.trim(),
        ...(patient.birthDate ? { fechaNacimiento: patient.birthDate } : {}),
        sexoId,
      },
      telefono: normalizePhone(updatedPatient.contact.phone) || undefined,
      direccion: updatedPatient.contact.address || undefined,
      email: updatedPatient.contact.email.trim(),
      tipoSangre: updatedPatient.medicalData.bloodType || undefined,
      activo: updatedPatient.status !== 'inactive',
    }),
  });

  return raw ? {
    ...mapBackendPatient(raw),
    documentType,
    documentNumber: documentNumber.trim(),
    contact: updatedPatient.contact,
    medicalData: updatedPatient.medicalData,
  } : updatedPatient;
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
