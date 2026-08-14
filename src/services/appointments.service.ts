import type { Appointment, AppointmentStatus, ServiceOption } from '../types/appointment.types';
import { apiFetch } from './api';

/** Duración estándar/máxima de una cita (minutos). */
export const APPOINTMENT_DURATION_MINUTES = 30;

export const getServicesApi = async (): Promise<ServiceOption[]> => {
  try {
    const raw = await apiFetch<Array<{ id: string; codigo?: string; nombre?: string; duracionMinutos?: number; activo?: boolean }>>('/tiposcita');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((t, idx) => ({
        id: t.id,
        name: t.nombre || 'Consulta Médica',
        category: t.codigo || 'Consulta',
        durationMinutes: Math.min(Math.max(t.duracionMinutos || APPOINTMENT_DURATION_MINUTES, 1), APPOINTMENT_DURATION_MINUTES),
        price: 50000 + idx * 10000,
      }));
    }
  } catch (error) {
    console.warn('[appointments.service] Error consultando /tiposcita:', error);
  }
  return [];
};

export const AVAILABLE_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
];

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
      fechaNacimiento?: string;
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
  estadoCita?: {
    codigo?: string;
    descripcion?: string;
    nombre?: string;
  };
  tipoCita?: { nombre: string };
}

// ─── Mapeo de estado ───────────────────────────────────────────────────────
const MAP_ESTADO: Record<string, AppointmentStatus> = {
  AGENDADA: 'Agendada',
  CONFIRMADA: 'Agendada',
  EN_SALA: 'Agendada',
  ATENDIDA: 'Atendida',
  COMPLETADA: 'Atendida',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

const normalizeEstado = (value?: string): string =>
  (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

const mapEstado = (estado?: BackendCita['estadoCita']): AppointmentStatus =>
  MAP_ESTADO[normalizeEstado(estado?.codigo)] ??
  MAP_ESTADO[normalizeEstado(estado?.descripcion)] ??
  MAP_ESTADO[normalizeEstado(estado?.nombre)] ??
  'Agendada';

const backendName = (value?: string | { nombre: string }): string =>
  typeof value === 'string' ? value : value?.nombre ?? '';

const calculateAge = (fechaNacimiento?: string): number => {
  if (!fechaNacimiento) return 0;
  const [year, month, day] = fechaNacimiento.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return 0;

  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }
  return Math.max(age, 0);
};

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

export const addMinutesToApiTime = (time: string, minutes: number): string => {
  const [hours, mins] = toApiTime(time).split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Ventana de cita de a lo sumo APPOINTMENT_DURATION_MINUTES a partir de la hora de inicio. */
export const appointmentEndFromStart = (start: string): string =>
  addMinutesToApiTime(start, APPOINTMENT_DURATION_MINUTES);

const apiTimeToMinutes = (time: string): number => {
  const [h, m] = toApiTime(time).split(':').map(Number);
  return h * 60 + m;
};

/** Normaliza fin: si falta/inválido → +30; si supera 30 min → clamp a +30. */
export const normalizeAppointmentEnd = (horaInicio: string, horaFin?: string): string => {
  const start = toApiTime(horaInicio);
  const end = toApiTime(horaFin || start);
  if (end <= start) return appointmentEndFromStart(start);
  if (apiTimeToMinutes(end) - apiTimeToMinutes(start) > APPOINTMENT_DURATION_MINUTES) {
    return appointmentEndFromStart(start);
  }
  return end;
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
    patientAge: calculateAge(persona?.fechaNacimiento),
    patientGender: backendName(persona?.sexo) || 'Sin registrar',
    patientDoc: persona?.numeroDocumento ?? '',
    patientPhone: telefonoPrincipal,
    patientEmail: '',
    patientInitials: initials,
    professionalId: raw.medicoId,
    professionalName: professionalNombre,
    professionalSpecialty: especialidad,
    serviceId: raw.tipoCitaId,
    serviceName: raw.tipoCita?.nombre ?? 'Consulta',
    date: (raw.fecha || '').slice(0, 10),
    time: formatTimeSlot(raw.horaInicio),
    status: mapEstado(raw.estadoCita),
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

export interface AppointmentAttentionDetail {
  id: string;
  citaId: string;
  medicoId: string;
  notaAtencion?: string;
  resumenConsulta?: string;
  fechaRegistro: string;
}

export const getAppointmentAttentionDetailApi = async (
  appointmentId: string | number,
): Promise<AppointmentAttentionDetail | null> => {
  try {
    const details = await apiFetch<AppointmentAttentionDetail[]>(
      `/DetallesCita/cita/${appointmentId}`,
    );
    return Array.isArray(details) ? details[0] ?? null : null;
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
  const citaPayload = payload as Partial<CreateCitaPayload>;
  const pacienteId = String(citaPayload.pacienteId || appObj.patientId || '').trim();
  const medicoId = String(citaPayload.medicoId || appObj.professionalId || '').trim();
  const tipoCitaId = String(citaPayload.tipoCitaId || appObj.serviceId || '').trim();
  const usuarioCreacionId = String(citaPayload.usuarioCreacionId || '').trim();

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

  // The API accepts HH:mm only—never AM/PM or seconds. Ventana máx. 30 min.
  const normStart = toApiTime(citaPayload.horaInicio || appObj.time || '09:00');
  const normEnd = normalizeAppointmentEnd(
    normStart,
    citaPayload.horaFin || undefined,
  );
  const finalPayload: CreateCitaPayload = {
    pacienteId,
    medicoId,
    tipoCitaId,
    fecha: citaPayload.fecha || appObj.date || localDateISO(),
    horaInicio: normStart,
    horaFin: normEnd,
    motivoConsulta: citaPayload.motivoConsulta || appObj.notes || appObj.serviceName || 'Consulta Médica Especializada',
    observaciones: citaPayload.observaciones || appObj.notes || 'Registrado desde interfaz web.',
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
      horaFin: appointmentEndFromStart(newTime),
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
  options: {
    medicoId?: string;
    notaAtencion?: string;
    resumenConsulta?: string;
  } = {},
): Promise<Appointment | null> => {
  if (status === 'Cancelada') {
    return cancelAppointmentApi(id);
  }
  if (status === 'No asistió') {
    return markNoShowApi(id);
  }
  if (status === 'Atendida') {
    const appointment = await getAppointmentByIdApi(String(id));
    const medicoId = options.medicoId ?? appointment?.professionalId;
    if (!isValidGuid(medicoId)) {
      throw new Error('No se encontró un médico válido para finalizar la cita.');
    }
    await apiFetch('/DetallesCita', {
      method: 'POST',
      body: JSON.stringify({
        citaId: String(id),
        medicoId,
        notaAtencion: options.notaAtencion ?? '',
        resumenConsulta: options.resumenConsulta ?? '',
      }),
    });
    return getAppointmentByIdApi(String(id));
  }
  return getAppointmentByIdApi(String(id));
};
