import { apiFetch } from './api';

export interface CatalogOption {
  id: string;
  nombre: string;
  codigo?: string;
}

export interface HorarioApi {
  id: string;
  medicoId: string;
  horaEntrada: string;
  horaSalida: string;
  salidaAlmuerzo: string;
  retornoActividades: string;
}

export interface HorarioPayload {
  horaEntrada: string;
  horaSalida: string;
  salidaAlmuerzo: string;
  retornoActividades: string;
}

export const getTiposCitaApi = () =>
  apiFetch<CatalogOption[]>('/TiposCita');

export const getEstadosCitaApi = () =>
  apiFetch<CatalogOption[]>('/EstadosCita');

export const getTiposDocumentoApi = () =>
  apiFetch<CatalogOption[]>('/TiposDocumento');

export const getSexosApi = () =>
  apiFetch<CatalogOption[]>('/Sexos');

export const getEspecialidadesApi = () =>
  apiFetch<CatalogOption[]>('/Especialidades');

/**
 * Resolves an especialidad id by nombre (case-insensitive).
 * Creates the catalog entry when missing; defaults to "Medicina General" if the list is empty.
 */
export const resolveOrCreateEspecialidad = async (
  nombre?: string | null,
): Promise<{ id: string; nombre: string }> => {
  const list = await getEspecialidadesApi();
  const items = Array.isArray(list) ? list : [];
  const requested = nombre?.trim() ?? '';

  if (requested) {
    const match = items.find(
      (item) => item.nombre?.trim().toLowerCase() === requested.toLowerCase(),
    );
    if (match?.id) {
      return { id: match.id, nombre: match.nombre || requested };
    }

    const created = await apiFetch<{ id: string; nombre?: string }>('/Especialidades', {
      method: 'POST',
      body: JSON.stringify({ nombre: requested }),
    });
    return { id: created.id, nombre: created.nombre ?? requested };
  }

  if (items.length === 0) {
    const created = await apiFetch<{ id: string; nombre?: string }>('/Especialidades', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Medicina General' }),
    });
    return { id: created.id, nombre: created.nombre ?? 'Medicina General' };
  }

  const first = items[0];
  return { id: first.id, nombre: first.nombre || 'Medicina General' };
};

export const getHorariosByMedicoApi = (medicoId: string): Promise<HorarioApi[]> =>
  apiFetch<HorarioApi[]>(`/Horarios/medico/${medicoId}`, { cache: 'no-store' });

export const saveHorarioMedicoApi = async (
  medicoId: string,
  payload: HorarioPayload | null,
): Promise<HorarioApi | null> => {
  const existing = await getHorariosByMedicoApi(medicoId);
  const current = existing[0];

  if (!payload) {
    if (current) {
      await apiFetch<void>(`/Horarios/${current.id}`, { method: 'DELETE' });
    }
    return null;
  }

  if (current) {
    await apiFetch<void>(`/Horarios/${current.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { ...current, ...payload };
  }

  return apiFetch<HorarioApi>('/Horarios', {
    method: 'POST',
    body: JSON.stringify({ medicoId, ...payload }),
  });
};
