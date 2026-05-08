import apiClient from './client';
import type { MontajeResponse, ConfigurarMontajeRequest } from './types';

const montajesApi = {
  /** Obtiene el montaje configurado para una reserva. */
  obtener(reservaRaizId: string): Promise<MontajeResponse> {
    return apiClient
      .get<MontajeResponse>(`/reservas/${reservaRaizId}/montaje`)
      .then((r) => r.data);
  },

  /** Configura (crea o reemplaza) el montaje de una reserva. */
  configurar(reservaRaizId: string, data: ConfigurarMontajeRequest): Promise<MontajeResponse> {
    return apiClient
      .put<MontajeResponse>(`/reservas/${reservaRaizId}/montaje`, data)
      .then((r) => r.data);
  },
};

export default montajesApi;
