import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import catalogosApi from '@/api/catalogos';
import clientesApi from '@/api/clientes';
import cotizacionesApi from '@/api/cotizaciones';
import eventosApi from '@/api/eventos';
import salonesApi from '@/api/salones';
import type {
  CatalogoBasicoResponse,
  ClienteResponse,
  CotizacionResponse,
  EstadoCotizacion,
  EventoResponse,
  SalonResponse,
} from '@/api/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import EventCancelledNotice from '@/features/events/components/EventCancelledNotice';
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import { getEventDisplayStatus, isEventReadOnly } from '@/features/events/utils/eventStatus';
import QuoteHistoryPanel from '@/features/quotes/components/QuoteHistoryPanel';
import type { QuoteStatus } from '@/features/quotes/types';
import { FORM_LIMITS, numberInputValue, selectInputText, toLimitedNumber } from '@/utils/formLimits';
import { capitalizeText, formatShortId } from '@/utils/formatters';

type QuoteItemView = {
  id: string;
  concept: string;
  source: 'salon' | 'menu' | 'montaje';
  pricingMode: 'servicio' | 'unidad';
  quantity: number;
  unitBasePrice: number;
  unitAdjustedPrice: number;
};

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

const sourceLabel = (source: QuoteItemView['source']): string => {
  if (source === 'salon') return 'Salon';
  if (source === 'menu') return 'Menu';
  return 'Montaje';
};

