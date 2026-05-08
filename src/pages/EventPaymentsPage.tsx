import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import eventosApi from '@/api/eventos';
import clientesApi from '@/api/clientes';
import salonesApi from '@/api/salones';
import catalogosApi from '@/api/catalogos';
import cotizacionesApi from '@/api/cotizaciones';
import { useToast } from '@/components/ui/ToastProvider';
import { estadoEventoToEventStatus } from '@/features/events/utils/eventStatus';
import pagosApi from '@/api/pagos';
import type { EventoResponse, ClienteResponse, SalonResponse, CatalogoBasicoResponse } from '@/api/types';
import { formatShortId } from '@/utils/formatters';

interface PaymentRecord {
  id: string;
  date: string;
  concept: string;
  method: string;
  amount: number;
  registeredBy: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

const EventPaymentsPage: React.FC = () => {
  const { eventId } = useParams();
  const toast = useToast();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [cotizacionId, setCotizacionId] = useState('');
  const [totalEventAmount, setTotalEventAmount] = useState(0);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentWarning, setPaymentWarning] = useState<string | null>(null);

  const [newAmount, setNewAmount] = useState(0);
  const [newDate, setNewDate] = useState('');
  const [newMethod, setNewMethod] = useState('TRANSFERENCIA');
  const [newConcept, setNewConcept] = useState('Anticipo');
  const isCancelled = evento?.estado === 'CANCELADO';

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setPaymentWarning(null);

        const eventoData = await eventosApi.obtenerPorId(eventId);
        if (cancelled) {
          return;
        }

        setEvento(eventoData);

        const reservaActual = eventoData.reservas.find((reserva) => reserva.vigente);
        if (!reservaActual) {
          setError('No hay reserva activa para este evento');
          return;
        }

        const reservaRaizId = reservaActual.reservaRaizId || reservaActual.id;

