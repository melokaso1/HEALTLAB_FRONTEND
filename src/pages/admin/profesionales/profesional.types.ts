export type DiaSemana = 'DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB';
export type Jornada = 'Mañana' | 'Tarde';

export interface ScheduleSlot {
  dia: DiaSemana;
  diaNombre: string; // e.g. "Lunes"
  jornada: Jornada;
  horaInicio: string; // e.g. "08:00"
  horaFin: string; // e.g. "13:00"
  activo: boolean;
}

export interface MedicalAppointment {
  id: string;
  pacienteNombre: string;
  pacienteAvatar?: string;
  motivoConsulta: string;
  diaAbrev: DiaSemana; // 'LUN' | 'MAR' | ...
  fecha: string; // '2026-08-12'
  horaInicio: string; // '08:00'
  horaFin: string; // '09:00'
  estado: 'Confirmada' | 'Atendida' | 'Pendiente' | 'Cancelada' | 'No asistió';
  consultorio?: string;
}

export interface Professional {
  id: string;
  nombre: string;
  apellido: string;
  tituloPrefix: string; // "Dra." or "Dr."
  especialidad: string;
  subespecialidad?: string;
  registroProfesional: string; // e.g. "CMP-45892"
  consultorio: string; // e.g. "Consultorio 302"
  estado: 'Activo' | 'Inactivo';
  citasHoy: number;
  disponibleHoy: boolean;
  foto: string;
  numeroDocumento?: string;
  telefono?: string;
  email?: string;
  disponibilidad: ScheduleSlot[];
  citas: MedicalAppointment[];
}
