import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsPageHeader, { type EventsFilters } from '@/features/events/components/EventsPageHeader';
import EventsTable from '@/features/events/components/EventsTable';
import EventsTablePagination from '@/features/events/components/EventsTablePagination';
import type { EventRecord } from '@/features/events/types';
import eventosApi from '@/api/eventos';
import clientesApi from '@/api/clientes';
import salonesApi from '@/api/salones';
import catalogosApi from '@/api/catalogos';
import usuariosApi, { type UsuarioResponse } from '@/api/usuarios';
import type { CatalogoBasicoResponse, ClienteResponse, EstadoEvento, EventoResponse, SalonResponse } from '@/api/types';
import { getEventDisplayStatus, isEventReadOnly } from '@/features/events/utils/eventStatus';
import { formatShortId } from '@/utils/formatters';
import { paginate } from '@/utils/pagination';

const nextActionMap: Record<EstadoEvento, string> = {
  PENDIENTE: 'Seleccionar menú y montaje',
  COTIZACION_ENVIADA: 'Esperar aprobación',
  COTIZACION_APROBADA: 'Registrar anticipo',
  PENDIENTE_ANTICIPO: 'Registrar anticipo',
  CONFIRMADO: 'Coordinar personal',
  CANCELADO: 'Sin acciones pendientes',
};

const PAGE_SIZE = 7;

const initialFilters: EventsFilters = {
  query: '',
  hall: '',
  eventKind: '',
  status: 'Todos',
  from: '',
  to: '',
  sortOrder: 'proximos',
};

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function toEventRecord(
  evento: EventoResponse,
  clientes: Map<string, ClienteResponse>,
  salones: Map<string, SalonResponse>,
  tiposEvento: Map<string, CatalogoBasicoResponse>,
  usuarios: Map<string, UsuarioResponse>,
): EventRecord {
  const reservaVigente = evento.reservas.find((reserva) => reserva.vigente);
  const inicio = new Date(evento.fechaHoraInicio);
  const dateLabel = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(inicio);

  const cliente = clientes.get(evento.clienteId);
  const salon = reservaVigente ? salones.get(reservaVigente.salonId) : null;
  const tipoEvento = tiposEvento.get(evento.tipoEventoId);
  const usuarioCreador = usuarios.get(evento.usuarioCreadorId);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0] ?? '';
    const second = parts[1] ?? '';
    if (first && second) {
      return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
    }
    return first.slice(0, 2).toUpperCase();
  };

  return {
    id: evento.id,
    sortDate: evento.fechaHoraInicio,
    rawDate: evento.fechaHoraInicio.slice(0, 10),
    dateLabel,
    clientName: cliente?.nombreCompleto ?? 'Cliente desconocido',
    clientDocument: cliente?.cedula ?? formatShortId(evento.clienteId, 'CLI-'),
    clientInitials: cliente ? getInitials(cliente.nombreCompleto) : '??',
    createdBy: usuarioCreador?.nombre ?? formatShortId(evento.usuarioCreadorId, 'USR-'),
    hall: salon?.nombre ?? 'Sin salón',
    eventKind: (tipoEvento?.nombre ?? 'Social') as EventRecord['eventKind'],
    status: getEventDisplayStatus(evento),
    isActive: !isEventReadOnly(evento),
    nextAction: isEventReadOnly(evento) ? 'Sin acciones pendientes' : nextActionMap[evento.estado] ?? '',
  };
}

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventsFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [eventosData, clientesData, salonesData, tiposEventoData, usuariosData] = await Promise.all([
          eventosApi.listar(),
          clientesApi.listar(),
          salonesApi.listar(),
          catalogosApi.listarTiposEvento(),
          usuariosApi.listar(),
        ]);

        if (cancelled) return;

        const clientesMap = new Map(clientesData.map((cliente) => [cliente.id, cliente]));
        const salonesMap = new Map(salonesData.map((salon) => [salon.id, salon]));
        const tiposEventoMap = new Map(tiposEventoData.map((tipo) => [tipo.id, tipo]));
        const usuariosMap = new Map(usuariosData.map((usuario) => [usuario.id, usuario]));

        setEvents(eventosData.map((evento) => toEventRecord(evento, clientesMap, salonesMap, tiposEventoMap, usuariosMap)));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar eventos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEvents = useMemo(() => {
    const query = normalize(filters.query.trim());
    const withFilters = events.filter((event) => {
      if (filters.hall && event.hall !== filters.hall) return false;
      if (filters.eventKind && event.eventKind !== filters.eventKind) return false;
      if (filters.status !== 'Todos' && event.status !== filters.status) return false;
      if (filters.from && event.rawDate < filters.from) return false;
      if (filters.to && event.rawDate > filters.to) return false;

      if (!query) return true;

      return normalize([
        event.id,
        formatShortId(event.id, 'EV-'),
        event.clientName,
        event.clientDocument,
        event.createdBy,
        event.hall,
        event.eventKind,
        event.status,
        event.dateLabel,
      ].join(' ')).includes(query);
    });

    const now = Date.now();
    return [...withFilters].sort((a, b) => {
      const aTime = new Date(a.sortDate).getTime();
      const bTime = new Date(b.sortDate).getTime();

      if (filters.sortOrder === 'recientes') return bTime - aTime;
      if (filters.sortOrder === 'cliente') {
        return a.clientName.localeCompare(b.clientName, 'es-CO', { sensitivity: 'base' });
      }

      const aPast = aTime < now;
      const bPast = bTime < now;

      if (aPast !== bPast) return aPast ? 1 : -1;
      return aPast ? bTime - aTime : aTime - bTime;
    });
  }, [events, filters]);

  const hallOptions = useMemo(
    () => [...new Set(events.map((event) => event.hall).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es-CO')),
    [events],
  );

  const eventKindOptions = useMemo(
    () => [...new Set(events.map((event) => event.eventKind).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es-CO')),
    [events],
  );

  const activeFiltersCount = useMemo(
    () =>
      Number(Boolean(filters.query.trim())) +
      Number(Boolean(filters.hall)) +
      Number(Boolean(filters.eventKind)) +
      Number(filters.status !== 'Todos') +
      Number(Boolean(filters.from)) +
      Number(Boolean(filters.to)) +
      Number(filters.sortOrder !== 'proximos'),
    [filters],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const pagination = useMemo(() => paginate(visibleEvents, currentPage, PAGE_SIZE), [currentPage, visibleEvents]);

  return (
    <section className="space-y-6">
      <EventsPageHeader
        filters={filters}
        hallOptions={hallOptions}
        eventKindOptions={eventKindOptions}
        activeFiltersCount={activeFiltersCount}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters(initialFilters)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-lg shadow-sm overflow-hidden border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
            Cargando eventos...
          </div>
        ) : (
          <EventsTable
            events={pagination.items}
            onViewEvent={(eventId) => navigate(`/events/${eventId}`)}
          />
        )}
        <EventsTablePagination
          entityLabel="eventos"
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </section>
  );
};

export default EventsPage;