const EventQuotePage: React.FC = () => {
  const { eventId } = useParams();
  const toast = useToast();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null);
  const [historial, setHistorial] = useState<CotizacionResponse[]>([]);
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
          setError('No hay reserva activa para este evento.');
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

        const historialData = await cotizacionesApi.listarPorEvento(eventoData.id);
        if (!cancelled) {
          setHistorial(historialData);
        }

        try {
          const cotizacionData = await cotizacionesApi.obtenerVigente(reservaId);
          if (!cancelled) setCotizacion(cotizacionData);
        } catch {
          if (!cancelled) setCotizacion(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const isDraft = cotizacion?.estado === 'BORRADOR';
  const isCancelled = evento?.estado === 'CANCELADO';
  const isReadOnly = isEventReadOnly(evento);
  const canEditPrices = cotizacion && !isReadOnly ? ['BORRADOR', 'GENERADA', 'ENVIADA'].includes(cotizacion.estado) : false;
  const quoteStatus = cotizacion ? estadoMap[cotizacion.estado] : 'Borrador';
  const newVersionHelp =
    'La nueva version se crea automaticamente cuando cambias menu, montaje o reserva. Para negociar precio, ajusta los items en esta pantalla.';
  const acceptQuoteHelp =
    'Aceptar cotizacion marca esta version como aprobada y habilita el flujo de confirmacion y pagos. Puedes hacerlo ahora o volver despues.';

  const adjustedTotal = Number(cotizacion?.valorTotal || 0);
  const baseTotal = Number(cotizacion?.valorSubtotal || 0);
  const discountTotal = Number(cotizacion?.descuento || 0);
  const deltaTotal = adjustedTotal - baseTotal;
  const advanceValue = Math.round((adjustedTotal * advancePercent) / 100);
  const remainingValue = adjustedTotal - advanceValue;

  const quoteItems = useMemo<QuoteItemView[]>(() => {
    if (!cotizacion) return [];

    return cotizacion.items.map((item) => {
      let source: QuoteItemView['source'] = 'montaje';
      let pricingMode: QuoteItemView['pricingMode'] = 'unidad';

      if (item.tipoConcepto.includes('SALON') || item.tipoConcepto.includes('ALQUILER')) {
        source = 'salon';
        pricingMode = 'servicio';
      } else if (item.tipoConcepto.includes('MENU') || item.tipoConcepto.includes('PLATO')) {
        source = 'menu';
      } else if (item.tipoConcepto.includes('MONTAJE') || item.tipoConcepto.includes('ADICIONAL')) {
        source = 'montaje';
        pricingMode = item.cantidad === 1 ? 'servicio' : 'unidad';
      }

      return {
        id: item.id,
        concept: capitalizeText(item.descripcion),
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

  const recargarHistorial = async () => {
    if (!eventId) return;
    setHistorial(await cotizacionesApi.listarPorEvento(eventId));
  };

  const handleGenerarBorrador = async () => {
    if (!reservaRaizId) return;
    if (isReadOnly) {
      setError('No se puede generar cotizacion para un evento en modo solo lectura.');
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
      await recargarHistorial();
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
    if (isReadOnly) {
      setError('No se puede crear una nueva version de cotizacion para un evento en modo solo lectura.');
      return;
    }

    setError(
      newVersionHelp,
    );
  };

  const handleGenerarCotizacion = async () => {
    if (!cotizacion) return;
    if (isReadOnly) {
      setError('No se puede generar documento para un evento en modo solo lectura.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const cotizacionActualizada = await cotizacionesApi.generarDocumento(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      await recargarHistorial();
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
      await recargarHistorial();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar precio.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarCotizacion = async () => {
    if (!cotizacion) return;
    if (isReadOnly) {
      setError('No se puede enviar cotizacion de un evento en modo solo lectura.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const cotizacionActualizada = await cotizacionesApi.enviar(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      await recargarHistorial();
      if (evento) setEvento(await eventosApi.obtenerPorId(evento.id));
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
    if (isReadOnly) {
      setError('No se puede enviar cotizacion por email de un evento en modo solo lectura.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const cotizacionActualizada = await cotizacionesApi.enviarEmail(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      await recargarHistorial();
      toast.success('Email programado', 'La cotizacion quedo registrada para envio por correo.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar cotizacion por email';
      setError(message);
      toast.error('No fue posible enviar el email', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDescargarDocumento = async (formato: 'xlsx' | 'pdf' = 'xlsx') => {
    if (!cotizacion) return;

    try {
      setSaving(true);
      setError(null);
      await cotizacionesApi.descargarDocumento(cotizacion.id, formato);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar documento.');
    } finally {
      setSaving(false);
    }
  };

  const handleAceptarCotizacion = async () => {
    if (!cotizacion) return;
    if (isReadOnly) {
      setError('No se puede aceptar cotizacion de un evento en modo solo lectura.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const cotizacionActualizada = await cotizacionesApi.aceptar(cotizacion.id);
      setCotizacion(cotizacionActualizada);
      await recargarHistorial();
      if (evento) setEvento(await eventosApi.obtenerPorId(evento.id));
      toast.success('Cotizacion aceptada', 'La version quedo aprobada. Ahora puedes confirmar el evento o registrar pagos.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aceptar cotizacion';
      setError(message);
      toast.error('No fue posible aceptar la cotizacion', message);
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
    const fin = new Date(evento.fechaHoraFin);

    return {
      id: evento.id,
      title: `${capitalizeText(tipoEvento?.nombre) || 'Evento'} - ${capitalizeText(cliente?.nombreCompleto) || 'Cliente'}`,
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
      customerName: capitalizeText(cliente?.nombreCompleto) || 'Cargando...',
      customerPhone: cliente?.telefono || '',
      createdBy: formatShortId(evento.usuarioCreadorId, 'USR-'),
      creatorId: evento.usuarioCreadorId,
      eventType: capitalizeText(tipoEvento?.nombre) || 'Cargando...',
      guests: reserva?.numInvitados || 0,
      venue: capitalizeText(salon?.nombre) || 'Sin salon',
      venueCapacity: salon ? `Capacidad: ${salon.capacidad} pax` : '',
      totalQuote: formatCurrency(adjustedTotal),
    };
  }, [adjustedTotal, cliente, eventId, evento, salon, tipoEvento]);

  if (loading) {
    return (
      <section className="space-y-8 pb-28">
        <div className="flex items-center justify-center py-16 text-on-surface-variant">Cargando cotizacion...</div>
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
        <EventDetailHeaderTabs
          event={event}
          activeTab="cotizacion"
          onEventCancelled={setEvento}
          onEventUpdated={setEvento}
        />

        {isReadOnly && (
          <EventCancelledNotice
            title={isCancelled ? undefined : `${event.status}: modo solo lectura`}
            detail="Las cotizaciones de este evento quedan disponibles solo para consulta. No se pueden generar borradores, enviar o aceptar."
          />
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#A8841C]/25 bg-surface-container-lowest shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A8841C]">Cotizacion pendiente</p>
              <h3 className="mt-2 font-display text-3xl font-bold text-on-surface">Crea el primer borrador</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
                El borrador se arma con la reserva vigente, menu y montaje guardados. Si no has terminado esos pasos,
                revisalos antes de generar la version economica.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="rounded-md bg-[#A8841C] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#8d6f15] disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={handleGenerarBorrador}
                  disabled={isReadOnly || saving || !reservaRaizId}
                >
                  {isReadOnly ? event.status : saving ? 'Generando...' : 'Generar borrador'}
                </button>
                <Link
                  to={`/events/${eventId}/menu`}
                  className="rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:border-[#A8841C] hover:text-[#A8841C]"
                >
                  Revisar menu
                </Link>
                <Link
                  to={`/events/${eventId}/montaje`}
                  className="rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:border-[#A8841C] hover:text-[#A8841C]"
                >
                  Revisar montaje
                </Link>
              </div>
            </div>

            <aside className="border-t border-[#A8841C]/15 bg-[#fbf6e8] p-7 lg:border-l lg:border-t-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a5c09]">Checklist</p>
              <div className="mt-4 space-y-3 text-sm text-[#4b3b12]">
                <p className="flex gap-2">
                  <span className="font-black text-[#A8841C]">1.</span>
                  Menu definido para el cliente.
                </p>
                <p className="flex gap-2">
                  <span className="font-black text-[#A8841C]">2.</span>
                  Montaje y adicionales revisados.
                </p>
                <p className="flex gap-2">
                  <span className="font-black text-[#A8841C]">3.</span>
                  Borrador listo para ajustar precios.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {eventId && <QuoteHistoryPanel eventId={eventId} quotes={historial} />}
      </section>
    );
  }

  return (
    <section className="space-y-8 pb-28">
      <EventDetailHeaderTabs
        event={event}
        activeTab="cotizacion"
        onEventCancelled={setEvento}
        onEventUpdated={setEvento}
      />

      {isReadOnly && (
        <EventCancelledNotice
          title={isCancelled ? undefined : `${event.status}: modo solo lectura`}
          detail="La cotizacion queda en modo consulta. No se pueden ajustar precios, enviar, aceptar o crear nuevas versiones."
        />
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="mb-20 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-[#A8841C]/25 bg-surface-container-lowest shadow-sm">
            <div className="border-b border-[#A8841C]/15 bg-gradient-to-r from-[#fffaf0] to-white px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A8841C]">Cotizacion activa</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-3xl font-bold text-on-surface">
                      {formatShortId(cotizacion.id, 'COT-')}
                    </h3>
                    <StatusBadge type="quote" status={quoteStatus} size="md" />
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Version vigente del evento. Ajusta precios aqui; cantidades y contenido se corrigen en menu o
                    montaje.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#A8841C]/20 bg-white px-5 py-4 text-right shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Total actual</p>
                  <p className="mt-1 font-display text-3xl font-bold text-on-surface">{formatCurrency(adjustedTotal)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-3">
              <div className="border-b border-outline-variant/20 px-6 py-4 md:border-b-0 md:border-r">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Base calculada</p>
                <p className="mt-1 font-display text-xl font-bold text-on-surface">{formatCurrency(baseTotal)}</p>
              </div>
              <div className="border-b border-outline-variant/20 px-6 py-4 md:border-b-0 md:border-r">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Descuento</p>
                <p className="mt-1 font-display text-xl font-bold text-on-surface">{formatCurrency(discountTotal)}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Ajuste neto</p>
                <p className={`mt-1 font-display text-xl font-bold ${deltaTotal >= 0 ? 'text-[#A8841C]' : 'text-green-text'}`}>
                  {deltaTotal >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(deltaTotal))}
                </p>
              </div>
            </div>
          </div>

          {!canEditPrices && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Esta cotizacion esta en estado <strong>{cotizacion.estado}</strong>. Los precios ya no se editan sobre
              esta version.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 px-6 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8841C]">Items</p>
                <h4 className="mt-1 font-display text-xl font-bold text-on-surface">Detalle economico</h4>
              </div>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-600">
                {quoteItems.length} item{quoteItems.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="bg-[#f6f1e5] text-xs uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-6 py-3">Concepto</th>
                    <th className="px-4 py-3">Origen</th>
                    <th className="px-4 py-3">Cobro</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Precio base</th>
                    <th className="px-4 py-3 text-right">Precio aplicado</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {quoteItems.map((item) => {
                    const hasAdjustment = item.unitAdjustedPrice !== item.unitBasePrice;

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-[#fffbf1]">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-on-surface">{item.concept}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                            {sourceLabel(item.source)}
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
                            className={`w-28 rounded-md border px-2 py-1.5 text-right text-sm font-semibold ${
                              canEditPrices
                                ? 'bg-surface-container-low'
                                : 'cursor-not-allowed bg-surface-container text-on-surface-variant'
                            } ${hasAdjustment ? 'border-[#A8841C]/70 text-[#7a5c09]' : 'border-outline-variant/40'}`}
                            type="number"
                            min={0}
                            step={1000}
                            max={999999999}
                            inputMode="numeric"
                            value={numberInputValue(item.unitAdjustedPrice)}
                            onFocus={selectInputText}
                            disabled={!canEditPrices}
                            onChange={(eventTarget) =>
                              updateAdjustedPrice(
                                item.id,
                                toLimitedNumber(eventTarget.target.value, FORM_LIMITS.moneyDigits),
                              )
                            }
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

          <div className="rounded-2xl border border-border bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8841C]">Pago inicial</p>
                <h4 className="mt-1 font-display text-xl font-bold text-on-surface">Condiciones de anticipo</h4>
              </div>
              <div className="grid w-full grid-cols-1 gap-4 md:w-auto md:grid-cols-3 md:items-end">
                <div>
                  <label className="mb-2 block text-xs font-bold text-neutral-700">Anticipo (%)</label>
                  <input
                    className="w-full rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-2.5 text-sm"
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={numberInputValue(advancePercent)}
                    onFocus={selectInputText}
                    onChange={(eventTarget) => {
                      const normalized = toLimitedNumber(eventTarget.target.value, FORM_LIMITS.percentDigits);
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
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[92px]">
          <div className="rounded-2xl border border-border bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8841C]">Contenido</p>
            <h4 className="mt-1 font-display text-lg font-bold text-on-surface">Resumen cotizado</h4>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Menu</p>
                <div className="mt-2 space-y-2">
                  {menuItems.length > 0 ? (
                    menuItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                        <p className="text-sm font-bold text-on-surface">{item.concept}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.quantity} pax - {formatCurrency(item.unitAdjustedPrice)} c/u
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">Sin items de menu.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Montaje</p>
                <div className="mt-2 space-y-2">
                  {montageItems.length > 0 ? (
                    montageItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                        <p className="text-sm font-bold text-on-surface">{item.concept}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.pricingMode === 'unidad' ? `x${item.quantity}` : '1 servicio'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">Sin items de montaje.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {eventId && (
            <QuoteHistoryPanel
              eventId={eventId}
              quotes={historial}
              selectedQuoteId={cotizacion.id}
              variant="compact"
            />
          )}
        </aside>
      </div>

      <footer className="fixed bottom-0 right-0 z-[60] flex w-full items-center justify-between border-t border-surface-container bg-surface-container-lowest/90 px-6 py-4 backdrop-blur-md md:w-[calc(100%-16rem)]">
        <div className="hidden items-center gap-2 text-on-secondary-container lg:flex">
          <span className="material-symbols-outlined text-lg text-[#A8841C]">request_quote</span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Ajusta precios, genera documento, envia y acepta cuando el cliente confirme
          </p>
        </div>
        <div className="flex w-full flex-wrap justify-end gap-3 lg:w-auto">
          {isDraft ? (
            <button
              className="rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={handleGenerarCotizacion}
              disabled={isReadOnly || saving}
              title="Genera el documento descargable de esta cotizacion."
            >
              Generar cotizacion
            </button>
          ) : (
            <button
              className="rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={handleGenerarNuevaVersion}
              disabled={isReadOnly || saving || !reservaRaizId}
              title={newVersionHelp}
            >
              Nueva version por cambios
            </button>
          )}

          <button
            className="rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => handleDescargarDocumento('xlsx')}
            disabled={saving || cotizacion.estado === 'BORRADOR'}
            title={cotizacion.estado === 'BORRADOR' ? 'Primero genera la cotizacion para descargar el Excel.' : 'Descargar reporte Excel estructurado.'}
          >
            Descargar Excel
          </button>

          <button
            className="rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => handleDescargarDocumento('pdf')}
            disabled={saving || cotizacion.estado === 'BORRADOR'}
            title={cotizacion.estado === 'BORRADOR' ? 'Primero genera la cotizacion para descargar el PDF.' : 'Descargar cotizacion formal en PDF.'}
          >
            Descargar PDF
          </button>

          <button
            className="rounded-md border border-green-text/40 px-5 py-2.5 text-sm font-semibold text-green-text transition-colors hover:bg-green-bg disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={handleEnviarCotizacion}
            disabled={isReadOnly || saving || cotizacion.estado !== 'GENERADA'}
            title={cotizacion.estado !== 'GENERADA' ? 'Solo una cotizacion generada puede marcarse como enviada.' : 'Marcar esta cotizacion como enviada al cliente.'}
          >
            Marcar enviada
          </button>

          <button
            className="rounded-md border border-blue-300 px-5 py-2.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={handleEnviarEmail}
            disabled={isReadOnly || saving || !['GENERADA', 'ENVIADA', 'ACEPTADA'].includes(cotizacion.estado)}
            title="Programa el envio por correo al cliente con PDF y Excel adjuntos."
          >
            Enviar email
          </button>

          <button
            className="rounded-md bg-[#A8841C] px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-[#8d6f15] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={handleAceptarCotizacion}
            disabled={isReadOnly || saving || !['GENERADA', 'ENVIADA'].includes(cotizacion.estado)}
            title={acceptQuoteHelp}
          >
            Aceptar cotizacion
          </button>
        </div>
      </footer>
    </section>
  );
};

export default EventQuotePage;
