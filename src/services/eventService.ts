import eventosApi from '@/api/eventos';
import type { EventoResponse, EstadoEvento } from '@/api/types';
import type { Event, EventStatus } from '@/features/calendar/types';
import { formatShortId } from '@/utils/formatters';

/** Mapea el enum del backend al label que usa el frontend. */
const estadoMap: Record<EstadoEvento, EventStatus> = {
  PENDIENTE: 'Pendiente',
  COTIZACION_ENVIADA: 'Cotización enviada',
  COTIZACION_APROBADA: 'Cotización aprobada',
  PENDIENTE_ANTICIPO: 'Pendiente anticipo',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
};

function toCalendarEvent(evento: EventoResponse): Event {
  const reservaVigente = evento.reservas.find((r) => r.vigente);
  return {
    id: evento.id,
    title: formatShortId(evento.id, 'EV-'),
    start: new Date(evento.fechaHoraInicio),
    end: new Date(evento.fechaHoraFin),
    status: estadoMap[evento.estado] ?? 'Pendiente',
    salon: reservaVigente?.salonId ? formatShortId(reservaVigente.salonId, 'SAL-') : 'Sin salón',
  };
}

const eventService = {
  /**
   * Obtiene todos los eventos del backend y los filtra por rango de fechas
   * en el cliente (el backend no expone filtro por fecha en el listado).
   */
  async getEvents(startDate: Date, endDate: Date): Promise<Event[]> {
    const eventos = await eventosApi.listar();
    return eventos
      .map(toCalendarEvent)
      .filter((e) => e.end > startDate && e.start <= endDate);
  },

  /** Expone el evento crudo del backend para módulos que lo necesiten. */
  async getEventById(id: string): Promise<EventoResponse> {
    return eventosApi.obtenerPorId(id);
  },
};

export default eventService;
