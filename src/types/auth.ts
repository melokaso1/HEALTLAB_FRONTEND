export type UserRole = 'admin' | 'professional' | 'receptionist';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  [key: string]: unknown;
}

export interface Patient {
  id: string | number;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  medicalHistoryNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string | number;
  patientId: string | number;
  patient?: Patient;
  professionalId: string | number;
  professionalName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}
