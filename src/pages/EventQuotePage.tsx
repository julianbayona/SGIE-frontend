import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import eventosApi from '@/api/eventos';
import cotizacionesApi from '@/api/cotizaciones';
import clientesApi from '@/api/clientes';
import salonesApi from '@/api/salones';
import catalogosApi from '@/api/catalogos';
import { useToast } from '@/components/ui/ToastProvider';
import { estadoEventoToEventStatus } from '@/features/events/utils/eventStatus';
import type {
  EventoResponse,
  CotizacionResponse,
  EstadoCotizacion,
  ClienteResponse,
  SalonResponse,
  CatalogoBasicoResponse,
} from '@/api/types';
import type { QuoteStatus } from '@/features/quotes/types';
import { formatShortId } from '@/utils/formatters';

const estadoMap: Record<EstadoCotizacion, QuoteStatus> = {
  BORRADOR: 'Borrador',
  GENERADA: 'Generada',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  DESACTUALIZADA: 'Desactualizada',
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const EventQuotePage: React.FC = () => {
  const { eventId } = useParams();
  const toast = useToast();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null);
  const [reservaRaizId, setReservaRaizId] = useState<string | null>(null);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancePercent, setAdvancePercent] = useState(20);

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

        const reserva = eventoData.reservas.find((item) => item.vigente);
        if (!reserva) {
          setError('No hay reserva activa para este evento');
          setLoading(false);
          return;
        }

        const reservaId = reserva.reservaRaizId || reserva.id;
        setReservaRaizId(reservaId);

        const [clienteData, tipoEventoData, salonData] = await Promise.all([
          clientesApi.obtenerPorId(eventoData.clienteId),
          catalogosApi.tiposEvento.obtenerPorId(eventoData.tipoEventoId),
          salonesApi.obtenerPorId(reserva.salonId),
        ]);

        if (cancelled) return;

        setCliente(clienteData);
        setTipoEvento(tipoEventoData);
        setSalon(salonData);

        try {
          const cotizacionData = await cotizacionesApi.obtenerVigente(reservaId);
          if (!cancelled) {
            setCotizacion(cotizacionData);
          }
        } catch {
          if (!cancelled) {
            setCotizacion(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
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

  const isDraft = cotizacion?.estado === 'BORRADOR';
  const isCancelled = evento?.estado === 'CANCELADO';
  const canEditPrices = cotizacion && !isCancelled ? ['BORRADOR', 'GENERADA', 'ENVIADA'].includes(cotizacion.estado) : false;
  const quoteStatus = cotizacion ? estadoMap[cotizacion.estado] : 'Borrador';

  const adjustedTotal = cotizacion?.valorTotal || 0;
  const baseTotal = cotizacion?.valorSubtotal || 0;
  const deltaTotal = adjustedTotal - baseTotal;
  const advanceValue = Math.round((adjustedTotal * advancePercent) / 100);
  const remainingValue = adjustedTotal - advanceValue;

  const quoteItems = useMemo(() => {
    if (!cotizacion) return [];

    return cotizacion.items.map((item) => {
      let source: 'salon' | 'menu' | 'montaje' = 'montaje';
      let pricingMode: 'servicio' | 'unidad' = 'unidad';

      if (item.tipoConcepto.includes('SALON') || item.tipoConcepto.includes('ALQUILER')) {
        source = 'salon';
        pricingMode = 'servicio';
      } else if (item.tipoConcepto.includes('MENU') || item.tipoConcepto.includes('PLATO')) {
        source = 'menu';
        pricingMode = 'unidad';
      } else if (item.tipoConcepto.includes('MONTAJE') || item.tipoConcepto.includes('ADICIONAL')) {
        source = 'montaje';
        pricingMode = item.cantidad === 1 ? 'servicio' : 'unidad';
      }

      return {
        id: item.id,
        concept: item.descripcion,
        source,
        pricingMode,
        quantity: item.cantidad,
        unitBasePrice: item.precioBase,
        unitAdjustedPrice: item.precioOverride ?? item.precioBase,
      };
    });
  }, [cotizacion]);

  const menuItems = useMemo(() => quoteItems.filter((item) => item.source === 'menu'), [quoteItems]);
  const montageItems = useMemo(() => quoteItems.filter((item) => item.source === 'montaje'), [quoteItems]);

  const handleGenerarBorrador = async () => {
    if (!reservaRaizId) return;
    if (isCancelled) {
      setError('No se puede generar cotizacion para un evento cancelado.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const nuevaCotizacion = await cotizacionesApi.generar(reservaRaizId, {
        descuento: 0,
        observaciones: null,
      });

      setCotizacion(nuevaCotizacion);
      toast.success('Borrador generado', 'La cotizacion quedo creada desde menu y montaje.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar borrador';
      setError(message);
      toast.error('No fue posible generar el borrador', message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerarNuevaVersion = async () => {
    if (isCancelled) {
      setError('No se puede crear una nueva version de cotizacion para un evento cancelado.');
      return;
    }
    setError(
      'Para crear una nueva version cambia Menu, Montaje o una reserva. Si solo necesitas negociar precio, ajusta los items permitidos en esta pantalla.'
    );
  };

  const handleGenerarCotizacion = async () => {
    if (!cotizacion) return;
    if (isCancelled) {
      setError('No se puede generar documento para un evento cancelado.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const cotizacionActualizada = await cotizacionesApi.generarDocumento(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      toast.success('Cotizacion generada', 'El documento quedo listo para descargar o enviar.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar la cotizacion';
      setError(message);
      toast.error('No fue posible generar la cotizacion', message);
    } finally {
      setSaving(false);
    }
  };

  const updateAdjustedPrice = async (itemId: string, nuevoPrecio: number) => {
    if (!cotizacion || !canEditPrices) return;

    try {
      setSaving(true);
      setError(null);

      const cotizacionActualizada = await cotizacionesApi.actualizarItem(cotizacion.id, itemId, {
        precioOverride: nuevoPrecio,
      });

      setCotizacion(cotizacionActualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar precio');
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarCotizacion = async () => {
    if (!cotizacion) return;
    if (isCancelled) {
      setError('No se puede enviar cotizacion de un evento cancelado.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const cotizacionActualizada = await cotizacionesApi.enviar(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      toast.success('Cotizacion marcada como enviada', 'La cotizacion cambio al estado ENVIADA.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar cotizacion';
      setError(message);
      toast.error('No fue posible enviar la cotizacion', message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!cotizacion) return;
    if (isCancelled) {
      setError('No se puede enviar cotizacion por email de un evento cancelado.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const cotizacionActualizada = await cotizacionesApi.enviarEmail(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      toast.success('Email programado', 'La cotizacion quedo registrada para envio por correo.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar cotizacion por email';
      setError(message);
      toast.error('No fue posible enviar el email', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDescargarDocumento = async () => {
    if (!cotizacion) return;

    try {
      setSaving(true);
      setError(null);
      await cotizacionesApi.descargarDocumento(cotizacion.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar documento');
    } finally {
      setSaving(false);
    }
  };

  const handleAceptarCotizacion = async () => {
    if (!cotizacion) return;
    if (isCancelled) {
      setError('No se puede aceptar cotizacion de un evento cancelado.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const cotizacionActualizada = await cotizacionesApi.aceptar(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      toast.success('Cotizacion aceptada', 'El evento ya puede continuar al flujo de confirmacion.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aceptar cotizacion';
      setError(message);
      toast.error('No fue posible aceptar la cotizacion', message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmarEvento = async () => {
    if (!evento) return;
    if (isCancelled) {
      setError('No se puede confirmar un evento cancelado.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const eventoConfirmado = await eventosApi.confirmar(evento.id);
      setEvento(eventoConfirmado);
      toast.success('Evento confirmado', 'Se dispararon las operaciones de notificacion y Google Calendar.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al confirmar evento';
      setError(message);
      toast.error('No fue posible confirmar el evento', message);
    } finally {
      setSaving(false);
    }
  };

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
      venue: salon?.nombre || 'Sin salón',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: formatCurrency(adjustedTotal),
    };
  }, [adjustedTotal, cliente, eventId, evento, salon, tipoEvento]);

  if (loading) {
    return (
      <section className="space-y-8 pb-28">
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          Cargando cotización...
        </div>
      </section>
    );
  }

  if (error && !evento) {
    return (
      <section className="space-y-8 pb-28">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </section>
    );
  }

  if (!cotizacion) {
    return (
      <section className="space-y-8 pb-28">
        <EventDetailHeaderTabs event={event} activeTab="cotizacion" onEventCancelled={setEvento} />

        {isCancelled && (
          <EventCancelledNotice detail="Las cotizaciones de este evento quedan disponibles solo para consulta. No se pueden generar borradores, enviar, aceptar o confirmar." />
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
          <p className="font-semibold">No hay cotización vigente para esta reserva.</p>
          <p className="mt-1">
            Menú y Montaje ya guardan lo solicitado para el evento, pero la cotización solo existe cuando generas un
            borrador. Si editaste esos apartados después de una versión previa, esa cotización quedó sin vigencia.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-md bg-primary-gold px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary disabled:opacity-50"
              type="button"
              onClick={handleGenerarBorrador}
              disabled={isCancelled || saving || !reservaRaizId}
            >
              {isCancelled ? 'Evento cancelado' : saving ? 'Generando...' : 'Generar borrador'}
            </button>
            <Link
              to={`/events/${eventId}/menu`}
              className="rounded-md border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Revisar Menú
            </Link>
            <Link
              to={`/events/${eventId}/montaje`}
              className="rounded-md border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Revisar Montaje
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 pb-28">
      <EventDetailHeaderTabs event={event} activeTab="cotizacion" onEventCancelled={setEvento} />

      {isCancelled && (
        <EventCancelledNotice detail="La cotizacion queda en modo consulta. No se pueden ajustar precios, enviar, aceptar, confirmar o crear nuevas versiones." />
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="gap-6 lg:flex lg:items-start">
        <div className="mb-20 flex-1 space-y-6">
          <div className="rounded-lg border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Cotización activa</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-on-surface">
                  {formatShortId(cotizacion.id, 'COT-')}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {event.title} - {event.dateLabel}
                </p>
              </div>
              <StatusBadge type="quote" status={quoteStatus} size="md" />
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="font-display text-base font-bold text-blue-900">Origen de los datos</h4>
                <p className="mt-1 max-w-3xl text-sm text-blue-900">
                  Esta cotización se genera desde Menú y Montaje. Para cambiar platos, cantidades o adicionales, edita
                  esas pestañas; aquí solo se revisan precios, anticipo y acciones de la versión.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-bold text-blue-900 hover:bg-blue-100"
                  to={`/events/${event.id}/menu`}
                >
                  Ir a Menú
                </Link>
                <Link
                  className="rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-bold text-blue-900 hover:bg-blue-100"
                  to={`/events/${event.id}/montaje`}
                >
                  Ir a Montaje
                </Link>
              </div>
            </div>
          </div>

          {!canEditPrices && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Esta cotización está en estado <strong>{cotizacion.estado}</strong>. Los precios ya no se pueden editar
              sobre esta versión.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border bg-surface-container-lowest shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 px-6 py-4">
              <div>
                <h4 className="font-display text-lg font-bold text-on-surface">Detalle económico</h4>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Las cantidades son de solo lectura porque pertenecen a Menú y Montaje. Los precios solo se ajustan
                  mientras la cotización esté en estado BORRADOR, GENERADA o ENVIADA.
                </p>
              </div>
              {!canEditPrices && (
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-600">
                  Documento no editable
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-3">Concepto</th>
                    <th className="px-4 py-3">Origen</th>
                    <th className="px-4 py-3">Cobro</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Precio base</th>
                    <th className="px-4 py-3 text-right">Precio ajustado</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {quoteItems.map((item) => {
                    const hasAdjustment = item.unitAdjustedPrice !== item.unitBasePrice;

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-on-surface">{item.concept}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                            {item.source === 'salon' ? 'Salón' : item.source === 'menu' ? 'Menú' : 'Montaje'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">
                          {item.pricingMode === 'servicio' ? 'Por servicio' : 'Por unidad'}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-on-surface">
                          {item.pricingMode === 'servicio' ? '1 servicio' : `${item.quantity} pax`}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-on-surface-variant">
                          {formatCurrency(item.unitBasePrice)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input
                            className={`w-28 rounded-md border px-2 py-1.5 text-right text-sm ${
                              canEditPrices
                                ? 'bg-surface-container-low'
                                : 'cursor-not-allowed bg-surface-container text-on-surface-variant'
                            } ${hasAdjustment ? 'border-primary-gold/60' : 'border-outline-variant/40'}`}
                            type="number"
                            min={0}
                            step={1000}
                            value={item.unitAdjustedPrice}
                            disabled={!canEditPrices}
                            onChange={(eventTarget) => updateAdjustedPrice(item.id, Number(eventTarget.target.value))}
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-on-surface">
                          {formatCurrency(item.quantity * item.unitAdjustedPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-container-lowest p-6 shadow-sm">
            <h4 className="mb-4 font-display text-lg font-bold text-on-surface">Condiciones de pago</h4>
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-neutral-700">Anticipo (%)</label>
                <input
                  className="w-full rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-2.5 text-sm"
                  type="number"
                  min={0}
                  max={100}
                  value={advancePercent}
                  onChange={(eventTarget) => {
                    const next = Number(eventTarget.target.value);
                    const normalized = Number.isNaN(next) ? 0 : next;
                    setAdvancePercent(Math.min(100, Math.max(0, normalized)));
                  }}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-neutral-700">Anticipo requerido</p>
                <p className="font-display text-xl font-bold text-green-text">{formatCurrency(advanceValue)}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-neutral-700">Saldo restante</p>
                <p className="font-display text-xl font-bold text-on-surface">{formatCurrency(remainingValue)}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[92px] lg:w-[330px]">
          <div className="space-y-4 rounded-lg border border-border bg-surface-container-lowest p-5 shadow-sm">
            <h4 className="font-display text-lg font-bold text-on-surface">Resumen financiero</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total base</span>
                <span className="font-medium text-on-surface">{formatCurrency(baseTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Total ajustado</span>
                <span className="font-medium text-on-surface">{formatCurrency(adjustedTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-2">
                <span className="text-on-surface-variant">Ajuste neto</span>
                <span className={`font-semibold ${deltaTotal >= 0 ? 'text-primary-gold' : 'text-green-text'}`}>
                  {deltaTotal >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(deltaTotal))}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-surface-container-lowest p-5 shadow-sm">
            <h4 className="font-display text-lg font-bold text-on-surface">Detalle solicitado</h4>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Menú solicitado</p>
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-semibold text-on-surface">{item.concept}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.quantity} pax - {formatCurrency(item.unitAdjustedPrice)} c/u
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">No hay items de menú</p>
              )}
            </div>

            <div className="space-y-2 border-t border-outline-variant/20 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Montaje y adicionales</p>
              {montageItems.length > 0 ? (
                montageItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-semibold text-on-surface">{item.concept}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.pricingMode === 'unidad' ? `x${item.quantity}` : '1 servicio'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">No hay items de montaje</p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-surface-container-lowest p-5 shadow-sm">
            <h4 className="font-display text-lg font-bold text-on-surface">Versión actual</h4>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-on-surface">{formatShortId(cotizacion.id, 'COT-')}</p>
                  <span className="text-[10px] font-bold text-gold">Vigente</span>
                </div>
                <p className="text-xs text-on-surface-variant">{new Date().toLocaleDateString('es-CO')}</p>
              </div>
              <StatusBadge type="quote" status={quoteStatus} />
            </div>
          </div>
        </aside>
      </div>

      <footer className="fixed bottom-0 right-0 z-[60] flex w-full items-center justify-between border-t border-surface-container bg-surface-container-lowest/90 px-6 py-4 backdrop-blur-md md:w-[calc(100%-16rem)]">
        <div className="hidden items-center gap-2 text-on-secondary-container sm:flex">
          <span className="material-symbols-outlined text-lg">info</span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Los precios se negocian aqui; cantidades y adicionales se corrigen en Menu o Montaje
          </p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          {isDraft ? (
            <button
              className="flex-1 rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              type="button"
              onClick={handleGenerarCotizacion}
              disabled={isCancelled || saving}
            >
              Generar cotización
            </button>
          ) : (
            <button
              className="flex-1 rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              type="button"
              onClick={handleGenerarNuevaVersion}
              disabled={isCancelled || saving || !reservaRaizId}
            >
              Crear nueva version
            </button>
          )}

          <button
            className="flex-1 rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            onClick={handleDescargarDocumento}
            disabled={saving || cotizacion.estado === 'BORRADOR'}
          >
            Descargar PDF
          </button>

          <button
            className="flex-1 rounded-md border border-green-text/40 px-5 py-2.5 text-sm font-semibold text-green-text transition-colors hover:bg-green-bg disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            onClick={handleEnviarCotizacion}
            disabled={isCancelled || saving || cotizacion.estado !== 'GENERADA'}
          >
            Marcar enviada
          </button>

          <button
            className="flex-1 rounded-md border border-blue-300 px-5 py-2.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            onClick={handleEnviarEmail}
            disabled={isCancelled || saving || !['GENERADA', 'ENVIADA', 'ACEPTADA'].includes(cotizacion.estado)}
          >
            Enviar email
          </button>

          <button
            className="flex-1 rounded-md bg-primary-gold px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            onClick={handleAceptarCotizacion}
            disabled={isCancelled || saving || !['GENERADA', 'ENVIADA'].includes(cotizacion.estado)}
          >
            Aceptar
          </button>

          <button
            className="flex-1 rounded-md bg-[#191C1D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            type="button"
            onClick={handleConfirmarEvento}
            disabled={isCancelled || saving || cotizacion.estado !== 'ACEPTADA' || evento?.estado === 'CONFIRMADO'}
          >
            {isCancelled ? 'Evento cancelado' : 'Confirmar'}
          </button>
        </div>
      </footer>
    </section>
  );
};

export default EventQuotePage;
