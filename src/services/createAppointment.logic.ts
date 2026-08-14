import type { Appointment } from '../types/appointment.types';
import type { Patient } from '../types/patient.types';
import { createAppointmentApi } from './appointments.service';
import { getPatientByDocumentApi } from './patients.service';

/**
 * Busca paciente por cédula. Documento vacío → null.
 * Delega en getPatientByDocumentApi (404 → null; otros errores se propagan).
 */
export async function findPatientByCedula(
  cedula: string,
  documentType: Patient['documentType'] = 'CC',
): Promise<Patient | null> {
  const doc = cedula.trim();
  if (!doc) {
    return null;
  }
  return getPatientByDocumentApi(doc, documentType);
}

export interface CreateAppointmentInput {
  patientId: string | number;
  patientName?: string;
  professionalId: string;
  professionalName?: string;
  professionalSpecialty?: string;
  serviceId: string;
  serviceName?: string;
  date: string;
  time: string;
  notes?: string;
  usuarioCreacionId?: string;
}

export type CreateAppointmentResult =
  | { ok: true; appointment: Appointment; error?: undefined }
  | { ok: false; error: string; appointment?: undefined };

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
const isValidGuid = (value: string | number | undefined): boolean =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) &&
  value !== EMPTY_GUID;

/**
 * Valida input y crea la cita vía createAppointmentApi con pacienteId real.
 */
export async function createAppointmentFromInput(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const patientId = String(input.patientId ?? '').trim();
  if (!isValidGuid(patientId)) {
    return { ok: false, error: 'El paciente es requerido. Busque por cédula antes de agendar.' };
  }
  if (!isValidGuid(input.professionalId)) {
    return { ok: false, error: 'El profesional seleccionado no es válido.' };
  }
  if (!isValidGuid(input.serviceId)) {
    return { ok: false, error: 'Seleccione un tipo de cita válido.' };
  }
  if (!isValidGuid(input.usuarioCreacionId)) {
    return { ok: false, error: 'No se encontró el usuario de la sesión para crear la cita.' };
  }
  if (!String(input.date ?? '').trim()) {
    return { ok: false, error: 'La fecha es requerida.' };
  }
  if (!String(input.time ?? '').trim()) {
    return { ok: false, error: 'La hora es requerida.' };
  }

  try {
    const appointment = await createAppointmentApi({
      pacienteId: patientId,
      medicoId: input.professionalId,
      tipoCitaId: input.serviceId,
      fecha: input.date,
      horaInicio: input.time,
      horaFin: input.time,
      motivoConsulta: input.notes || input.serviceName || 'Consulta Médica',
      observaciones: input.notes,
      usuarioCreacionId: input.usuarioCreacionId!,
    });
    return { ok: true, appointment };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Error al agendar la cita en el servidor.';
    return { ok: false, error: message };
  }
}
