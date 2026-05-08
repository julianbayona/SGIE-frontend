import apiClient from './client';
import type {
  EventoResponse,
  CrearEventoRequest,
  CrearReservaSalonRequest,
  ModificarReservaSalonRequest,
  CancelarEventoRequest,
} from './types';

const eventosApi = {
  /** Lista todos los eventos. */
  listar(): Promise<EventoResponse[]> {
    return apiClient.get<EventoResponse[]>('/eventos').then((r) => r.data);
  },

  /** Obtiene un evento por su UUID. */
  obtenerPorId(id: string): Promise<EventoResponse> {
    return apiClient.get<EventoResponse>(`/eventos/${id}`).then((r) => r.data);
  },

  /** Crea un nuevo evento. */
  crear(data: CrearEventoRequest): Promise<EventoResponse> {
    return apiClient.post<EventoResponse>('/eventos', data).then((r) => r.data);
  },

  /** Agrega una reserva de salón a un evento existente. */
  crearReserva(eventoId: string, data: CrearReservaSalonRequest): Promise<EventoResponse> {
    return apiClient
      .post<EventoResponse>(`/eventos/${eventoId}/reservas`, data)
      .then((r) => r.data);
  },

  /** Modifica una reserva de salón existente. */
  modificarReserva(
    reservaRaizId: string,
    data: ModificarReservaSalonRequest
  ): Promise<EventoResponse> {
    return apiClient
      .patch<EventoResponse>(`/eventos/reservas/${reservaRaizId}`, data)
      .then((r) => r.data);
  },

  /** Confirma un evento (transición de estado). */
  confirmar(eventoId: string): Promise<EventoResponse> {
    return apiClient.post<EventoResponse>(`/eventos/${eventoId}/confirmar`).then((r) => r.data);
  },

  /** Cancela un evento con motivo obligatorio. */
  cancelar(eventoId: string, data: CancelarEventoRequest): Promise<EventoResponse> {
    return apiClient
      .post<EventoResponse>(`/eventos/${eventoId}/cancelar`, data)
      .then((r) => r.data);
  },
};

export default eventosApi;
