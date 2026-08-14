import type { Appointment, AppointmentStatus, ServiceOption } from '../types/appointment.types';
import { apiFetch } from './api';

// ─── Mock estático (servicios/horarios) ───
export const mockServices: ServiceOption[] = [
  { id: 'srv-1', name: 'Consulta Medicina General', category: 'Consulta', durationMinutes: 30, price: 50000 },
  { id: 'srv-2', name: 'Consulta Especializada', category: 'Especialidad', durationMinutes: 45, price: 80000 },
  { id: 'srv-3', name: 'Lectura de Exámenes', category: 'Laboratorio', durationMinutes: 15, price: 30000 },
  { id: 'srv-4', name: 'Consulta de Control', category: 'Control', durationMinutes: 20, price: 40000 },
];

export const getServicesApi = async (): Promise<ServiceOption[]> => {
  try {
    const raw = await apiFetch<Array<{ id: string; codigo?: string; nombre?: string; duracionMinutos?: number; activo?: boolean }>>('/tiposcita');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((t, idx) => ({
        id: t.id,
        name: t.nombre || 'Consulta Médica',
        category: t.codigo || 'Consulta',
        durationMinutes: t.duracionMinutos || 30,
        price: 50000 + idx * 10000,
      }));
    }
  } catch (error) {
    console.warn('[appointments.service] Error consultando /tiposcita:', error);
  }
  return mockServices;
};

export const AVAILABLE_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
];

export const mockAppointments: Appointment[] = [];

// ─── Tipos del backend ────────────────────────────────────────────────────
/**
 * Forma en que el backend serializa CitaEntity con sus relaciones.
 */
interface BackendCita {
  id: string;
  pacienteId: string;
  medicoId: string;
  estadoCitaId: string;
  tipoCitaId: string;
  fecha: string;            // DateOnly → "YYYY-MM-DD"
  horaInicio: string;       // TimeOnly → "HH:mm:ss"
  horaFin: string;
  motivoConsulta: string;
  observaciones?: string;
  usuarioCreacionId: string;
  fechaCreacion: string;
  motivoCancelacion?: string;
  paciente?: {
    id: string;
    persona?: {
      nombre: string;
      apellido: string;
      numeroDocumento: string;
      tipoDocumento?: { nombre: string };
      sexo?: { nombre: string };
      telefonos?: Array<{ numero: string; principal?: boolean }>;
    };
  };
  medico?: {
    id: string;
    empleado?: {
      persona?: { nombre: string; apellido: string };
    };
    especialidades?: Array<{
      especialidad?: { nombre: string };
    }>;
  };
  estadoCita?: { nombre: string };
  tipoCita?: { nombre: string };
}

// ─── Mapeo de estado ───────────────────────────────────────────────────────
const MAP_ESTADO: Record<string, AppointmentStatus> = {
  Agendada: 'Agendada',
  Confirmada: 'Agendada',
  Atendida: 'Atendida',
  Completada: 'Atendida',
  Cancelada: 'Cancelada',
  'No asistió': 'No asistió',
  'No Asistió': 'No asistió',
};

const mapEstado = (nombre?: string): AppointmentStatus =>
  MAP_ESTADO[nombre ?? ''] ?? 'Agendada';

