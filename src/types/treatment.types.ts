export interface TratamientoPosologia {
  id: string;
  tratamientoId: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  instruccionesEspeciales?: string;
  activo?: boolean;
  fechaCreacion?: string;
}

export interface CreateTratamientoPosologiaDto {
  tratamientoId: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  instruccionesEspeciales?: string;
}

export interface UpdateTratamientoPosologiaDto {
  medicamento?: string;
  dosis?: string;
  frecuencia?: string;
  duracionDias?: number;
  instruccionesEspeciales?: string;
  activo?: boolean;
}
