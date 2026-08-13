export type AppointmentStatus = 'Agendada' | 'Atendida' | 'Cancelada' | 'No asistió';

export interface ServiceOption {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
}

export interface ProfessionalOption {
  id: string;
  name: string;
  specialty: string;
  avatarBg?: string;
  initials?: string;
}

export interface Appointment {
  id: string | number;
  patientId: string | number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientDoc: string;
  patientPhone: string;
  patientEmail: string;
  patientAvatarBg?: string;
  patientInitials?: string;
  
  professionalId: string;
  professionalName: string;
  professionalSpecialty: string;
  
  serviceId: string;
  serviceName: string;
  
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
}

export interface CreateAppointmentDTO {
  patientId: string | number;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}
