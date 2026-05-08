import type { EstadoEvento } from '@/api/types';
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
