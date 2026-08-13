import { apiFetch } from './api';
import type {
  TratamientoPosologia,
  CreateTratamientoPosologiaDto,
  UpdateTratamientoPosologiaDto,
} from '../types/treatment.types';

/**
 * Obtiene la lista completa de tratamientos y posologías registrados.
 * Endpoint: GET /api/TratamientosPosologia
 */
export const getTratamientosPosologiaApi = async (): Promise<TratamientoPosologia[]> => {
  try {
    const data = await apiFetch<TratamientoPosologia[]>('/TratamientosPosologia');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[treatments.service] Error en GET /TratamientosPosologia:', error);
    return [];
  }
};

/**
 * Obtiene los elementos de posología asociados a un tratamiento médico específico.
 * Endpoint: GET /api/TratamientosPosologia/tratamiento/{tratamientoId}
 */
export const getTratamientosByTratamientoIdApi = async (
  tratamientoId: string,
): Promise<TratamientoPosologia[]> => {
  try {
    const data = await apiFetch<TratamientoPosologia[]>(
      `/TratamientosPosologia/tratamiento/${tratamientoId}`,
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(
      `[treatments.service] Error en GET /TratamientosPosologia/tratamiento/${tratamientoId}:`,
      error,
    );
    return [];
  }
};

/**
 * Crea una nueva posología / tratamiento médico para un paciente.
 * Endpoint: POST /api/TratamientosPosologia
 */
export const createTratamientoPosologiaApi = async (
  payload: CreateTratamientoPosologiaDto,
): Promise<TratamientoPosologia> => {
  try {
    const data = await apiFetch<TratamientoPosologia>('/TratamientosPosologia', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error) {
    console.error('[treatments.service] Error en POST /TratamientosPosologia:', error);
    throw error;
  }
};

/**
 * Actualiza los datos de posología existentes.
 * Endpoint: PUT /api/TratamientosPosologia/{id}
 */
export const updateTratamientoPosologiaApi = async (
  id: string,
  payload: UpdateTratamientoPosologiaDto,
): Promise<TratamientoPosologia> => {
  try {
    const data = await apiFetch<TratamientoPosologia>(`/TratamientosPosologia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error) {
    console.error(`[treatments.service] Error en PUT /TratamientosPosologia/${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una prescripción / posología por ID.
 * Endpoint: DELETE /api/TratamientosPosologia/{id}
 */
export const deleteTratamientoPosologiaApi = async (id: string): Promise<boolean> => {
  try {
    await apiFetch<void>(`/TratamientosPosologia/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error(`[treatments.service] Error en DELETE /TratamientosPosologia/${id}:`, error);
    return false;
  }
};
