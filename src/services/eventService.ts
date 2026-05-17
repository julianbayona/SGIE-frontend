import eventosApi from '@/api/eventos';
import type { EventoResponse } from '@/api/types';
import type { Event } from '@/features/calendar/types';
import { getEventDisplayStatus } from '@/features/events/utils/eventStatus';
import { formatShortId } from '@/utils/formatters';

function toCalendarEvent(evento: EventoResponse): Event {
  const reservaVigente = evento.reservas.find((r) => r.vigente);
  return {
    id: evento.id,
    title: formatShortId(evento.id, 'EV-'),
    start: new Date(evento.fechaHoraInicio),
    end: new Date(evento.fechaHoraFin),
    status: getEventDisplayStatus(evento),
    salon: reservaVigente?.salonId ? formatShortId(reservaVigente.salonId, 'SAL-') : 'Sin salon',
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

  /** Expone el evento crudo del backend para modulos que lo necesiten. */
  async getEventById(id: string): Promise<EventoResponse> {
    return eventosApi.obtenerPorId(id);
  },
};

export default eventService;
