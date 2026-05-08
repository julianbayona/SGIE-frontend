import type { EventStatus } from '@/features/events/types';
import { formatShortId } from '@/utils/formatters';

export interface EventSummaryData {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  status: EventStatus;
  customerName: string;
  customerPhone: string;
  eventType: string;
  guests: number;
  venue: string;
  venueCapacity: string;
  totalQuote: string;
}

// Datos hardcodeados eliminados - ahora se obtienen del API

export const getEventSummaryById = (eventId?: string): EventSummaryData => {
  const normalizedId = eventId ?? 'unknown';

  // Datos por defecto cuando no se encuentra el evento
  return {
    id: normalizedId,
    title: `Evento - ${formatShortId(normalizedId, 'EV-')}`,
    dateLabel: 'Por confirmar',
    timeLabel: 'Por confirmar',
    status: 'Pendiente',
    customerName: 'Cliente por confirmar',
    customerPhone: 'Sin teléfono',
    eventType: 'Sin definir',
    guests: 0,
    venue: 'Sin salón asignado',
    venueCapacity: 'Capacidad por confirmar',
    totalQuote: '$0',
  };
};
