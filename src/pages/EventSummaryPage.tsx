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
  ReservaSalonResponse,
  SalonResponse,
} from '@/api/types';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import { useToast } from '@/components/ui/ToastProvider';

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

const isReservaOperativa = (reserva: ReservaSalonResponse) =>
  reserva.vigente && reserva.activa !== false;

const toInputDateTime = (value: string) => (value ? value.slice(0, 16) : '');

const toApiDateTime = (value: string) => (value ? `${value}:00` : '');

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const EventSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { eventId } = useParams();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salones, setSalones] = useState<SalonResponse[]>([]);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [valorTotal, setValorTotal] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservaModal, setReservaModal] = useState<ReservaModalState | null>(null);
  const [savingReserva, setSavingReserva] = useState(false);

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

        const [clienteData, tipoEventoData, salonesData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          salonesApi.listar(),
        ]);

        if (cancelled) return;
        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalones(salonesData);

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

    const reservasActivas = evento.reservas.filter(isReservaOperativa);
    const invitados = reservasActivas.reduce((total, reserva) => total + reserva.numInvitados, 0);
    const primeraReserva = reservasActivas[0];
    const salonPrincipal = primeraReserva
      ? salones.find((item) => item.id === primeraReserva.salonId)
      : null;
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
      guests: invitados,
      venue:
        reservasActivas.length > 1
          ? `${reservasActivas.length} reservas activas`
          : salonPrincipal?.nombre || 'Sin salon',
      venueCapacity: salonPrincipal ? `Capacidad: ${salonPrincipal.capacidad} pax` : '',
      totalQuote: formatCurrency(valorTotal),
    };
  }, [cliente, evento, eventId, salones, tipoEvento, valorTotal]);

  const currentStepIndex = evento ? lifecycleSteps.indexOf(evento.estado) : -1;
  const isCancelled = evento?.estado === 'CANCELADO';
  const reservasActivas = useMemo(
    () => evento?.reservas.filter(isReservaOperativa) ?? [],
    [evento],
  );
  const salonesMap = useMemo(
    () => new Map(salones.map((salonItem) => [salonItem.id, salonItem])),
    [salones],
  );

  const abrirCrearReserva = () => {
    if (!evento) return;
    const referencia = reservasActivas[0];
    setReservaModal({
      mode: 'create',
      title: 'Agregar reserva',
      salonId: '',
      numInvitados: referencia?.numInvitados ? String(referencia.numInvitados) : '1',
      fechaHoraInicio: toInputDateTime(evento.fechaHoraInicio),
      fechaHoraFin: toInputDateTime(evento.fechaHoraFin),
    });
  };

  const abrirEditarReserva = (reserva: ReservaSalonResponse) => {
    setReservaModal({
      mode: 'edit',
      title: 'Editar reserva',
      reservaRaizId: reserva.reservaRaizId || reserva.id,
      salonId: reserva.salonId,
      numInvitados: String(reserva.numInvitados),
      fechaHoraInicio: toInputDateTime(reserva.fechaHoraInicio),
      fechaHoraFin: toInputDateTime(reserva.fechaHoraFin),
    });
  };

  const guardarReserva = async (form: ReservaModalState) => {
    if (!evento || !form.salonId || !form.fechaHoraInicio || !form.fechaHoraFin) return;
    try {
      setSavingReserva(true);
      const payload = {
        salonId: form.salonId,
        numInvitados: Number(form.numInvitados) || 1,
        fechaHoraInicio: toApiDateTime(form.fechaHoraInicio),
        fechaHoraFin: toApiDateTime(form.fechaHoraFin),
      };
      const actualizado =
        form.mode === 'create'
          ? await eventosApi.crearReserva(evento.id, payload)
          : await eventosApi.modificarReserva(form.reservaRaizId!, payload);
      setEvento(actualizado);
      setReservaModal(null);
      toast.success(
        form.mode === 'create' ? 'Reserva agregada' : 'Reserva actualizada',
        'El rango operativo del evento se recalculo con las reservas activas.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible guardar la reserva.';
      toast.error('No fue posible guardar la reserva', message);
    } finally {
      setSavingReserva(false);
    }
  };

  const retirarReserva = async (reserva: ReservaSalonResponse) => {
    if (!evento || reservasActivas.length <= 1) return;
    const salonReserva = salonesMap.get(reserva.salonId);
    const confirmed = window.confirm(
      `Retirar la reserva de ${salonReserva?.nombre || 'este salon'}? El historial se conserva.`,
    );
    if (!confirmed) return;
    try {
      const actualizado = await eventosApi.retirarReserva(reserva.reservaRaizId || reserva.id);
      setEvento(actualizado);
      toast.success('Reserva retirada', 'La reserva dejo de estar activa para el evento.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible retirar la reserva.';
      toast.error('No fue posible retirar la reserva', message);
    }
  };

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
          label="Reservas de salon"
          value={event.venue}
          detail={event.venueCapacity || 'Capacidad por confirmar'}
          secondary="Reservas activas"
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
              Reservas del evento
            </p>
            <h3 className="mt-1 font-serif text-2xl font-black text-stone-950">Salones y horarios</h3>
            <p className="mt-1 text-sm font-medium text-stone-600">
              Un evento puede tener varias reservas activas en salones u horarios distintos.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirCrearReserva}
            disabled={isCancelled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A8841C] px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#8f7118] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Agregar reserva
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-2">
          {reservasActivas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-sm font-semibold text-stone-500">
              Este evento no tiene reservas activas.
            </div>
          ) : (
            reservasActivas.map((reserva, index) => {
              const salonReserva = salonesMap.get(reserva.salonId);
              return (
                <article
                  key={reserva.id}
                  className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-[#A8841C]/12 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#A8841C]">
                        Reserva {index + 1}
                      </span>
                      <h4 className="mt-3 font-serif text-xl font-black text-stone-950">
                        {salonReserva?.nombre || 'Salon no encontrado'}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-stone-600">
                        {reserva.numInvitados} invitados · Version {reserva.version}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      Activa
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl border border-stone-200 bg-[#fbf8f2] p-4 text-sm font-semibold text-stone-700 sm:grid-cols-2">
                    <div>
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone-500">
                        Inicio
                      </p>
                      <p className="mt-1">{formatDateTime(reserva.fechaHoraInicio)}</p>
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-stone-500">
                        Fin
                      </p>
                      <p className="mt-1">{formatDateTime(reserva.fechaHoraFin)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditarReserva(reserva)}
                      disabled={isCancelled}
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-black text-stone-700 transition hover:border-[#A8841C] hover:text-[#A8841C] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => retirarReserva(reserva)}
                      disabled={isCancelled || reservasActivas.length <= 1}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retirar
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

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

      {reservaModal && (
        <ReservaSalonModal
          value={reservaModal}
          salones={salones.filter((salonItem) => salonItem.activo)}
          saving={savingReserva}
          onChange={setReservaModal}
          onClose={() => setReservaModal(null)}
          onSubmit={guardarReserva}
        />
      )}
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

type ReservaModalState = {
  mode: 'create' | 'edit';
  title: string;
  reservaRaizId?: string;
  salonId: string;
  numInvitados: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
};

type ReservaSalonModalProps = {
  value: ReservaModalState;
  salones: SalonResponse[];
  saving: boolean;
  onChange: (value: ReservaModalState) => void;
  onClose: () => void;
  onSubmit: (value: ReservaModalState) => void;
};

function ReservaSalonModal({
  value,
  salones,
  saving,
  onChange,
  onClose,
  onSubmit,
}: ReservaSalonModalProps) {
  const hasValidRange =
    value.fechaHoraInicio &&
    value.fechaHoraFin &&
    new Date(value.fechaHoraFin) > new Date(value.fechaHoraInicio);
  const canSubmit = Boolean(value.salonId && Number(value.numInvitados) > 0 && hasValidRange);

  const update = (changes: Partial<ReservaModalState>) => onChange({ ...value, ...changes });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-300 bg-[#fbf8f2] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#A8841C]">
              Reserva de salon
            </p>
            <h3 className="mt-1 font-serif text-2xl font-black text-stone-950">{value.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-stone-500">
              Salon
            </span>
            <select
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#A8841C] focus:ring-4 focus:ring-[#A8841C]/15"
              value={value.salonId}
              onChange={(event) => update({ salonId: event.target.value })}
            >
              <option value="">Seleccionar salon</option>
              {salones.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.nombre} · {salon.capacidad} pax
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-stone-500">
              Inicio
            </span>
            <input
              type="datetime-local"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#A8841C] focus:ring-4 focus:ring-[#A8841C]/15"
              value={value.fechaHoraInicio}
              onChange={(event) => update({ fechaHoraInicio: event.target.value })}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-stone-500">
              Fin
            </span>
            <input
              type="datetime-local"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#A8841C] focus:ring-4 focus:ring-[#A8841C]/15"
              value={value.fechaHoraFin}
              onChange={(event) => update({ fechaHoraFin: event.target.value })}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-stone-500">
              Invitados
            </span>
            <input
              type="number"
              min="1"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition focus:border-[#A8841C] focus:ring-4 focus:ring-[#A8841C]/15"
              value={value.numInvitados}
              onChange={(event) => update({ numInvitados: event.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-stone-500">
            {canSubmit ? 'Listo para guardar.' : 'Completa salon, horario valido e invitados.'}
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => onSubmit(value)}
              disabled={!canSubmit || saving}
              className="rounded-xl bg-[#A8841C] px-4 py-3 text-sm font-black text-white transition hover:bg-[#8f7118] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar reserva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventSummaryPage;
