import apiClient from './client';
import type { MenuResponse, ConfigurarMenuRequest } from './types';

const menusApi = {
  /** Obtiene el menú configurado para una reserva. */
  obtener(reservaRaizId: string): Promise<MenuResponse> {
    return apiClient
      .get<MenuResponse>(`/reservas/${reservaRaizId}/menu`)
      .then((r) => r.data);
  },

  /** Configura (crea o reemplaza) el menú de una reserva. */
  configurar(reservaRaizId: string, data: ConfigurarMenuRequest): Promise<MenuResponse> {
    return apiClient
      .put<MenuResponse>(`/reservas/${reservaRaizId}/menu`, data)
      .then((r) => r.data);
  },
};

export default menusApi;