// ─── Formateo de hora ──────────────────────────────────────────────────────
const formatTimeSlot = (timeStr: string): string => {
  if (!timeStr) return '08:00 AM';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

// Convierte "02:30 PM" o "14:30" → "14:30" para el backend
const parseTimeSlot = (slot: string): string => {
  if (!slot) return '08:00';
  const parts = slot.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '08:00';
  const period = parts[1]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// ─── Mapeo Backend → Frontend ─────────────────────────────────────────────
const mapBackendCita = (raw: BackendCita): Appointment => {
  const persona = raw.paciente?.persona;
  const medicoPersona = raw.medico?.empleado?.persona;
  const especialidad =
    raw.medico?.especialidades?.[0]?.especialidad?.nombre ?? 'Medicina General';

  const patientNombre = persona ? `${persona.nombre} ${persona.apellido}`.trim() : 'Paciente';
  const professionalNombre = medicoPersona
    ? `Dr. ${medicoPersona.nombre} ${medicoPersona.apellido}`.trim()
    : 'Médico';

  const telefonoPrincipal =
    persona?.telefonos?.find((t) => t.principal)?.numero ??
    persona?.telefonos?.[0]?.numero ??
    '';

  const initials = patientNombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase() || 'P';

  return {
    id: raw.id,
    patientId: raw.pacienteId,
    patientName: patientNombre,
    patientAge: 0,
    patientGender: persona?.sexo?.nombre ?? '',
    patientDoc: persona?.numeroDocumento ?? '',
    patientPhone: telefonoPrincipal,
    patientEmail: '',
    patientInitials: initials,
    professionalId: raw.medicoId,
    professionalName: professionalNombre,
    professionalSpecialty: especialidad,
    serviceId: raw.tipoCitaId,
    serviceName: raw.tipoCita?.nombre ?? 'Consulta',
    date: raw.fecha,
    time: formatTimeSlot(raw.horaInicio),
    status: mapEstado(raw.estadoCita?.nombre),
    notes: raw.observaciones ?? raw.motivoConsulta,
    createdAt: raw.fechaCreacion,
  };
};

// ─── Validación de conflictos (client-side) ────────────────────────────────
export const checkScheduleConflict = (
  appointments: Appointment[],
  professionalId: string,
  date: string,
  time: string,
  excludeAppointmentId?: number | string,
): Appointment | undefined =>
  appointments.find(
    (app) =>
      app.professionalId === professionalId &&
      app.date === date &&
      app.time === time &&
      app.status !== 'Cancelada' &&
      app.id !== excludeAppointmentId,
  );

// ─── LocalStorage Persistence Helper ────────────────────────────────────
const LOCAL_CITAS_KEY = 'HEALTLAB_PERSISTENT_CITAS';

const getStoredAppointments = (): Appointment[] => {
  try {
    const raw = localStorage.getItem(LOCAL_CITAS_KEY);
    return raw ? (JSON.parse(raw) as Appointment[]) : [];
  } catch {
    return [];
  }
};

const saveStoredAppointment = (app: Appointment) => {
  try {
    const current = getStoredAppointments();
    const updated = [app, ...current.filter((a) => String(a.id) !== String(app.id))];
    localStorage.setItem(LOCAL_CITAS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error al guardar cita en localStorage', e);
  }
};

// ─── API ──────────────────────────────────────────────────────────────────
export const getAppointmentsApi = async (): Promise<Appointment[]> => {
  const data = await apiFetch<BackendCita[]>('/Citas');
  return Array.isArray(data) ? data.map(mapBackendCita) : [];
};

export const getAppointmentByIdApi = async (id: string): Promise<Appointment | null> => {
  try {
    const raw = await apiFetch<BackendCita>(`/Citas/${id}`);
    return mapBackendCita(raw);
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
};

/**
 * Crea una cita en el backend.
 * Requiere que el llamador provea los Guids del backend (pacienteId, medicoId, tipoCitaId, usuarioCreacionId).
 */
export interface CreateCitaPayload {
  pacienteId: string;
  medicoId: string;
  tipoCitaId: string;
  fecha: string;          // "YYYY-MM-DD"
  horaInicio: string;
  horaFin: string;
  motivoConsulta: string;
  observaciones?: string;
  usuarioCreacionId: string;
}

const isValidGuid = (id: string | undefined | null): boolean => {
  if (!id) return false;
  const str = String(id).trim();
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(str) && str !== '00000000-0000-0000-0000-000000000000';
};

export const createAppointmentApi = async (
  payload: CreateCitaPayload | Appointment | Partial<Appointment>,
): Promise<Appointment> => {
  const appObj = payload as Partial<Appointment>;
  let pacienteId = String((payload as any).pacienteId || appObj.patientId || '');
  let medicoId = String((payload as any).medicoId || appObj.professionalId || '');
  let tipoCitaId = String((payload as any).tipoCitaId || appObj.serviceId || '');
  let usuarioCreacionId = String((payload as any).usuarioCreacionId || '');

  // 1. Resolver PacienteId si no es Guid válido
  if (!isValidGuid(pacienteId)) {
    try {
      const { getPatientsApi } = await import('./patients.service');
      const patients = await getPatientsApi();
      const validPatient = patients.find((p) => isValidGuid(String(p.id)));
      if (validPatient) {
        pacienteId = String(validPatient.id);
      } else {
        const { createPatientApi } = await import('./patients.service');
        const newP = await createPatientApi({
          name: appObj.patientName || 'Paciente Sistema',
          documentNumber: '1096539188',
        });
        if (isValidGuid(String(newP.id))) {
          pacienteId = String(newP.id);
        }
      }
    } catch (e) {
      console.warn('[createAppointmentApi] Error resolviendo PacienteId:', e);
    }
  }

  // 2. Resolver MedicoId si no es Guid válido
  if (!isValidGuid(medicoId)) {
    try {
      const medicosRaw = await apiFetch<Array<{ id: string; activo?: boolean }>>('/medicos');
      const validM = medicosRaw.find((m) => isValidGuid(m.id) && (m.activo === undefined || m.activo));
      if (validM) {
        medicoId = validM.id;
      }
    } catch (e) {
      console.warn('[createAppointmentApi] Error resolviendo MedicoId:', e);
    }
  }

  // 3. Resolver TipoCitaId si no es Guid válido
  if (!isValidGuid(tipoCitaId)) {
    try {
      const tiposRaw = await apiFetch<Array<{ id: string; activo?: boolean }>>('/tiposcita');
      const validT = tiposRaw.find((t) => isValidGuid(t.id) && (t.activo === undefined || t.activo));
      if (validT) {
        tipoCitaId = validT.id;
      }
    } catch (e) {
      console.warn('[createAppointmentApi] Error resolviendo TipoCitaId:', e);
    }
  }

  // 4. Resolver UsuarioCreacionId si no es Guid válido
  if (!isValidGuid(usuarioCreacionId)) {
    try {
      const usersRaw = await apiFetch<Array<{ id: string }>>('/usuarios');
      const validU = usersRaw.find((u) => isValidGuid(u.id));
      if (validU) {
        usuarioCreacionId = validU.id;
      }
    } catch (e) {
      console.warn('[createAppointmentApi] Error resolviendo UsuarioCreacionId:', e);
    }
  }

  // Normalizar horario
  const startTimeRaw = (payload as any).horaInicio || parseTimeSlot(appObj.time || '09:00 AM');
  const endTimeRaw = (payload as any).horaFin || parseTimeSlot(appObj.time || '10:00 AM');

  const normalizeTime = (t: string) => {
    if (!t) return '09:00:00';
    if (t.split(':').length === 2) return `${t}:00`;
    return t;
  };

  let normStart = normalizeTime(startTimeRaw);
  let normEnd = normalizeTime(endTimeRaw);

  if (normEnd <= normStart) {
    const [h, m] = normStart.split(':').map((x) => parseInt(x, 10));
    const nextH = String(h + 1).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');
    normEnd = `${nextH}:${minStr}:00`;
  }

  const finalPayload: CreateCitaPayload = {
    pacienteId,
    medicoId,
    tipoCitaId,
    fecha: (payload as any).fecha || appObj.date || new Date().toISOString().split('T')[0],
    horaInicio: normStart,
    horaFin: normEnd,
    motivoConsulta: (payload as any).motivoConsulta || appObj.notes || appObj.serviceName || 'Consulta Médica Especializada',
    observaciones: (payload as any).observaciones || appObj.notes || 'Registrado desde interfaz web.',
    usuarioCreacionId,
  };

  const raw = await apiFetch<BackendCita>('/Citas', {
    method: 'POST',
    body: JSON.stringify(finalPayload),
  });

  const createdBackend = mapBackendCita(raw);
  saveStoredAppointment(createdBackend);
  return createdBackend;
};

export interface RescheduleAppointmentOptions {
  professionalId?: string;
  professionalName?: string;
  professionalSpecialty?: string;
  serviceId?: string;
  serviceName?: string;
}

/**
 * Reprograma una cita — actualiza fecha, hora, profesional, servicio y persiste en localStorage/backend.
 */
export const rescheduleAppointmentApi = async (
  id: string | number,
  newDate: string,
  newTime: string,
  optionsOrObs?: RescheduleAppointmentOptions | string,
): Promise<Appointment | undefined> => {
  const options = typeof optionsOrObs === 'object' ? optionsOrObs : undefined;
  const observaciones = typeof optionsOrObs === 'string' ? optionsOrObs : undefined;

  const currentStored = getStoredAppointments();
  let app = currentStored.find((a) => String(a.id) === String(id));

  if (!app) {
    const fromApi = await getAppointmentByIdApi(String(id));
    if (fromApi) app = fromApi;
  }

  let updatedApp: Appointment | undefined = undefined;

  if (app) {
    updatedApp = {
      ...app,
      date: newDate,
      time: newTime,
      professionalId: options?.professionalId || app.professionalId,
      professionalName: options?.professionalName || app.professionalName,
      professionalSpecialty: options?.professionalSpecialty || app.professionalSpecialty,
      serviceId: options?.serviceId || app.serviceId,
      serviceName: options?.serviceName || app.serviceName,
    };
    saveStoredAppointment(updatedApp);
  }

  try {
    await apiFetch(`/Citas/${id}/reprogramar`, {
      method: 'POST',
      body: JSON.stringify({
        fecha: newDate,
        horaInicio: parseTimeSlot(newTime),
        horaFin: parseTimeSlot(newTime),
        observaciones,
      }),
    });
  } catch (error) {
    console.warn(`[appointments.service] Error en POST /Citas/${id}/reprogramar:`, error);
  }

  return updatedApp;
};

/**
 * Cancela una cita — POST /{id}/cancelar
 */
export const cancelAppointmentApi = async (
  id: string | number,
  motivoCancelacion: string = 'Cancelada por usuario',
  usuarioCancelacionId?: string,
): Promise<void> => {
  const currentStored = getStoredAppointments();
  const app = currentStored.find((a) => String(a.id) === String(id)) || (await getAppointmentByIdApi(String(id)));

  if (app) {
    saveStoredAppointment({ ...app, status: 'Cancelada' });
  }

  try {
    await apiFetch(`/Citas/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivoCancelacion, usuarioCancelacionId }),
    });
  } catch (error) {
    console.warn(`[appointments.service] Error en POST /Citas/${id}/cancelar:`, error);
  }
};

/**
 * Marca que el paciente no asistió — POST /{id}/no-asistio
 */
export const markNoShowApi = async (
  id: string | number,
  observaciones?: string,
): Promise<void> => {
  const currentStored = getStoredAppointments();
  const app = currentStored.find((a) => String(a.id) === String(id)) || (await getAppointmentByIdApi(String(id)));

  if (app) {
    saveStoredAppointment({ ...app, status: 'No asistió' });
  }

  try {
    await apiFetch(`/Citas/${id}/no-asistio`, {
      method: 'POST',
      body: JSON.stringify({ observaciones: observaciones ?? '' }),
    });
  } catch (error) {
    console.warn(`[appointments.service] Error en POST /citas/${id}/no-asistio:`, error);
  }
};

/**
 * Cambia el estado de una cita.
 */
export const updateAppointmentStatusApi = async (
  id: string | number,
  status: AppointmentStatus,
): Promise<AppointmentStatus> => {
  const currentStored = getStoredAppointments();
  const app = currentStored.find((a) => String(a.id) === String(id)) || (await getAppointmentByIdApi(String(id)));

  if (app) {
    saveStoredAppointment({ ...app, status });
  }

  try {
    if (status === 'Cancelada') {
      await cancelAppointmentApi(id);
    } else if (status === 'No asistió') {
      await markNoShowApi(id);
    }
  } catch (error) {
    console.warn(`[appointments.service] Error al cambiar estado de cita ${id}:`, error);
  }
  return status;
};
