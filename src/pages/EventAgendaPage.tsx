import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import eventosApi from '@/api/eventos';
import clientesApi from '@/api/clientes';
import salonesApi from '@/api/salones';
import catalogosApi from '@/api/catalogos';
import pagosApi from '@/api/pagos';
import { getEventDisplayStatus, isEventReadOnly } from '@/features/events/utils/eventStatus';
import pruebasPlatoApi from '@/api/pruebasPlato';
import calendarioApi from '@/api/calendario';
import notificacionesApi from '@/api/notificaciones';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  EventoCalendarResponse,
  EventoResponse,
  ClienteResponse,
  NotificacionResponse,
  SalonResponse,
  CatalogoBasicoResponse,
} from '@/api/types';
import { formatShortId } from '@/utils/formatters';
import { FORM_LIMITS, limitText } from '@/utils/formLimits';

type AgendaCategory = 'degustacion' | 'anticipo';
type AgendaStatus = 'programado' | 'enviado' | 'completado' | 'cancelado';
type ReminderChannel = 'interno' | 'whatsapp' | 'email' | 'llamada';

interface AgendaEntry {
  id: string;
  category: AgendaCategory;
  milestone: string;
  scheduledAt: string;
  channel: ReminderChannel;
  notes: string;
  status: AgendaStatus;
}

const categoryLabel: Record<AgendaCategory, string> = {
  degustacion: 'Prueba de plato',
  anticipo: 'Recordatorio de anticipo',
};

const statusLabel: Record<AgendaStatus, string> = {
  programado: 'Programado',
  enviado: 'Enviado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const channelLabel: Record<ReminderChannel, string> = {
  interno: 'Interno',
  whatsapp: 'WhatsApp',
  email: 'Email',
  llamada: 'Llamada',
};

const statusPillClass: Record<AgendaStatus, string> = {
  programado: 'bg-blue-50 text-blue-700',
  enviado: 'bg-amber-50 text-amber-700',
  completado: 'bg-green-50 text-green-700',
  cancelado: 'bg-stone-200 text-stone-600',
};

const integrationStatusClass: Record<string, string> = {
  PENDIENTE: 'bg-blue-50 text-blue-700',
  ENVIANDO: 'bg-blue-50 text-blue-700',
  ENVIADA: 'bg-green-50 text-green-700',
  SINCRONIZADO: 'bg-green-50 text-green-700',
  ERROR: 'bg-red-50 text-red-700',
  CANCELADA: 'bg-stone-200 text-stone-600',
  CANCELADO: 'bg-stone-200 text-stone-600',
};

