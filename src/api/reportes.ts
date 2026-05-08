import apiClient from './client';
import type {
  DemandaSalonResponse,
  EventosMensualesResponse,
  ReporteAnticiposResponse,
  ReporteFinancieroEventoResponse,
  ResumenEventosResponse,
} from './types';

interface RangoReporte {
  desde: string;
  hasta: string;
}

const params = ({ desde, hasta }: RangoReporte) => ({ desde, hasta });

const reportesApi = {
  resumenEventos(rango: RangoReporte): Promise<ResumenEventosResponse> {
    return apiClient
      .get<ResumenEventosResponse>('/reportes/eventos/resumen', { params: params(rango) })
      .then((response) => response.data);
  },

  eventosMensuales(rango: RangoReporte): Promise<EventosMensualesResponse[]> {
    return apiClient
      .get<EventosMensualesResponse[]>('/reportes/eventos/mensual', { params: params(rango) })
      .then((response) => response.data);
  },

  financieroEventos(rango: RangoReporte): Promise<ReporteFinancieroEventoResponse[]> {
    return apiClient
      .get<ReporteFinancieroEventoResponse[]>('/reportes/financiero/eventos', { params: params(rango) })
      .then((response) => response.data);
  },

  anticipos(rango: RangoReporte): Promise<ReporteAnticiposResponse> {
    return apiClient
      .get<ReporteAnticiposResponse>('/reportes/anticipos', { params: params(rango) })
      .then((response) => response.data);
  },

  demandaSalones(rango: RangoReporte): Promise<DemandaSalonResponse[]> {
    return apiClient
      .get<DemandaSalonResponse[]>('/reportes/salones/demanda', { params: params(rango) })
      .then((response) => response.data);
  },
};

export default reportesApi;
