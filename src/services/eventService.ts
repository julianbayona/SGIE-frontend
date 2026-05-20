import catalogosApi from '@/api/catalogos';
import clientesApi from '@/api/clientes';
import eventosApi from '@/api/eventos';
import salonesApi from '@/api/salones';
import type { CatalogoBasicoResponse, ClienteResponse, EventoResponse, SalonResponse } from '@/api/types';
import type { Event } from '@/features/calendar/types';
import { getEventDisplayStatus } from '@/features/events/utils/eventStatus';

function buildMapById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function toCalendarEvent(
  evento: EventoResponse,
  clientes: Map<string, ClienteResponse>,
  tiposEvento: Map<string, CatalogoBasicoResponse>,
  salones: Map<string, SalonResponse>,
): Event {
  const reservaVigente = evento.reservas.find((r) => r.vigente);
  const cliente = clientes.get(evento.clienteId);
  const tipoEvento = tiposEvento.get(evento.tipoEventoId);
  const salon = reservaVigente ? salones.get(reservaVigente.salonId) : null;
  const titleParts = [tipoEvento?.nombre, cliente?.nombreCompleto].filter(Boolean);

  return {
    id: evento.id,
    title: titleParts.length > 0 ? titleParts.join(' - ') : 'Evento sin identificar',
    start: new Date(evento.fechaHoraInicio),
    end: new Date(evento.fechaHoraFin),
    status: getEventDisplayStatus(evento),
    salon: salon?.nombre ?? 'Sin salon',
  };
}

const eventService = {
  /**
   * Obtiene todos los eventos del backend y los filtra por rango de fechas
   * en el cliente (el backend no expone filtro por fecha en el listado).
   */
  async getEvents(startDate: Date, endDate: Date): Promise<Event[]> {
    const [eventos, clientes, tiposEvento, salones] = await Promise.all([
      eventosApi.listar(),
      clientesApi.listar(),
      catalogosApi.tiposEvento.listar(),
      salonesApi.listar(),
    ]);
    const clientesPorId = buildMapById(clientes);
    const tiposEventoPorId = buildMapById(tiposEvento);
    const salonesPorId = buildMapById(salones);

    return eventos
      .map((evento) => toCalendarEvent(evento, clientesPorId, tiposEventoPorId, salonesPorId))
      .filter((e) => e.end > startDate && e.start <= endDate);
  },

  /** Expone el evento crudo del backend para modulos que lo necesiten. */
  async getEventById(id: string): Promise<EventoResponse> {
    return eventosApi.obtenerPorId(id);
  },
};

export default eventService;
