import type { EstadoEvento, EventoResponse } from '@/api/types';
import type { EventStatus } from '@/features/events/types';

export const estadoEventoToEventStatus = (estado: EstadoEvento): EventStatus => {
  const labels: Record<EstadoEvento, EventStatus> = {
    PENDIENTE: 'Pendiente',
    COTIZACION_ENVIADA: 'Cotización enviada',
    COTIZACION_APROBADA: 'Cotización aprobada',
    PENDIENTE_ANTICIPO: 'Pendiente anticipo',
    CONFIRMADO: 'Confirmado',
    CANCELADO: 'Cancelado',
  };

  return labels[estado];
};

export const eventHasEnded = (evento: Pick<EventoResponse, 'fechaHoraFin'>): boolean =>
  new Date(evento.fechaHoraFin).getTime() < Date.now();

export const isEventFinished = (evento: Pick<EventoResponse, 'estado' | 'fechaHoraFin'>): boolean =>
  evento.estado === 'CONFIRMADO' && eventHasEnded(evento);

export const isEventExpired = (evento: Pick<EventoResponse, 'estado' | 'fechaHoraFin'>): boolean =>
  evento.estado !== 'CONFIRMADO' && evento.estado !== 'CANCELADO' && eventHasEnded(evento);

export const isEventReadOnly = (evento: Pick<EventoResponse, 'estado' | 'fechaHoraFin'> | null | undefined): boolean =>
  Boolean(evento && (evento.estado === 'CANCELADO' || eventHasEnded(evento)));

export const getEventDisplayStatus = (
  evento: Pick<EventoResponse, 'estado' | 'fechaHoraFin'>
): EventStatus => {
  if (isEventFinished(evento)) {
    return 'Finalizado';
  }
  if (isEventExpired(evento)) {
    return 'Vencido';
  }
  return estadoEventoToEventStatus(evento.estado);
};
