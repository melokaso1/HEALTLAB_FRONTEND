import type { Appointment, AppointmentStatus, ServiceOption } from '../types/appointment.types';
import { apiFetch } from './api';

// ─── Mock estático (servicios/horarios) ───
export const mockServices: ServiceOption[] = [];

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

export const createAppointmentApi = async (
  payload: CreateCitaPayload | Appointment | Partial<Appointment>,
): Promise<Appointment> => {
  const appObj = payload as Partial<Appointment>;
  const normPayload: CreateCitaPayload = 'pacienteId' in payload
    ? payload as CreateCitaPayload
    : {
        pacienteId: String(appObj.patientId ?? ''),
        medicoId: String(appObj.professionalId ?? ''),
        tipoCitaId: String(appObj.serviceId ?? ''),
        fecha: appObj.date ?? '',
        horaInicio: parseTimeSlot(appObj.time ?? ''),
        horaFin: parseTimeSlot(appObj.time ?? ''),
        motivoConsulta: appObj.notes ?? appObj.serviceName ?? 'Consulta Médica',
        observaciones: appObj.notes,
        usuarioCreacionId: '',
      };
  const raw = await apiFetch<BackendCita>('/Citas', {
    method: 'POST',
    body: JSON.stringify({
      ...normPayload,
      horaInicio: parseTimeSlot(normPayload.horaInicio),
      horaFin: parseTimeSlot(normPayload.horaFin),
    }),
  });
  return mapBackendCita(raw);
};

/**
 * Reprograma una cita — el backend usa POST /{id}/reprogramar
 */
export const rescheduleAppointmentApi = async (
  id: string | number,
  newDate: string,
  newTime: string,
  observaciones?: string,
): Promise<void> => {
  await apiFetch(`/Citas/${id}/reprogramar`, {
    method: 'POST',
    body: JSON.stringify({
      fecha: newDate,
      horaInicio: parseTimeSlot(newTime),
      horaFin: parseTimeSlot(newTime),
      observaciones,
    }),
  });
};

/**
 * Cancela una cita — POST /{id}/cancelar
 */
export const cancelAppointmentApi = async (
  id: string | number,
  motivoCancelacion: string = 'Cancelada por usuario',
  usuarioCancelacionId?: string,
): Promise<void> => {
  await apiFetch(`/Citas/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivoCancelacion, usuarioCancelacionId }),
  });
};

/**
 * Marca que el paciente no asistió — POST /{id}/no-asistio
 */
export const markNoShowApi = async (
  id: string | number,
  observaciones?: string,
): Promise<void> => {
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
 * Internamente enruta a cancelar o no-asistio según el estado pedido.
 */
export const updateAppointmentStatusApi = async (
  id: string | number,
  status: AppointmentStatus,
): Promise<AppointmentStatus> => {
  try {
    if (status === 'Cancelada') {
      await cancelAppointmentApi(id);
    } else if (status === 'No asistió') {
      await markNoShowApi(id);
    }
    // 'Atendida' y 'Agendada' no tienen endpoint directo hoy; se ignoran
  } catch (error) {
    console.warn(`[appointments.service] Error al cambiar estado de cita ${id}:`, error);
  }
  return status;
};
