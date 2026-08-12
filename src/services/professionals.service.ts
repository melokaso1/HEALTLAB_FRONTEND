import type { ProfessionalOption } from '../types/appointment.types';

export const mockProfessionals: ProfessionalOption[] = [
  {
    id: 'prof-1',
    name: 'Dr. Ramírez',
    specialty: 'Dermatología',
    avatarBg: '#0A9396',
    initials: 'DR',
  },
  {
    id: 'prof-2',
    name: 'Dra. María Gonzales',
    specialty: 'Medicina General',
    avatarBg: '#005F73',
    initials: 'MG',
  },
  {
    id: 'prof-3',
    name: 'Dra. Smith',
    specialty: 'Medicina General',
    avatarBg: '#9B5DE5',
    initials: 'DS',
  },
  {
    id: 'prof-4',
    name: 'Dr. Evans',
    specialty: 'Neurología',
    avatarBg: '#EE6C4D',
    initials: 'DE',
  },
  {
    id: 'prof-5',
    name: 'Dr. Martínez',
    specialty: 'Pediatría',
    avatarBg: '#2A9D8F',
    initials: 'DM',
  },
];

export const getProfessionalById = (id: string): ProfessionalOption | undefined => {
  return mockProfessionals.find((p) => p.id === id);
};
