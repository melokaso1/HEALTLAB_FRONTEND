import { apiFetch } from './api';

export interface ConteoEstadoDto {
  estado: string;
  cantidad: number;
}

export interface ConteoMedicoDto {
  medicoId: string;
  nombreMedico: string;
  cantidad: number;
}

export interface CitaReporteDto {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  pacienteNombre: string;
  medicoNombre: string;
  estadoNombre: string;
  tipoCitaNombre: string;
  motivoConsulta?: string;
}

export const getReporteCitasApi = async (
  desde: string,
  hasta: string,
  medicoId?: string,
): Promise<CitaReporteDto[]> => {
  try {
    let url = `/Reportes/citas?desde=${desde}&hasta=${hasta}`;
    if (medicoId && medicoId !== 'Todos' && medicoId.length === 36) {
      url += `&medicoId=${medicoId}`;
    }
    return await apiFetch<CitaReporteDto[]>(url);
  } catch (error) {
    console.warn('[reports.service] Error consultando /Reportes/citas:', error);
    return [];
  }
};

export const getReporteConteoPorEstadoApi = async (
  desde?: string,
  hasta?: string,
): Promise<ConteoEstadoDto[]> => {
  try {
    let url = '/Reportes/citas/por-estado';
    const params: string[] = [];
    if (desde) params.push(`desde=${desde}`);
    if (hasta) params.push(`hasta=${hasta}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return await apiFetch<ConteoEstadoDto[]>(url);
  } catch (error) {
    console.warn('[reports.service] Error consultando /Reportes/citas/por-estado:', error);
    return [];
  }
};

export const getReporteConteoPorMedicoApi = async (
  desde?: string,
  hasta?: string,
): Promise<ConteoMedicoDto[]> => {
  try {
    let url = '/Reportes/citas/por-medico';
    const params: string[] = [];
    if (desde) params.push(`desde=${desde}`);
    if (hasta) params.push(`hasta=${hasta}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return await apiFetch<ConteoMedicoDto[]>(url);
  } catch (error) {
    console.warn('[reports.service] Error consultando /Reportes/citas/por-medico:', error);
    return [];
  }
};
