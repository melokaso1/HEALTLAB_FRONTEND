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
  horaInicio: string;       // TimeOnly → "HH:mm"
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
      tipoDocumento?: string | { nombre: string };
      sexo?: string | { nombre: string };
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

const backendName = (value?: string | { nombre: string }): string =>
  typeof value === 'string' ? value : value?.nombre ?? '';

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

/** Converts display/API input to the API's strictly required HH:mm format. */
export const toApiTime = (slot: string): string => {
  if (!slot) return '08:00';
  const parts = slot.trim().split(/\s+/);
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '08:00';
  const period = parts[1]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  if (h < 0 || h > 23 || m < 0 || m > 59) return '08:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const addMinutesToApiTime = (time: string, minutes: number): string => {
  const [hours, mins] = toApiTime(time).split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const localDateISO = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
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
    patientGender: backendName(persona?.sexo),
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
  const pacienteId = String((payload as any).pacienteId || appObj.patientId || '').trim();
  const medicoId = String((payload as any).medicoId || appObj.professionalId || '').trim();
  const tipoCitaId = String((payload as any).tipoCitaId || appObj.serviceId || '').trim();
  const usuarioCreacionId = String((payload as any).usuarioCreacionId || '').trim();

  const requiredIds: Array<[string, string]> = [
    ['paciente', pacienteId],
    ['médico', medicoId],
    ['tipo de cita', tipoCitaId],
    ['usuario de creación', usuarioCreacionId],
  ];
  const missing = requiredIds.find(([, id]) => !isValidGuid(id));
  if (missing) {
    throw new Error(`Se requiere un GUID válido para ${missing[0]}.`);
  }

  // The API accepts HH:mm only—never AM/PM or seconds.
  const normStart = toApiTime((payload as any).horaInicio || appObj.time || '09:00');
  let normEnd = toApiTime((payload as any).horaFin || appObj.time || normStart);
  if (normEnd <= normStart) normEnd = addMinutesToApiTime(normStart, 30);

  const finalPayload: CreateCitaPayload = {
    pacienteId,
    medicoId,
    tipoCitaId,
    fecha: (payload as any).fecha || appObj.date || localDateISO(),
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

  return mapBackendCita(raw);
};

export interface RescheduleAppointmentOptions {
  professionalId?: string;
  professionalName?: string;
  professionalSpecialty?: string;
  serviceId?: string;
  serviceName?: string;
}

/**
 * Reprograma una cita. El DTO de la API solo admite fecha, horas y observaciones.
 */
export const rescheduleAppointmentApi = async (
  id: string | number,
  newDate: string,
  newTime: string,
  optionsOrObs?: RescheduleAppointmentOptions | string,
): Promise<Appointment | null> => {
  // Professional and service options are UI-only because the backend DTO does not accept them.
  void (typeof optionsOrObs === 'object' ? optionsOrObs : undefined);
  const observaciones = typeof optionsOrObs === 'string' ? optionsOrObs : undefined;
  await apiFetch(`/Citas/${id}/reprogramar`, {
    method: 'POST',
    body: JSON.stringify({
      fecha: newDate,
      horaInicio: toApiTime(newTime),
      horaFin: addMinutesToApiTime(toApiTime(newTime), 30),
      observaciones,
    }),
  });
  return getAppointmentByIdApi(String(id));
};

/**
 * Cancela una cita — POST /{id}/cancelar
 */
export const cancelAppointmentApi = async (
  id: string | number,
  motivoCancelacion: string = 'Cancelada por usuario',
  usuarioCancelacionId?: string,
): Promise<Appointment | null> => {
  await apiFetch(`/Citas/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ citaId: String(id), motivoCancelacion, usuarioCancelacionId }),
  });
  return getAppointmentByIdApi(String(id));
};

/**
 * Marca que el paciente no asistió — POST /{id}/no-asistio
 */
export const markNoShowApi = async (
  id: string | number,
  observacion?: string,
  usuarioId?: string,
): Promise<Appointment | null> => {
  await apiFetch(`/Citas/${id}/no-asistio`, {
    method: 'POST',
    body: JSON.stringify({ observacion: observacion ?? '', usuarioId }),
  });
  return getAppointmentByIdApi(String(id));
};

/**
 * Cambia el estado de una cita.
 */
export const updateAppointmentStatusApi = async (
  id: string | number,
  status: AppointmentStatus,
): Promise<AppointmentStatus> => {
  if (status === 'Cancelada') {
    await cancelAppointmentApi(id);
    return status;
  }
  if (status === 'No asistió') {
    await markNoShowApi(id);
    return status;
  }
  throw new Error(`La API no admite cambiar una cita directamente a "${status}".`);
};
