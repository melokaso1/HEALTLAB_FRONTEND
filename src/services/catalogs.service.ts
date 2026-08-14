import { apiFetch } from './api';

export interface CatalogOption {
  id: string;
  nombre: string;
  codigo?: string;
}

export const getTiposCitaApi = () =>
  apiFetch<CatalogOption[]>('/TiposCita');

export const getEstadosCitaApi = () =>
  apiFetch<CatalogOption[]>('/EstadosCita');

export const getTiposDocumentoApi = () =>
  apiFetch<CatalogOption[]>('/TiposDocumento');

export const getHorariosByMedicoApi = async (medicoId: string): Promise<CatalogOption[]> => {
  try {
    return await apiFetch<CatalogOption[]>(`/Horarios/medico/${medicoId}`);
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    return apiFetch<CatalogOption[]>('/Horarios');
  }
};
