import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import catalogosApi from '@/api/catalogos';
import clientesApi from '@/api/clientes';
import eventosApi from '@/api/eventos';
import pagosApi from '@/api/pagos';
import salonesApi from '@/api/salones';
import type {
  CatalogoBasicoResponse,
  ClienteResponse,
  EstadoEvento,
  EventoResponse,
  SalonResponse,
} from '@/api/types';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';

const estadoLabels: Record<EstadoEvento, string> = {
  PENDIENTE: 'Pendiente',
  COTIZACION_ENVIADA: 'Cotizacion enviada',
  COTIZACION_APROBADA: 'Cotizacion aprobada',
  PENDIENTE_ANTICIPO: 'Pendiente anticipo',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
};

const lifecycleSteps: EstadoEvento[] = [
  'PENDIENTE',
  'COTIZACION_ENVIADA',
  'COTIZACION_APROBADA',
  'PENDIENTE_ANTICIPO',
  'CONFIRMADO',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const EventSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [valorTotal, setValorTotal] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const reservaActual = eventoData.reservas.find((reserva) => reserva.vigente);
        const [clienteData, tipoEventoData, salonData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          reservaActual ? salonesApi.obtenerPorId(reservaActual.salonId) : Promise.resolve(null),
        ]);

        if (cancelled) return;
        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalon(salonData);

        try {
          const financiero = await pagosApi.estadoFinanciero(eventId);
          if (!cancelled) {
            setValorTotal(Number(financiero.valorTotal) || 0);
            setSaldoPendiente(Number(financiero.saldoPendiente) || 0);
          }
        } catch {
          if (!cancelled) {
            setValorTotal(0);
            setSaldoPendiente(0);
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

    return () => {
      cancelled = true;
    };
  }, [eventId]);

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

    const reserva = evento.reservas.find((item) => item.vigente);
    const inicio = new Date(evento.fechaHoraInicio);
    const fin = new Date(evento.fechaHoraFin);

    return {
      id: evento.id,
      title: `${tipoEvento?.nombre || 'Evento'} - ${cliente?.nombreCompleto || 'Cliente'}`,
      dateLabel: inicio.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      timeLabel: `${inicio.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
      status: estadoLabels[evento.estado] as any,
      customerName: cliente?.nombreCompleto || 'Cargando...',
      customerPhone: cliente?.telefono || '',
      eventType: tipoEvento?.nombre || 'Cargando...',
      guests: reserva?.numInvitados || 0,
      venue: salon?.nombre || 'Sin salon',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: formatCurrency(valorTotal),
    };
  }, [cliente, evento, eventId, salon, tipoEvento, valorTotal]);

  const currentStepIndex = evento ? lifecycleSteps.indexOf(evento.estado) : -1;
  const isCancelled = evento?.estado === 'CANCELADO';

  if (loading) {
    return (
      <section className="space-y-8 pb-28">
        <div className="rounded-2xl border border-stone-300 bg-[#fbf8f2] px-6 py-14 text-center text-sm font-semibold text-stone-600 shadow-sm">
          Cargando informacion del evento...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-8 pb-28">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-7 pb-28">
      <EventDetailHeaderTabs event={event} activeTab="summary" onEventCancelled={setEvento} />

      {isCancelled && (
        <EventCancelledNotice detail="Este evento queda disponible solo para consulta historica. Las acciones operativas estan bloqueadas." />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon="person"
          label="Cliente principal"
          value={event.customerName}
          detail={event.customerPhone || 'Sin telefono'}
          secondary={cliente?.correo || 'Sin correo registrado'}
        />
        <SummaryCard
          icon="celebration"
          label="Tipo de evento"
          value={event.eventType}
          detail={`${event.guests} invitados`}
          secondary="Datos base de la solicitud"
        />
        <SummaryCard
          icon="meeting_room"
          label="Salon reservado"
          value={event.venue}
          detail={event.venueCapacity || 'Capacidad por confirmar'}
          secondary="Reserva vigente"
        />
        <SummaryCard
          icon="account_balance_wallet"
          label="Total cotizado"
          value={event.totalQuote}
          detail={`Saldo: ${formatCurrency(saldoPendiente)}`}
          secondary={saldoPendiente > 0 ? 'Pago pendiente' : 'Sin saldo pendiente'}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-stone-300 bg-[#fbf8f2] shadow-xl shadow-stone-900/5">
        <div className="flex flex-col gap-4 border-b border-stone-200 bg-[#fbf8f2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A8841C]">
              Proceso del evento
            </p>
            <h3 className="mt-1 font-serif text-2xl font-black text-stone-950">Estado operativo</h3>
            <p className="mt-1 text-sm font-medium text-stone-600">
              Las transiciones se actualizan segun las acciones realizadas en menu, cotizacion y pagos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/events/${event.id}/pagos`)}
            disabled={isCancelled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A8841C] px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#8f7118] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            {isCancelled ? 'Evento cancelado' : 'Registrar anticipo'}
          </button>
        </div>

        <div className="overflow-x-auto p-6">
          <div className="relative flex min-w-[760px] items-start justify-between">
            <div className="absolute left-0 top-5 h-0.5 w-full bg-stone-300" />
            {lifecycleSteps.map((step, index) => {
              const isCurrent = index === currentStepIndex;
              const isDone = currentStepIndex > index;

              return (
                <div key={step} className="relative z-10 flex w-32 flex-col items-center text-center">
                  <div
                    className={`mb-3 flex size-10 items-center justify-center rounded-full border shadow-sm ${
                      isCurrent
                        ? 'border-[#A8841C] bg-white text-[#A8841C] ring-4 ring-[#A8841C]/15'
                        : isDone
                          ? 'border-[#A8841C] bg-[#A8841C] text-white'
                          : 'border-stone-300 bg-white text-stone-400'
                    }`}
                  >
                    {isDone ? <span className="material-symbols-outlined text-lg">check</span> : null}
                    {isCurrent ? <div className="size-2.5 rounded-full bg-[#A8841C]" /> : null}
                  </div>
                  <span
                    className={`text-[11px] font-black leading-tight ${
                      isCurrent ? 'text-[#A8841C]' : 'text-stone-500'
                    }`}
                  >
                    {estadoLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
};

type SummaryCardProps = {
  icon: string;
  label: string;
  value: string;
  detail: string;
  secondary: string;
};

function SummaryCard({ icon, label, value, detail, secondary }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-stone-300 bg-[#fbf8f2] p-5 shadow-lg shadow-stone-900/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#A8841C]/12 text-[#A8841C]">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </span>
        <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-stone-500">
          {label}
        </span>
      </div>
      <p className="line-clamp-2 font-serif text-xl font-black leading-tight text-stone-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-stone-600">{detail}</p>
      <p className="mt-1 text-xs font-medium text-stone-400">{secondary}</p>
    </div>
  );
}

export default EventSummaryPage;
