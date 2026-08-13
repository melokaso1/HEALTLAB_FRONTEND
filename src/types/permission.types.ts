export interface BackendPermiso {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  modulo?: string;
  activo?: boolean;
}

export interface BackendRolPermiso {
  id: string;
  rolId: string;
  permisoId: string;
  permiso?: BackendPermiso;
  fechaAsignacion?: string;
}

export interface AsignarRolPermisoDto {
  rolId: string;
  permisoId: string;
}
