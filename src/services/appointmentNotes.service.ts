import type { Appointment } from '../types/appointment.types';

const STORAGE_KEY = 'HEALTLAB_APPOINTMENT_NOTES';

type AppointmentNote = Pick<Appointment, 'id' | 'notes' | 'status'>;

const getStoredNotes = (): Record<string, AppointmentNote> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, AppointmentNote>;
  } catch {
    return {};
  }
};

export const mergeStoredAppointmentNotes = (appointments: Appointment[]): Appointment[] => {
  const notes = getStoredNotes();
  return appointments.map((appointment) => ({ ...appointment, ...notes[String(appointment.id)] }));
};

export const saveAppointmentNote = (appointment: Appointment): void => {
  try {
    const notes = getStoredNotes();
    notes[String(appointment.id)] = {
      id: appointment.id,
      status: appointment.status,
      notes: appointment.notes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn('[appointmentNotes.service] No se pudo guardar la nota local de la cita:', error);
  }
};
