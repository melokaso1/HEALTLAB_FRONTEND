import type { Appointment } from '../types/appointment.types';
import type { Patient } from '../types/patient.types';
import { createAppointmentApi } from './appointments.service';
import { getPatientByDocumentApi } from './patients.service';

/**
 * Busca paciente por cédula. Documento vacío → null.
 * Delega en getPatientByDocumentApi (404 → null; otros errores se propagan).
 */
export async function findPatientByCedula(cedula: string): Promise<Patient | null> {
  const doc = cedula.trim();
  if (!doc) {
    return null;
  }
  return getPatientByDocumentApi(doc);
}

export interface CreateAppointmentInput {
  patientId: string | number;
  patientName?: string;
  professionalId: string;
  professionalName?: string;
  professionalSpecialty?: string;
  serviceId?: string;
  serviceName?: string;
  date: string;
  time: string;
  notes?: string;
}

export type CreateAppointmentResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; error: string };

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

/**
 * Valida input y crea la cita vía createAppointmentApi con pacienteId real.
 */
export async function createAppointmentFromInput(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  const patientId = String(input.patientId ?? '').trim();
  if (!patientId || patientId === EMPTY_GUID) {
    return { ok: false, error: 'El paciente es requerido. Busque por cédula antes de agendar.' };
  }
  if (!String(input.professionalId ?? '').trim()) {
    return { ok: false, error: 'El profesional es requerido.' };
  }
  if (!String(input.date ?? '').trim()) {
    return { ok: false, error: 'La fecha es requerida.' };
  }
  if (!String(input.time ?? '').trim()) {
    return { ok: false, error: 'La hora es requerida.' };
  }

  try {
    const payload: Partial<Appointment> = {
      patientId,
      patientName: input.patientName,
      professionalId: input.professionalId,
      professionalName: input.professionalName,
      professionalSpecialty: input.professionalSpecialty,
      serviceId: input.serviceId,
      serviceName: input.serviceName,
      date: input.date,
      time: input.time,
      notes: input.notes,
      status: 'Agendada',
    };

    const appointment = await createAppointmentApi(payload as Appointment);
    return { ok: true, appointment };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Error al agendar la cita en el servidor.';
    return { ok: false, error: message };
  }
}
