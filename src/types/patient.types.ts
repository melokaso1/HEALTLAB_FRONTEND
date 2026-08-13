export type GenderType = 'Femenino' | 'Masculino' | 'Otro';

export interface MedicalData {
  bloodType: string;
  allergies: string[];
  chronicConditions?: string[];
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

export interface RecentActivityItem {
  id: number;
  title: string;
  date: string;
  doctor?: string;
  note?: string;
  category: 'consulta' | 'laboratorio' | 'receta' | 'cirugia';
}

export interface PatientHistoryItem {
  id: number;
  date: string;
  specialty: string;
  doctor: string;
  diagnosis: string;
}

export interface PatientNote {
  id: number;
  date: string;
  author: string;
  text: string;
}

export interface Patient {
  id: string | number;
  name: string;
  gender: GenderType;
  age: number;
  documentType: 'CC' | 'CE' | 'TI' | 'PAS';
  documentNumber: string;
  contact: ContactInfo;
  lastVisitDate: string;
  lastVisitSpecialty: string;
  specialtyBadgeColor?: 'purple' | 'green' | 'blue';
  status: 'active' | 'inactive';
  initials: string;
  avatarBg?: string;
  medicalData: MedicalData;
  recentActivity: RecentActivityItem[];
  history: PatientHistoryItem[];
  notes: PatientNote[];
}
