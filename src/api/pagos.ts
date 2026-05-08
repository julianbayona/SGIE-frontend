import apiClient from './client';
import type {
  AnticipoResponse,
  RegistrarAnticipoRequest,
  RecordatorioAnticipoResponse,
  ProgramarRecordatorioRequest,
  EstadoFinancieroEventoResponse,
} from './types';

const pagosApi = {
  listarAnticipos(cotizacionId: string): Promise<AnticipoResponse[]> {
    return apiClient
      .get<AnticipoResponse[]>(`/cotizaciones/${cotizacionId}/anticipos`)
      .then((r) => r.data);
  },

  registrarAnticipo(
    cotizacionId: string,
    data: RegistrarAnticipoRequest
  ): Promise<AnticipoResponse> {
    return apiClient
      .post<AnticipoResponse>(`/cotizaciones/${cotizacionId}/anticipos`, data)
      .then((r) => r.data);
  },

  estadoFinanciero(eventoId: string): Promise<EstadoFinancieroEventoResponse> {
    return apiClient
      .get<EstadoFinancieroEventoResponse>(`/eventos/${eventoId}/estado-financiero`)
      .then((r) => r.data);
  },

  programarRecordatorio(
    eventoId: string,
    data: ProgramarRecordatorioRequest
  ): Promise<RecordatorioAnticipoResponse> {
    return apiClient
      .post<RecordatorioAnticipoResponse>(`/eventos/${eventoId}/recordatorios-anticipo`, data)
      .then((r) => r.data);
  },
};

export default pagosApi;
