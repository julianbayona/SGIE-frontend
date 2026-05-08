import apiClient from './client';
import type { NotificacionResponse } from './types';

const notificacionesApi = {
  listarPorEvento(eventoId: string): Promise<NotificacionResponse[]> {
    return apiClient
      .get<NotificacionResponse[]>(`/eventos/${eventoId}/notificaciones`)
      .then((r) => r.data);
  },
};

export default notificacionesApi;