const formatDateTime = (value: string): string => {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const toDatetimeLocalInputValue = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const sortByScheduledAt = (entries: AgendaEntry[]): AgendaEntry[] => {
  return [...entries].sort((a, b) => {
    const timeA = new Date(a.scheduledAt).getTime();
    const timeB = new Date(b.scheduledAt).getTime();

    return timeA - timeB;
  });
};

const EventAgendaPage: React.FC = () => {
  const { eventId } = useParams();
  const toast = useToast();
  
  // Estados para datos del API
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionResponse[]>([]);
  const [eventosCalendar, setEventosCalendar] = useState<EventoCalendarResponse[]>([]);
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [refreshingMonitor, setRefreshingMonitor] = useState(false);
  const [retryingCalendarId, setRetryingCalendarId] = useState<string | null>(null);

  // Estado inicial vacío - sin datos hardcodeados
  const [entries, setEntries] = useState<AgendaEntry[]>([]);

  const [newCategory, setNewCategory] = useState<AgendaCategory>('degustacion');
  const [newMilestone, setNewMilestone] = useState('Prueba de plato #1');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newChannel, setNewChannel] = useState<ReminderChannel>('whatsapp');
  const [newNotes, setNewNotes] = useState('');
  const [filterCategory, setFilterCategory] = useState<'todos' | AgendaCategory>('todos');
  const isCancelled = evento?.estado === 'CANCELADO';
  const isReadOnly = isEventReadOnly(evento);

  const cargarMonitoreo = async (currentEventId: string) => {
    const [notificacionesData, calendarData] = await Promise.all([
      notificacionesApi.listarPorEvento(currentEventId),
      calendarioApi.listarPorEvento(currentEventId),
    ]);

    setNotificaciones(notificacionesData);
    setEventosCalendar(calendarData);
    setMonitorError(null);
  };

  // Cargar evento al montar
  useEffect(() => {
    if (!eventId) return;
    
    let cancelled = false;
    
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const eventoData = await eventosApi.obtenerPorId(eventId);
        if (cancelled) return;
        setEvento(eventoData);

        const reservaActual = eventoData.reservas.find(r => r.vigente);
        if (!reservaActual) {
          setError('No hay reserva activa para este evento');
          setLoading(false);
          return;
        }

        // Cargar datos relacionados en paralelo
        const [clienteData, tipoEventoData, salonData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          salonesApi.obtenerPorId(reservaActual.salonId),
        ]);

        if (cancelled) return;
        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalon(salonData);

        try {
          const currentEventId = eventId;
          const [notificacionesData, calendarData] = await Promise.all([
            notificacionesApi.listarPorEvento(currentEventId),
            calendarioApi.listarPorEvento(currentEventId),
          ]);
          if (!cancelled) {
            setNotificaciones(notificacionesData);
            setEventosCalendar(calendarData);
            setMonitorError(null);
          }
        } catch {
          if (!cancelled) {
            setNotificaciones([]);
            setEventosCalendar([]);
            setMonitorError('No fue posible cargar el monitoreo de notificaciones y Calendar.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar evento');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [eventId]);

  const refrescarMonitoreo = async () => {
    if (!eventId) return;

    try {
      setRefreshingMonitor(true);
      await cargarMonitoreo(eventId);
    } catch {
      setMonitorError('No fue posible actualizar el monitoreo de notificaciones y Calendar.');
    } finally {
      setRefreshingMonitor(false);
    }
  };

  const reintentarEventoCalendar = async (eventoCalendarId: string) => {
    try {
      setRetryingCalendarId(eventoCalendarId);
      const actualizado = await calendarioApi.reintentar(eventoCalendarId);
      setEventosCalendar((prev) =>
        prev.map((calendar) => (calendar.id === actualizado.id ? actualizado : calendar))
      );
      setMonitorError(null);
      toast.success('Reintento programado', 'La operacion de Google Calendar quedo lista para reprocesarse.');
    } catch {
      setMonitorError('No fue posible reintentar la sincronización con Google Calendar.');
      toast.error('No fue posible reintentar Calendar');
    } finally {
      setRetryingCalendarId(null);
    }
  };

  // Crear objeto event compatible con EventDetailHeaderTabs
  const event = useMemo(() => {
    if (!evento) {
      return {
        id: eventId || '',
        title: 'Cargando...',
        dateLabel: '',
        timeLabel: '',
        status: 'Pendiente' as const,
        customerName: '',
        customerPhone: '',
        eventType: '',
        guests: 0,
        venue: '',
        venueCapacity: '',
        totalQuote: '$0',
      };
    }

    const reserva = evento.reservas.find(r => r.vigente);
    const inicio = new Date(evento.fechaHoraInicio);
    const fin = new Date(evento.fechaHoraFin);
    
    return {
      id: evento.id,
      title: `${tipoEvento?.nombre || 'Evento'} - ${cliente?.nombreCompleto || 'Cliente'}`,
      dateLabel: `Inicio: ${inicio.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      timeLabel: `Fin: ${fin.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      status: getEventDisplayStatus(evento),
      customerName: cliente?.nombreCompleto || 'Cargando...',
      customerPhone: cliente?.telefono || '',
      createdBy: formatShortId(evento.usuarioCreadorId, 'USR-'),
      creatorId: evento.usuarioCreadorId,
      eventType: tipoEvento?.nombre || 'Cargando...',
      guests: reserva?.numInvitados || 0,
      venue: salon?.nombre || 'Sin salón',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: '$0',
    };
  }, [evento, cliente, salon, tipoEvento, eventId]);

  const totalTastings = useMemo(
    () => entries.filter((entry) => entry.category === 'degustacion').length,
    [entries]
  );
  const totalAdvanceReminders = useMemo(
    () => entries.filter((entry) => entry.category === 'anticipo').length,
    [entries]
  );
  const totalPending = useMemo(
    () => entries.filter((entry) => entry.status === 'programado' || entry.status === 'enviado').length,
    [entries]
  );
  const totalNotificationsWithError = useMemo(
    () => notificaciones.filter((notificacion) => notificacion.estado === 'ERROR').length,
    [notificaciones]
  );
  const totalCalendarWithError = useMemo(
    () => eventosCalendar.filter((calendar) => calendar.estado === 'ERROR').length,
    [eventosCalendar]
  );
  const currentDateInputMin = useMemo(() => toDatetimeLocalInputValue(new Date()), []);
  const eventStartDate = useMemo(() => {
    if (!evento?.fechaHoraInicio) {
      return null;
    }

    const date = new Date(evento.fechaHoraInicio);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [evento?.fechaHoraInicio]);
  const eventStartInputMax = useMemo(() => {
    if (!eventStartDate) {
      return undefined;
    }

    return toDatetimeLocalInputValue(new Date(eventStartDate.getTime() - 60_000));
  }, [eventStartDate]);
  const eventStartLabel = evento?.fechaHoraInicio ? formatDateTime(evento.fechaHoraInicio) : 'el inicio del evento';
  const selectedScheduleDate = useMemo(() => {
    if (!newScheduledAt) {
      return null;
    }

    const date = new Date(newScheduledAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [newScheduledAt]);
  const scheduleHelpText =
    newCategory === 'degustacion'
      ? `La prueba debe quedar en una fecha futura y antes de ${eventStartLabel}.`
      : `El recordatorio debe quedar en una fecha futura, idealmente antes de ${eventStartLabel}.`;
  const scheduleValidationMessage = useMemo(() => {
    if (!newScheduledAt) {
      return null;
    }

    if (!selectedScheduleDate) {
      return 'Selecciona una fecha y hora valida.';
    }

    if (selectedScheduleDate.getTime() < Date.now()) {
      return newCategory === 'degustacion'
        ? 'La prueba de plato no puede programarse en una fecha pasada.'
        : 'El recordatorio no puede programarse en una fecha pasada.';
    }

    if (newCategory === 'degustacion' && eventStartDate && selectedScheduleDate >= eventStartDate) {
      return `La prueba de plato debe ser anterior al inicio del evento (${eventStartLabel}).`;
    }

    return null;
  }, [eventStartDate, eventStartLabel, newCategory, newScheduledAt, selectedScheduleDate]);
  const canCreateNotification = Boolean(
    !isReadOnly && !saving && newMilestone.trim() && newScheduledAt && !scheduleValidationMessage
  );

  const visibleEntries = useMemo(() => {
    const baseEntries =
      filterCategory === 'todos'
        ? entries
        : entries.filter((entry) => entry.category === filterCategory);

    return sortByScheduledAt(baseEntries);
  }, [entries, filterCategory]);

  const resetMilestoneByCategory = (category: AgendaCategory) => {
    if (category === 'degustacion') {
      setNewMilestone('Prueba de plato #1');
      return;
    }

    setNewMilestone('Anticipo 50% - recordatorio #1');
  };

  const createEntry = async () => {
    if (isReadOnly) {
      setError('No se pueden crear notificaciones para un evento en modo solo lectura.');
      return;
    }

    if (!newMilestone.trim() || !newScheduledAt) {
      return;
    }

    if (scheduleValidationMessage) {
      setError(scheduleValidationMessage);
      toast.error('Fecha no valida', scheduleValidationMessage);
      return;
    }

    if (!eventId) return;

    try {
      setSaving(true);
      setError(null);

      const fechaLocal = newScheduledAt.length === 16 ? `${newScheduledAt}:00` : newScheduledAt;
      let id = `ag-${Date.now()}`;

      if (newCategory === 'degustacion') {
        const prueba = await pruebasPlatoApi.programar(eventId, { fechaRealizacion: fechaLocal });
        id = prueba.id;
      } else {
        const recordatorio = await pagosApi.programarRecordatorio(eventId, {
          fechaRecordatorio: fechaLocal.slice(0, 10),
        });
        id = recordatorio.id;
      }

      setEntries((prev) => [
        ...prev,
        {
          id,
          category: newCategory,
          milestone: newMilestone.trim(),
          scheduledAt: fechaLocal,
          channel: newCategory === 'degustacion' ? 'email' : newChannel,
          notes: newNotes.trim(),
          status: 'programado',
        },
      ]);

      setNewScheduledAt('');
      setNewNotes('');
      await refrescarMonitoreo();
      toast.success(
        newCategory === 'degustacion' ? 'Prueba de plato agendada' : 'Recordatorio creado',
        newCategory === 'degustacion'
          ? 'Se generaron las operaciones de notificacion y Google Calendar.'
          : 'El recordatorio quedo programado para la fecha indicada.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear notificacion.';
      setError(message);
      toast.error('No fue posible crear la notificacion', message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = (id: string, status: AgendaStatus) => {
    if (isReadOnly) return;
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }

        return {
          ...entry,
          status,
        };
      })
    );
  };

  if (loading) {
    return (
      <section className="space-y-8 pb-24">
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          Cargando notificaciones del evento...
        </div>
      </section>
    );
  }

  if (error && !evento) {
    return (
      <section className="space-y-8 pb-24">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 pb-24">
      <EventDetailHeaderTabs
        event={event}
        activeTab="agenda"
        onEventCancelled={setEvento}
        onEventUpdated={setEvento}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {isReadOnly && (
        <EventCancelledNotice
          title={isCancelled ? undefined : `${event.status}: modo solo lectura`}
          detail="Las notificaciones quedan disponibles para monitoreo. No se pueden crear nuevas pruebas de plato ni recordatorios de anticipo."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Pruebas de plato</p>
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{totalTastings}</p>
        </div>
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Recordatorios de anticipo</p>
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{totalAdvanceReminders}</p>
        </div>
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Pendientes por ejecutar</p>
          <p className="text-3xl font-display font-bold text-primary-gold mt-1">{totalPending}</p>
        </div>
      </div>

      <section className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-gold font-bold">Nueva programacion</p>
            <h4 className="text-2xl font-display font-bold text-on-surface mt-1">Crear notificacion o prueba de plato</h4>
            <p className="text-sm text-on-surface-variant mt-1">
              Ingresa primero los datos operativos y revisa abajo el estado de envios y sincronizaciones.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Regla de fecha</span>
            <span>{scheduleHelpText}</span>
          </div>
        </div>

        {isReadOnly ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Este evento esta en modo solo lectura. El formulario queda bloqueado.
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">Tipo</label>
            <select
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
              value={newCategory}
              onChange={(eventTarget) => {
                const nextCategory = eventTarget.target.value as AgendaCategory;
                setNewCategory(nextCategory);
                resetMilestoneByCategory(nextCategory);
              }}
              disabled={isReadOnly}
            >
              <option value="degustacion">Prueba de plato</option>
              <option value="anticipo">Recordatorio de anticipo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">Hito</label>
            <input
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
              type="text"
              value={newMilestone}
              maxLength={FORM_LIMITS.shortText}
              onChange={(eventTarget) => setNewMilestone(limitText(eventTarget.target.value, FORM_LIMITS.shortText))}
              disabled={isReadOnly}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">Fecha y hora</label>
            <input
              className={`w-full bg-surface-container-low border rounded-md px-3 py-2.5 text-sm ${
                scheduleValidationMessage ? 'border-red-300 text-red-700' : 'border-outline-variant/40'
              }`}
              type="datetime-local"
              value={newScheduledAt}
              min={currentDateInputMin}
              max={newCategory === 'degustacion' ? eventStartInputMax : undefined}
              onChange={(eventTarget) => setNewScheduledAt(eventTarget.target.value)}
              disabled={isReadOnly}
            />
            <p className={`mt-2 text-xs font-semibold ${scheduleValidationMessage ? 'text-red-700' : 'text-on-surface-variant'}`}>
              {scheduleValidationMessage || scheduleHelpText}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">Canal</label>
            <select
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm disabled:opacity-70"
              value={newCategory === 'degustacion' ? 'email' : newChannel}
              onChange={(eventTarget) => setNewChannel(eventTarget.target.value as ReminderChannel)}
              disabled={isReadOnly || newCategory === 'degustacion'}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="llamada">Llamada</option>
              <option value="interno">Interno</option>
            </select>
            {newCategory === 'degustacion' ? (
              <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                La prueba de plato genera notificacion y sincronizacion de Calendar automaticamente.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-2">Notas</label>
          <textarea
            className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm min-h-[86px]"
            value={newNotes}
            maxLength={FORM_LIMITS.longText}
            placeholder="Detalle opcional para el equipo..."
            onChange={(eventTarget) => setNewNotes(limitText(eventTarget.target.value, FORM_LIMITS.longText))}
            disabled={isReadOnly}
          ></textarea>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-on-surface-variant">
            {newCategory === 'degustacion'
              ? 'Se validara que la prueba sea futura y previa al evento.'
              : 'Se creara un recordatorio de anticipo para la fecha seleccionada.'}
          </p>
          <button
            type="button"
            className="bg-[#191C1D] text-white px-6 py-3 rounded-md text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canCreateNotification}
            onClick={createEntry}
          >
            {isReadOnly
              ? event.status
              : saving
                ? 'Programando...'
                : newCategory === 'degustacion'
                  ? 'Programar prueba de plato'
                  : 'Crear recordatorio'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-300 bg-[#fbf8f2] shadow-xl shadow-stone-900/5">
        <div className="border-b border-stone-200 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A8841C]">Monitoreo</p>
              <h4 className="mt-1 font-serif text-2xl font-black text-stone-950">Notificaciones y Google Calendar</h4>
              <p className="mt-1 text-sm font-medium text-stone-600">
                Revisa que los mensajes y sincronizaciones disparados por observers se hayan procesado correctamente.
              </p>
            </div>
            <div className="flex gap-2">
              <MonitorChip label="Notificaciones" value={notificaciones.length} errorCount={totalNotificationsWithError} />
              <MonitorChip label="Calendar" value={eventosCalendar.length} errorCount={totalCalendarWithError} />
              <button
                type="button"
                onClick={refrescarMonitoreo}
                disabled={refreshingMonitor}
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-stone-700 transition hover:border-[#A8841C] hover:text-[#A8841C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshingMonitor ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
          {monitorError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {monitorError}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white">
            <div className="border-b border-stone-200 bg-[#f4ead8] px-5 py-4">
              <h5 className="font-serif text-lg font-black text-stone-950">Notificaciones</h5>
              <p className="mt-1 text-xs font-semibold text-stone-600">
                Estado general y destinatarios de cada mensaje.
              </p>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {notificaciones.length === 0 ? (
                <EmptyMonitor message="Todavía no hay notificaciones asociadas a este evento." />
              ) : (
                <div className="divide-y divide-stone-200">
                  {notificaciones.map((notificacion) => (
                    <div key={notificacion.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-stone-950">{notificacion.tipo}</p>
                          <p className="mt-1 text-xs font-semibold text-stone-500">
                            Programada: {formatDateTime(notificacion.fechaProgramada)}
                          </p>
                          {notificacion.fechaEnvio ? (
                            <p className="mt-1 text-xs font-semibold text-stone-500">
                              Enviada: {formatDateTime(notificacion.fechaEnvio)}
                            </p>
                          ) : null}
                        </div>
                        <StatusChip status={notificacion.estado} />
                      </div>
                      <div className="mt-3 space-y-2">
                        {notificacion.destinatarios.map((destinatario) => (
                          <div
                            key={destinatario.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fbf8f2] px-3 py-2 text-xs"
                          >
                            <span className="font-semibold text-stone-700">
                              {destinatario.correo || destinatario.telefono || 'Destinatario'}
                            </span>
                            <StatusChip status={destinatario.estado} />
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-stone-500">
                        Intentos: {notificacion.intentos}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white">
            <div className="border-b border-stone-200 bg-[#f4ead8] px-5 py-4">
              <h5 className="font-serif text-lg font-black text-stone-950">Google Calendar</h5>
              <p className="mt-1 text-xs font-semibold text-stone-600">
                Operaciones enviadas al calendario operativo.
              </p>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {eventosCalendar.length === 0 ? (
                <EmptyMonitor message="Todavía no hay operaciones de Calendar asociadas a este evento." />
              ) : (
                <div className="divide-y divide-stone-200">
                  {eventosCalendar.map((calendar) => (
                    <div key={calendar.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-stone-950">
                            {calendar.origenTipo} · {calendar.tipo}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-stone-500">
                            Google ID: {calendar.googleEventId || 'Sin sincronizar'}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-stone-500">
                            Sync: {calendar.fechaSync ? formatDateTime(calendar.fechaSync) : 'Pendiente'}
                          </p>
                        </div>
                        <StatusChip status={calendar.estado} />
                      </div>
                      {calendar.mensajeError ? (
                        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                          {calendar.mensajeError}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-stone-500">
                          Intentos: {calendar.intentos}
                        </p>
                        {calendar.estado === 'ERROR' ? (
                          <button
                            type="button"
                            onClick={() => reintentarEventoCalendar(calendar.id)}
                            disabled={retryingCalendarId === calendar.id}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {retryingCalendarId === calendar.id ? 'Reintentando...' : 'Reintentar Calendar'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h4 className="text-2xl font-display font-bold text-on-surface">Notificaciones y recordatorios</h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Crea y monitorea pruebas de plato, recordatorios de anticipo, envíos y sincronizaciones externas.
              </p>
            </div>
            <select
              className="bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2 text-sm"
              value={filterCategory}
              onChange={(eventTarget) => setFilterCategory(eventTarget.target.value as 'todos' | AgendaCategory)}
            >
              <option value="todos">Todos</option>
              <option value="degustacion">Pruebas de plato</option>
              <option value="anticipo">Recordatorios de anticipo</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5">Hito</th>
                  <th className="px-3 py-2.5">Canal</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest text-sm">
                {visibleEntries.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-on-surface-variant italic" colSpan={6}>
                      No hay recordatorios para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  visibleEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2.5 text-on-surface-variant whitespace-nowrap">{formatDateTime(entry.scheduledAt)}</td>
                      <td className="px-3 py-2.5 text-on-surface whitespace-nowrap">{categoryLabel[entry.category]}</td>
                      <td className="px-3 py-2.5 font-medium text-on-surface">{entry.milestone}</td>
                      <td className="px-3 py-2.5 text-on-surface-variant whitespace-nowrap">{channelLabel[entry.channel]}</td>
                      <td className="px-3 py-2.5">
                        <select
                          className={`text-xs font-bold rounded-full px-2.5 py-1 border-none ${statusPillClass[entry.status]}`}
                          value={entry.status}
                          onChange={(eventTarget) => updateStatus(entry.id, eventTarget.target.value as AgendaStatus)}
                          disabled={isReadOnly}
                        >
                          <option value="programado">{statusLabel.programado}</option>
                          <option value="enviado">{statusLabel.enviado}</option>
                          <option value="completado">{statusLabel.completado}</option>
                          <option value="cancelado">{statusLabel.cancelado}</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-on-surface-variant max-w-[300px]">{entry.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </section>
    </section>
  );
};

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
        integrationStatusClass[status] ?? 'bg-stone-100 text-stone-600'
      }`}
    >
      {status}
    </span>
  );
}

function MonitorChip({ label, value, errorCount }: { label: string; value: number; errorCount: number }) {
  return (
    <div className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-right">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-black text-stone-950">{value}</p>
      <p className={`text-xs font-bold ${errorCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
        {errorCount > 0 ? `${errorCount} error(es)` : 'Sin errores'}
      </p>
    </div>
  );
}

function EmptyMonitor({ message }: { message: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#A8841C]/10 text-[#A8841C]">
        <span className="material-symbols-outlined text-2xl">notifications</span>
      </div>
      <p className="mx-auto mt-3 max-w-sm text-sm font-semibold text-stone-500">{message}</p>
    </div>
  );
}

export default EventAgendaPage;
