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
import EventDetailHeaderTabs from '@/features/events/components/EventDetailHeaderTabs';
import { buildEventSummaryData } from '@/features/events/data/eventSummary';
import QuoteHistoryPanel from '@/features/quotes/components/QuoteHistoryPanel';
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

const sourceLabel = (tipoConcepto: string): string => {
  if (tipoConcepto.includes('SALON') || tipoConcepto.includes('ALQUILER')) return 'Salon';
  if (tipoConcepto.includes('MENU') || tipoConcepto.includes('PLATO')) return 'Menu';
  return 'Montaje';
};

const chargeLabel = (tipoConcepto: string, cantidad: number): string => {
  if (tipoConcepto.includes('SALON') || tipoConcepto.includes('ALQUILER')) return 'Por servicio';
  if (tipoConcepto.includes('ADICIONAL') && cantidad === 1) return 'Por servicio';
  return 'Por unidad';
};

const EventQuoteDetailPage: React.FC = () => {
  const { eventId, quoteId } = useParams();
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null);
  const [historial, setHistorial] = useState<CotizacionResponse[]>([]);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);
  const [salon, setSalon] = useState<SalonResponse | null>(null);
  const [tipoEvento, setTipoEvento] = useState<CatalogoBasicoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !quoteId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [eventoData, cotizacionData, historialData] = await Promise.all([
          eventosApi.obtenerPorId(eventId),
          cotizacionesApi.obtenerPorId(quoteId),
          cotizacionesApi.listarPorEvento(eventId),
        ]);

        if (cancelled) return;

        setEvento(eventoData);
        setCotizacion(cotizacionData);
        setHistorial(historialData);

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
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el detalle de la cotizacion.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, quoteId]);

  const event = useMemo(
    () =>
      buildEventSummaryData({
        evento,
        eventId,
        cliente,
        salon,
        tipoEvento,
        totalQuote: cotizacion ? formatCurrency(Number(cotizacion.valorTotal)) : '$0',
      }),
    [cliente, cotizacion, evento, eventId, salon, tipoEvento],
  );

  const subtotal = Number(cotizacion?.valorSubtotal ?? 0);
  const discount = Number(cotizacion?.descuento ?? 0);
  const total = Number(cotizacion?.valorTotal ?? 0);
  const ajuste = total - subtotal;
  const menuItems = cotizacion?.items.filter((item) => sourceLabel(item.tipoConcepto) === 'Menu') ?? [];
  const montajeItems = cotizacion?.items.filter((item) => sourceLabel(item.tipoConcepto) === 'Montaje') ?? [];

  if (loading) {
    return (
      <section className="space-y-8 pb-16">
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          Cargando detalle de cotizacion...
        </div>
      </section>
    );
  }

  if (error || !cotizacion) {
    return (
      <section className="space-y-8 pb-16">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Cotizacion no encontrada.'}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 pb-16">
      <EventDetailHeaderTabs event={event} activeTab="cotizacion" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A8841C]">
            {cotizacion.vigente ? 'Version vigente' : 'Version historica'}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-on-surface">
            Cotizacion {formatShortId(cotizacion.id, 'COT-')}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/events/${eventId}/cotizacion`}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition-colors hover:border-[#A8841C] hover:text-[#A8841C]"
          >
            Volver al evento
          </Link>
          <Link
            to="/quotes"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition-colors hover:border-[#A8841C] hover:text-[#A8841C]"
          >
            Todas las cotizaciones
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-[#A8841C]/25 bg-surface-container-lowest shadow-sm">
            <div className="border-b border-[#A8841C]/15 bg-gradient-to-r from-[#fffaf0] to-white px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-2xl font-bold text-on-surface">
                      {formatShortId(cotizacion.id, 'COT-')}
                    </h3>
                    <StatusBadge type="quote" status={estadoMap[cotizacion.estado]} size="md" />
                    {cotizacion.vigente ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                        Vigente
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Reserva asociada {formatShortId(cotizacion.reservaId, 'RES-')} - lectura historica de items y
                    valores.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#A8841C]/20 bg-white px-5 py-4 text-right shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Total cotizado</p>
                  <p className="mt-1 font-display text-3xl font-bold text-on-surface">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-4">
              <div className="border-b border-outline-variant/20 px-6 py-4 md:border-b-0 md:border-r">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Subtotal</p>
                <p className="mt-1 font-display text-lg font-bold text-on-surface">{formatCurrency(subtotal)}</p>
              </div>
              <div className="border-b border-outline-variant/20 px-6 py-4 md:border-b-0 md:border-r">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Descuento</p>
                <p className="mt-1 font-display text-lg font-bold text-on-surface">{formatCurrency(discount)}</p>
              </div>
              <div className="border-b border-outline-variant/20 px-6 py-4 md:border-b-0 md:border-r">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Ajuste</p>
                <p className={`mt-1 font-display text-lg font-bold ${ajuste >= 0 ? 'text-[#A8841C]' : 'text-green-text'}`}>
                  {ajuste >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(ajuste))}
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Items</p>
                <p className="mt-1 font-display text-lg font-bold text-on-surface">
                  {cotizacion.items.length} item{cotizacion.items.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant/20 px-6 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8841C]">Documento</p>
              <h3 className="mt-1 font-display text-xl font-bold text-on-surface">Contenido de la cotizacion</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
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
                  {cotizacion.items.map((item) => {
                    const appliedPrice = Number(item.precioOverride ?? item.precioBase);
                    const charge = chargeLabel(item.tipoConcepto, item.cantidad);

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-[#fffbf1]">
                        <td className="px-6 py-4 font-semibold text-on-surface">{item.descripcion}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                            {sourceLabel(item.tipoConcepto)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{charge}</td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-on-surface">
                          {charge === 'Por servicio' ? '1 servicio' : item.cantidad}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-on-surface-variant">
                          {formatCurrency(Number(item.precioBase))}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-on-surface">
                          {formatCurrency(appliedPrice)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-on-surface">
                          {formatCurrency(Number(item.subtotal))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[92px]">
          <div className="rounded-2xl border border-border bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8841C]">Resumen</p>
            <h3 className="mt-1 font-display text-lg font-bold text-on-surface">Lectura rapida</h3>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Menu</p>
                <p className="mt-1 text-sm font-bold text-on-surface">
                  {menuItems.length} item{menuItems.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Montaje</p>
                <p className="mt-1 text-sm font-bold text-on-surface">
                  {montajeItems.length} item{montajeItems.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Observaciones</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {cotizacion.observaciones?.trim() || 'Sin observaciones registradas.'}
                </p>
              </div>
            </div>
          </div>

          <QuoteHistoryPanel
            eventId={eventId ?? ''}
            quotes={historial}
            selectedQuoteId={cotizacion.id}
            variant="compact"
          />
        </aside>
      </div>
    </section>
  );
};

export default EventQuoteDetailPage;