        const [clienteData, tipoEventoData, salonData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          salonesApi.obtenerPorId(reservaActual.salonId),
        ]);

        if (cancelled) {
          return;
        }

        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalon(salonData);

        try {
          const cotizacion = await cotizacionesApi.obtenerVigente(reservaRaizId);
          const estadoFinanciero = await pagosApi.estadoFinanciero(eventId);
          if (cancelled) {
            return;
          }

          setCotizacionId(cotizacion.id);
          setTotalEventAmount(Number(estadoFinanciero.valorTotal) || Number(cotizacion.valorTotal) || 0);

          const anticipos = await pagosApi.listarAnticipos(cotizacion.id);
          if (cancelled) {
            return;
          }

          setPayments(
            anticipos.map((anticipo) => ({
              id: anticipo.id,
              date: new Date(anticipo.fechaPago).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              concept: anticipo.observaciones ?? 'Anticipo',
              method: anticipo.metodoPago,
              amount: Number(anticipo.valor),
              registeredBy: formatShortId(anticipo.usuarioId, 'USR-'),
            }))
          );
        } catch {
          setCotizacionId('');
          setTotalEventAmount(0);
          setPayments([]);
          setPaymentWarning('Aun no hay cotizacion vigente para registrar anticipos en este evento.');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar pagos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

    return {
      id: evento.id,
      title: `${tipoEvento?.nombre || 'Evento'} - ${cliente?.nombreCompleto || 'Cliente'}`,
      dateLabel: inicio.toLocaleDateString('es-CO'),
      timeLabel: inicio.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      status: estadoEventoToEventStatus(evento.estado),
      customerName: cliente?.nombreCompleto || 'Cargando...',
      customerPhone: cliente?.telefono || '',
      eventType: tipoEvento?.nombre || 'Cargando...',
      guests: reserva?.numInvitados || 0,
      venue: salon?.nombre || 'Sin salon',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: formatCurrency(totalEventAmount),
    };
  }, [cliente, eventId, evento, salon, tipoEvento, totalEventAmount]);

  const paidAmount = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );
  const pendingAmount = Math.max(totalEventAmount - paidAmount, 0);
  const paidProgress = totalEventAmount > 0 ? Math.min((paidAmount / totalEventAmount) * 100, 100) : 0;
  const paymentStatusLabel = pendingAmount > 0 ? 'Saldo pendiente' : 'Pagado totalmente';
  const paymentHistory = useMemo(() => [...payments].reverse(), [payments]);

  const registerPayment = async () => {
    if (isCancelled) {
      setError('No se pueden registrar pagos en un evento cancelado.');
      return;
    }

    if (!cotizacionId || newAmount <= 0 || !newDate || !newConcept.trim()) {
      return;
    }

    const safeAmount = Math.min(newAmount, pendingAmount);

    try {
      setSaving(true);
      const anticipo = await pagosApi.registrarAnticipo(cotizacionId, {
        valor: safeAmount,
        metodoPago: newMethod,
        fechaPago: newDate,
        observaciones: newConcept.trim(),
      });

      if (eventId) {
        const estadoFinanciero = await pagosApi.estadoFinanciero(eventId);
        setTotalEventAmount(Number(estadoFinanciero.valorTotal) || totalEventAmount);
      }

      setPayments((prev) => [
        ...prev,
        {
          id: anticipo.id,
          date: new Date(anticipo.fechaPago).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          concept: anticipo.observaciones ?? newConcept.trim(),
          method: anticipo.metodoPago,
          amount: Number(anticipo.valor),
          registeredBy: formatShortId(anticipo.usuarioId, 'USR-'),
        },
      ]);

      setNewAmount(0);
      setNewDate('');
      setNewMethod('TRANSFERENCIA');
      setNewConcept(pendingAmount - safeAmount <= 0 ? 'Abono final' : 'Anticipo');
      toast.success('Pago registrado', `${formatCurrency(Number(anticipo.valor))} quedo aplicado al evento.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar el pago.';
      setError(message);
      toast.error('No fue posible registrar el pago', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-8 pb-24">
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          Cargando informacion de pagos...
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
      <EventDetailHeaderTabs event={event} activeTab="pagos" onEventCancelled={setEvento} />

      {isCancelled && (
        <EventCancelledNotice detail="Los pagos quedan disponibles solo para consulta. No se pueden registrar nuevos anticipos o abonos en un evento cancelado." />
      )}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {paymentWarning ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {paymentWarning}
        </div>
      ) : null}

      <section className="bg-surface-container-lowest border border-border rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500 font-bold">Anticipos y pagos</p>
            <h3 className="text-xl font-display font-bold text-on-surface mt-1">
              {formatShortId(event.id, 'EV-')} - {event.title.replace(' - ', ' - ')}
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              pendingAmount > 0 ? 'bg-gold-bg text-gold-d border border-gold/25' : 'bg-green-bg text-green-text border border-green-border'
            }`}
          >
            {paymentStatusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Total evento</p>
            <p className="text-2xl font-display font-bold text-on-surface">{formatCurrency(totalEventAmount)}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Pagado</p>
            <p className="text-2xl font-display font-bold text-green-text">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Saldo</p>
            <p className="text-2xl font-display font-bold text-on-surface">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-surface-container-low overflow-hidden">
            <div className="h-full bg-green rounded-full transition-all" style={{ width: `${paidProgress}%` }}></div>
          </div>
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>Avance de pago</span>
            <span className="font-semibold">{paidProgress.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-6">
        <section className="bg-surface-container-lowest border border-border rounded-lg p-6 shadow-sm space-y-5">
          <div>
            <h4 className="text-xl font-display font-bold text-on-surface">Registrar anticipo o abono</h4>
            <p className="text-sm text-on-surface-variant mt-1">
              El valor registrado no puede superar el saldo pendiente de la cotizacion vigente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">Concepto</label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                type="text"
                value={newConcept}
                onChange={(eventTarget) => setNewConcept(eventTarget.target.value)}
                disabled={isCancelled}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">Metodo de pago</label>
              <select
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                value={newMethod}
                onChange={(eventTarget) => setNewMethod(eventTarget.target.value)}
                disabled={isCancelled}
              >
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="NEQUI">Nequi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">Valor</label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                type="number"
                min={0}
                value={newAmount}
                onChange={(eventTarget) => setNewAmount(Math.max(0, Number(eventTarget.target.value) || 0))}
                disabled={isCancelled}
              />
              <p className="text-xs text-on-surface-variant mt-2">
                Maximo permitido: {formatCurrency(pendingAmount)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">Fecha de pago</label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                type="date"
                value={newDate}
                onChange={(eventTarget) => setNewDate(eventTarget.target.value)}
                disabled={isCancelled}
              />
            </div>
          </div>

          <button
            type="button"
            className="bg-primary-gold text-white px-5 py-2.5 rounded-md text-sm font-bold hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isCancelled || saving || !cotizacionId || newAmount <= 0 || !newDate || pendingAmount <= 0 || !newConcept.trim()}
            onClick={registerPayment}
          >
            {isCancelled ? 'Evento cancelado' : saving ? 'Registrando...' : 'Registrar pago'}
          </button>
        </section>

        <aside className="bg-surface-container-lowest border border-border rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xl font-display font-bold text-on-surface">Historial de pagos</h4>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-full">
              {payments.length} registros
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Concepto</th>
                  <th className="px-3 py-2.5">Metodo</th>
                  <th className="px-3 py-2.5">Valor</th>
                  <th className="px-3 py-2.5">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest text-sm">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-3 py-2.5 text-on-surface-variant whitespace-nowrap">{payment.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-on-surface">{payment.concept}</td>
                    <td className="px-3 py-2.5 text-on-surface-variant">{payment.method}</td>
                    <td className="px-3 py-2.5 font-semibold text-green-text whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-on-surface-variant">{payment.registeredBy}</td>
                  </tr>
                ))}
                {paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-on-surface-variant">
                      No hay pagos registrados aun.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default EventPaymentsPage;
