// ─── Roles del frontend ────────────────────────────────────────────────────
export type UserRole = 'admin' | 'professional' | 'receptionist';

// Mapa de roles del backend (en español) → roles del frontend
export const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  Administrador: 'admin',
  Profesional: 'professional',
  Recepcionista: 'receptionist',
};

// Mapa inverso: rol del frontend → nombre de rol en el backend
export const FRONTEND_ROLE_MAP: Record<UserRole, string> = {
  admin: 'Administrador',
  professional: 'Profesional',
  receptionist: 'Recepcionista',
};

// ─── Usuario del frontend ──────────────────────────────────────────────────
export interface User {
  id: string;          // usuarioId (Guid) del backend
  name: string;        // username del backend
  email: string;
  role: UserRole;
  sesionId?: string;   // guardado para logout dirigido
  debeCambiarPassword?: boolean;
  [key: string]: unknown;
}

// ─── Credenciales de login ─────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;       // puede ser email o username
  password: string;
}

// ─── Respuesta exacta del backend (.NET LoginResponseDto) ──────────────────
export interface BackendLoginResponse {
  usuarioId: string;
  sesionId: string;
  username: string;
  email: string;
  rolNombre: string;
  debeCambiarPassword: boolean;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  accessToken: string;
  refreshToken: string;
}

// ─── Respuesta normalizada que usa el frontend ────────────────────────────
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// ─── Modelos legacy / extras ──────────────────────────────────────────────
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
