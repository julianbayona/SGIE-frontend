import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsPageHeader from '@/features/events/components/EventsPageHeader';
import EventsTable from '@/features/events/components/EventsTable';
import EventsTablePagination from '@/features/events/components/EventsTablePagination';
import type { EventRecord, EventStatus, EventsTab } from '@/features/events/types';
import eventosApi from '@/api/eventos';
import clientesApi from '@/api/clientes';
import salonesApi from '@/api/salones';
import catalogosApi from '@/api/catalogos';
import type { EventoResponse, EstadoEvento, ClienteResponse, SalonResponse, CatalogoBasicoResponse } from '@/api/types';
import { formatShortId } from '@/utils/formatters';

const estadoMap: Record<EstadoEvento, EventStatus> = {
  PENDIENTE: 'Pendiente',
  COTIZACION_ENVIADA: 'Cotización enviada',
  COTIZACION_APROBADA: 'Cotización aprobada',
  PENDIENTE_ANTICIPO: 'Pendiente anticipo',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
};

const nextActionMap: Record<EstadoEvento, string> = {
  PENDIENTE: 'Seleccionar menú y montaje',
  COTIZACION_ENVIADA: 'Esperar aprobación',
  COTIZACION_APROBADA: 'Registrar anticipo',
  PENDIENTE_ANTICIPO: 'Registrar anticipo',
  CONFIRMADO: 'Coordinar personal',
  CANCELADO: 'Sin acciones pendientes',
};

const PAGE_SIZE = 7;

function toEventRecord(
  e: EventoResponse,
  clientes: Map<string, ClienteResponse>,
  salones: Map<string, SalonResponse>,
  tiposEvento: Map<string, CatalogoBasicoResponse>
): EventRecord {
  const reservaVigente = e.reservas.find((r) => r.vigente);
  const inicio = new Date(e.fechaHoraInicio);
  const dateLabel = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(inicio);

  const cliente = clientes.get(e.clienteId);
  const salon = reservaVigente ? salones.get(reservaVigente.salonId) : null;
  const tipoEvento = tiposEvento.get(e.tipoEventoId);

  // Obtener iniciales del cliente
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
    id: e.id,
    dateLabel,
    clientName: cliente?.nombreCompleto ?? 'Cliente desconocido',
    clientDocument: cliente?.cedula ?? formatShortId(e.clienteId, 'CLI-'),
    clientInitials: cliente ? getInitials(cliente.nombreCompleto) : '??',
    hall: salon?.nombre ?? 'Sin salón',
    eventKind: (tipoEvento?.nombre ?? 'Social') as EventRecord['eventKind'],
    status: estadoMap[e.estado] ?? 'Pendiente',
    isActive: e.estado !== 'CANCELADO',
    nextAction: nextActionMap[e.estado] ?? '',
  };
}

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EventsTab>('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar todos los datos en paralelo
        const [eventosData, clientesData, salonesData, tiposEventoData] = await Promise.all([
          eventosApi.listar(),
          clientesApi.listar(),
          salonesApi.listar(),
          catalogosApi.listarTiposEvento(),
        ]);

        if (cancelled) return;

        // Crear mapas para búsqueda rápida
        const clientesMap = new Map(clientesData.map(c => [c.id, c]));
        const salonesMap = new Map(salonesData.map(s => [s.id, s]));
        const tiposEventoMap = new Map(tiposEventoData.map(t => [t.id, t]));

        // Enriquecer eventos con datos de catálogos
        const enrichedEvents = eventosData.map(e => 
          toEventRecord(e, clientesMap, salonesMap, tiposEventoMap)
        );

        setEvents(enrichedEvents);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar eventos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visibleEvents = useMemo(() => {
    if (activeTab === 'Activos') return events.filter((e) => e.isActive && e.status !== 'Cancelado');
    if (activeTab === 'Pendientes')
      return events.filter((e) =>
        ['Pendiente', 'Esperando selección de menú', 'Cotización enviada', 'Cotización aprobada', 'Pendiente anticipo'].includes(e.status)
      );
    if (activeTab === 'Confirmados') return events.filter((e) => e.status === 'Confirmado');
    if (activeTab === 'Cancelados') return events.filter((e) => e.status === 'Cancelado');
    return events;
  }, [activeTab, events]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = Math.ceil(visibleEvents.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedEvents = visibleEvents.slice(pageStart, pageStart + PAGE_SIZE);
  const from = visibleEvents.length === 0 ? 0 : pageStart + 1;
  const to = Math.min(pageStart + PAGE_SIZE, visibleEvents.length);

  return (
    <section className="space-y-6">
      <EventsPageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-lg shadow-sm overflow-hidden border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
            Cargando eventos…
          </div>
        ) : (
          <EventsTable
            events={paginatedEvents}
            onViewEvent={(eventId) => navigate(`/events/${eventId}`)}
          />
        )}
        <EventsTablePagination
          from={from}
          to={to}
          total={visibleEvents.length}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </section>
  );
};

export default EventsPage;
