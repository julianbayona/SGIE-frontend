import apiClient from './client';
import type { ClienteResponse, RegistrarClienteRequest } from './types';

const clientesApi = {
  /** Lista todos los clientes. Acepta búsqueda opcional por nombre, cédula o teléfono. */
  listar(q?: string): Promise<ClienteResponse[]> {
    return apiClient
      .get<ClienteResponse[]>('/clientes', { params: q ? { q } : undefined })
      .then((r) => r.data);
  },

  /** Obtiene un cliente por su UUID. */
  obtenerPorId(id: string): Promise<ClienteResponse> {
    return apiClient.get<ClienteResponse>(`/clientes/${id}`).then((r) => r.data);
  },

  /** Registra un nuevo cliente. */
  registrar(data: RegistrarClienteRequest): Promise<ClienteResponse> {
    return apiClient.post<ClienteResponse>('/clientes', data).then((r) => r.data);
  },

  /** Actualiza los datos operativos de un cliente existente. */
  actualizar(id: string, data: RegistrarClienteRequest): Promise<ClienteResponse> {
    return apiClient.put<ClienteResponse>(`/clientes/${id}`, data).then((r) => r.data);
  },
};

export default clientesApi;
