import type { ManagedUser, PermissionGroup, UserRoleType } from '../types/user.types';
import medicoImg from '../assets/images/medico1.jpeg';

export const mockUsers: ManagedUser[] = [
  {
    id: 1,
    name: 'Dra. María Gonzales',
    email: 'm.gonzales_mG@salud.es',
    role: 'admin',
    status: 'active',
    avatarUrl: medicoImg,
    lastAccess: 'Ayer, 11:20 AM',
  },
  {
    id: 2,
    name: 'Ana Pérez',
    email: 'a.perez@medflow.com',
    role: 'receptionist',
    status: 'active',
    initials: 'AP',
    avatarBg: '#8B5CF6',
    lastAccess: 'Hoy, 08:15 AM',
  },
  {
    id: 3,
    name: 'Carlos Silva',
    email: 'c.silva@medflow.com',
    role: 'receptionist',
    status: 'active',
    initials: 'CS',
    avatarBg: '#EF4444',
    lastAccess: 'Ayer, 5:30 PM, actualizando perfil',
  },
  {
    id: 4,
    name: 'Laura Ruiz',
    email: 'lruiz@medflow.com',
    role: 'admin',
    status: 'active',
    initials: 'LR',
    avatarBg: '#3B82F6',
    lastAccess: 'Hace 2 días',
  },
  {
    id: 5,
    name: 'Dr. Julian Moore',
    email: 'j.moore@medflow.com',
    role: 'professional',
    status: 'active',
    initials: 'JM',
    avatarBg: '#10B981',
    lastAccess: 'Hoy, 10:11 AM',
  },
  {
    id: 6,
    name: 'Dra. Elena Vasquez',
    email: 'e.vasquez@medflow.com',
    role: 'professional',
    status: 'active',
    initials: 'EV',
    avatarBg: '#F59E0B',
    lastAccess: 'Hace 1 semana',
  },
];

export const getRolePermissions = (role: UserRoleType): PermissionGroup[] => {
  if (role === 'admin') {
    return [
      {
        id: 'agenda',
        title: 'Agenda y Citas',
        icon: 'calendar',
        items: [
          { id: 'ver_propia', label: 'Ver propia agenda', status: 'allowed' },
          { id: 'crear_editar', label: 'Crear/Editar citas propias', status: 'allowed' },
          { id: 'ver_global', label: 'Ver agendas de citas globales', status: 'allowed' },
        ],
      },
      {
        id: 'fichas',
        title: 'Fichas Clínicas',
        icon: 'file',
        items: [
          { id: 'acceso_hc', label: 'Acceso completo a H.C.', status: 'allowed' },
          { id: 'firmar_atencion', label: 'Firmar atenciones', status: 'allowed' },
          { id: 'subir_doc', label: 'Subir documentos adjuntos', status: 'allowed' },
        ],
      },
      {
        id: 'config',
        title: 'Configuración Sistema',
        icon: 'gear',
        items: [
          { id: 'gestionar_usuarios', label: 'Gestionar usuarios', status: 'allowed' },
          { id: 'config_clinica', label: 'Configuración de clínica', status: 'allowed' },
        ],
      },
    ];
  }

  if (role === 'receptionist') {
    return [
      {
        id: 'agenda',
        title: 'Agenda y Citas',
        icon: 'calendar',
        items: [
          { id: 'ver_propia', label: 'Ver propia agenda', status: 'allowed' },
          { id: 'crear_editar', label: 'Crear/Editar citas propias', status: 'allowed' },
          { id: 'ver_global', label: 'Ver agendas de citas globales', status: 'denied' },
        ],
      },
      {
        id: 'fichas',
        title: 'Fichas Clínicas',
        icon: 'file',
        items: [
          { id: 'acceso_hc', label: 'Acceso completo a H.C.', status: 'allowed' },
          { id: 'firmar_atencion', label: 'Firmar atenciones', status: 'allowed' },
          { id: 'subir_doc', label: 'Subir documentos adjuntos', status: 'allowed' },
        ],
      },
      {
        id: 'config',
        title: 'Configuración Sistema',
        icon: 'gear',
        items: [
          { id: 'gestionar_usuarios', label: 'Gestionar usuarios', status: 'allowed' },
          { id: 'config_clinica', label: 'Configuración de clínica', status: 'allowed' },
        ],
      },
    ];
  }

  // Default: professional
  return [
    {
      id: 'agenda',
      title: 'Agenda y Citas',
      icon: 'calendar',
      items: [
        { id: 'ver_propia', label: 'Ver propia agenda', status: 'allowed' },
        { id: 'crear_editar', label: 'Crear/Editar citas propias', status: 'allowed' },
        { id: 'ver_global', label: 'Ver agendas de citas globales', status: 'denied' },
      ],
    },
    {
      id: 'fichas',
      title: 'Fichas Clínicas',
      icon: 'file',
      items: [
        { id: 'acceso_hc', label: 'Acceso completo a H.C.', status: 'allowed' },
        { id: 'firmar_atencion', label: 'Firmar atenciones', status: 'allowed' },
        { id: 'subir_doc', label: 'Subir documentos adjuntos', status: 'allowed' },
      ],
    },
    {
      id: 'config',
      title: 'Configuración Sistema',
      icon: 'gear',
      items: [
        { id: 'gestionar_usuarios', label: 'Gestionar usuarios', status: 'allowed' },
        { id: 'config_clinica', label: 'Configuración de clínica', status: 'allowed' },
      ],
    },
  ];
};

export const getRoleLabel = (role: UserRoleType): string => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'professional':
      return 'Professional';
    case 'receptionist':
      return 'Recepcionista';
    default:
      return role;
  }
};
