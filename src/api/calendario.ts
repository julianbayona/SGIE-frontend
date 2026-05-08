import apiClient from './client';
import type { EventoCalendarResponse } from './types';

const calendarioApi = {
  listarPorEvento(eventoId: string): Promise<EventoCalendarResponse[]> {
    return apiClient
      .get<EventoCalendarResponse[]>(`/calendario/eventos/evento/${eventoId}`)
      .then((r) => r.data);
  },

  reintentar(eventoCalendarId: string): Promise<EventoCalendarResponse> {
    return apiClient
      .post<EventoCalendarResponse>(`/calendario/eventos/${eventoCalendarId}/reintentar`)
      .then((r) => r.data);
  },
};

export default calendarioApi;
