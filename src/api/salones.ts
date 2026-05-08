import apiClient from './client';
import type {
  SalonResponse,
  RegistrarSalonRequest,
  ConsultarDisponibilidadParams,
} from './types';

const salonesApi = {
  /** Lista todos los salones registrados. */
  listar(): Promise<SalonResponse[]> {
    return apiClient.get<SalonResponse[]>('/salones').then((r) => r.data);
  },

  /** Obtiene un salón por su UUID. */
  obtenerPorId(id: string): Promise<SalonResponse> {
    return apiClient.get<SalonResponse>(`/salones/${id}`).then((r) => r.data);
  },

  /**
   * Consulta salones disponibles en un rango de fechas.
   * @param params.fechaHoraInicio  ISO 8601 sin zona, ej: "2025-10-14T14:00:00"
   * @param params.fechaHoraFin     ISO 8601 sin zona
   * @param params.capacidadMinima  Opcional
   */
  consultarDisponibilidad(params: ConsultarDisponibilidadParams): Promise<SalonResponse[]> {
    return apiClient
      .get<SalonResponse[]>('/salones/disponibilidad', { params })
      .then((r) => r.data);
  },

  /** Registra un nuevo salón. */
  registrar(data: RegistrarSalonRequest): Promise<SalonResponse> {
    return apiClient.post<SalonResponse>('/salones', data).then((r) => r.data);
  },
};

export default salonesApi;
