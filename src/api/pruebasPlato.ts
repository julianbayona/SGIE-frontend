import apiClient from './client';
import type { PruebaPlatoRequest, PruebaPlatoResponse } from './types';

const pruebasPlatoApi = {
  programar(eventoId: string, data: PruebaPlatoRequest): Promise<PruebaPlatoResponse> {
    return apiClient
      .post<PruebaPlatoResponse>(`/eventos/${eventoId}/pruebas-plato`, data)
      .then((r) => r.data);
  },
};

export default pruebasPlatoApi;
