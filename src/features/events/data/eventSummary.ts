import type { EventStatus } from '@/features/events/types';
import type { CatalogoBasicoResponse, ClienteResponse, EventoResponse, SalonResponse } from '@/api/types';
import { getEventDisplayStatus } from '@/features/events/utils/eventStatus';
import { formatShortId } from '@/utils/formatters';

export interface EventSummaryData {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  status: EventStatus;
  customerName: string;
  customerPhone: string;
  createdBy?: string;
  creatorId?: string;
  eventType: string;
  guests: number;
  venue: string;
  venueCapacity: string;
  totalQuote: string;
}

interface BuildEventSummaryParams {
  evento: EventoResponse | null;
  eventId?: string;
  cliente?: ClienteResponse | null;
  salon?: SalonResponse | null;
  tipoEvento?: CatalogoBasicoResponse | null;
  totalQuote?: string;
  createdBy?: string;
}

// Datos hardcodeados eliminados - ahora se obtienen del API

const formatEventDateTime = (date: Date): string =>
  date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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

export const buildEventSummaryData = ({
  evento,
  eventId,
  cliente,
  salon,
  tipoEvento,
  totalQuote = '$0',
  createdBy,
}: BuildEventSummaryParams): EventSummaryData => {
  if (!evento) {
    return {
      ...getEventSummaryById(eventId),
      title: 'Cargando...',
      dateLabel: '',
      timeLabel: '',
      customerName: '',
      customerPhone: '',
      eventType: '',
      venue: '',
      venueCapacity: '',
      totalQuote,
      createdBy: 'Cargando...',
    };
  }

  const reserva = evento.reservas.find((item) => item.vigente);
  const inicio = new Date(evento.fechaHoraInicio);
  const fin = new Date(evento.fechaHoraFin);

  return {
    id: evento.id,
    title: `${tipoEvento?.nombre || 'Evento'} - ${cliente?.nombreCompleto || 'Cliente'}`,
    dateLabel: `Inicio: ${formatEventDateTime(inicio)}`,
    timeLabel: `Fin: ${formatEventDateTime(fin)}`,
    status: getEventDisplayStatus(evento),
    customerName: cliente?.nombreCompleto || 'Cargando...',
    customerPhone: cliente?.telefono || '',
    createdBy: createdBy ?? formatShortId(evento.usuarioCreadorId, 'USR-'),
    creatorId: evento.usuarioCreadorId,
    eventType: tipoEvento?.nombre || 'Cargando...',
    guests: reserva?.numInvitados || 0,
    venue: salon?.nombre || 'Sin salon',
    venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
    totalQuote,
  };
};
