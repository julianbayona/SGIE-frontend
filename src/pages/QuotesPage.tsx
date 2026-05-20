import React, { useEffect, useMemo, useState } from 'react';
import QuotesHeader from '@/features/quotes/components/QuotesHeader';
import QuotesTable from '@/features/quotes/components/QuotesTable';
import QuotesTablePagination from '@/features/quotes/components/QuotesTablePagination';
import eventosApi from '@/api/eventos';
import clientesApi from '@/api/clientes';
import catalogosApi from '@/api/catalogos';
import cotizacionesApi from '@/api/cotizaciones';
import type { QuoteRecord, QuoteStatus } from '@/features/quotes/types';
import type { EstadoCotizacion } from '@/api/types';
import { formatShortId } from '@/utils/formatters';
import { paginate } from '@/utils/pagination';
import { FORM_LIMITS, limitDecimalNumber } from '@/utils/formLimits';

const estadoMap: Record<EstadoCotizacion, QuoteStatus> = {
  BORRADOR: 'Borrador',
  GENERADA: 'Generada',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  DESACTUALIZADA: 'Desactualizada',
};

const statusRank: Partial<Record<QuoteStatus, number>> = {
  Aceptada: 0,
  Enviada: 0,
  Generada: 1,
  Borrador: 2,
  Desactualizada: 3,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const PAGE_SIZE = 7;
const quoteStatuses: Array<'TODOS' | QuoteStatus> = [
  'TODOS',
  'Borrador',
  'Generada',
  'Enviada',
  'Aceptada',
  'Rechazada',
  'Desactualizada',
];

const QuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | QuoteStatus>('TODOS');
  const [versionFilter, setVersionFilter] = useState<'TODAS' | 'VIGENTES' | 'HISTORICAS'>('TODAS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const eventos = await eventosApi.listar();
        const [clientes, tiposEvento] = await Promise.all([clientesApi.listar(), catalogosApi.listarTiposEvento()]);
        const clientesMap = new Map(clientes.map((cliente) => [cliente.id, cliente]));
        const tiposEventoMap = new Map(tiposEvento.map((tipo) => [tipo.id, tipo]));

        const cotizacionesPorEvento = await Promise.all(
          eventos.map(async (evento) => ({
            evento,
            cotizaciones: await cotizacionesApi.listarPorEvento(evento.id).catch(() => []),
          })),
        );

        if (cancelled) return;

        setQuotes(
          cotizacionesPorEvento.flatMap(({ evento, cotizaciones }) => {
            const cliente = clientesMap.get(evento.clienteId);
            const tipoEvento = tiposEventoMap.get(evento.tipoEventoId);
            const eventDate = new Date(evento.fechaHoraInicio);

            return cotizaciones.map((cotizacion) => {
              const status = estadoMap[cotizacion.estado];
              const rawTotalValue = Number(cotizacion.valorTotal);

              return {
                id: cotizacion.id,
                eventId: evento.id,
                sortDate: evento.fechaHoraInicio,
                eventName: tipoEvento?.nombre ?? 'Evento',
                eventMeta: formatShortId(evento.id, 'EV-'),
                eventDateLabel: eventDate.toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
                customerName: cliente?.nombreCompleto ?? 'Cliente desconocido',
                customerType: cliente?.tipoCliente === 'SOCIO' ? 'Socio' : 'No Socio',
                createdAt: cotizacion.vigente ? 'Vigente' : `Historica ${formatShortId(cotizacion.reservaId, 'RES-')}`,
                isCurrent: cotizacion.vigente,
                rawTotalValue,
                totalValue: formatCurrency(rawTotalValue),
                status,
              };
            });
          }),
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar cotizaciones.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleQuotes = useMemo(() => {
    const query = normalize(searchQuery.trim());
    const min = minValue ? Number(minValue) : null;
    const max = maxValue ? Number(maxValue) : null;
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    const filtered = quotes.filter((quote) => {
      if (statusFilter !== 'TODOS' && quote.status !== statusFilter) return false;
      if (versionFilter === 'VIGENTES' && !quote.isCurrent) return false;
      if (versionFilter === 'HISTORICAS' && quote.isCurrent) return false;

      const quoteTime = new Date(quote.sortDate).getTime();
      if (fromTime !== null && quoteTime < fromTime) return false;
      if (toTime !== null && quoteTime > toTime) return false;
      if (min !== null && Number.isFinite(min) && quote.rawTotalValue < min) return false;
      if (max !== null && Number.isFinite(max) && quote.rawTotalValue > max) return false;

      if (!query) return true;

      const searchable = normalize(
        [
          quote.id,
          quote.eventId,
          quote.eventName,
          quote.eventMeta,
          quote.eventDateLabel,
          quote.customerName,
          quote.customerType,
          quote.createdAt,
          quote.status,
          quote.totalValue,
        ].join(' '),
      );

      return searchable.includes(query);
    });

    return [...filtered].sort((a, b) => {
      const statusDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
    });
  }, [dateFrom, dateTo, maxValue, minValue, quotes, searchQuery, statusFilter, versionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, maxValue, minValue, searchQuery, statusFilter, versionFilter]);

  const pagination = useMemo(() => paginate(visibleQuotes, currentPage, PAGE_SIZE), [currentPage, visibleQuotes]);
  const activeFilterCount = [
    searchQuery.trim(),
    statusFilter !== 'TODOS',
    versionFilter !== 'TODAS',
    dateFrom,
    dateTo,
    minValue,
    maxValue,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('TODOS');
    setVersionFilter('TODAS');
    setDateFrom('');
    setDateTo('');
    setMinValue('');
    setMaxValue('');
  };

  return (
    <section className="space-y-6">
      <QuotesHeader />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-black text-stone-950">Listado de cotizaciones</h2>
              <p className="mt-1 text-xs font-semibold text-stone-500">
                {activeFilterCount > 0
                  ? `${visibleQuotes.length} resultado(s) con ${activeFilterCount} filtro(s) activo(s).`
                  : 'Ordenadas por fecha del evento y prioridad del estado.'}
              </p>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-black text-stone-600 transition-colors hover:border-[#A8841C] hover:text-[#A8841C]"
              >
                Limpiar filtros ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.9fr_0.9fr_0.8fr_0.8fr_0.75fr_0.75fr]">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Busqueda</span>
              <input
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-semibold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                placeholder="Cliente, evento o codigo"
                value={searchQuery}
                maxLength={FORM_LIMITS.mediumText}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Estado</span>
              <select
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-bold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'TODOS' | QuoteStatus)}
              >
                {quoteStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'TODOS' ? 'Todos los estados' : status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Version</span>
              <select
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-bold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                value={versionFilter}
                onChange={(event) => setVersionFilter(event.target.value as 'TODAS' | 'VIGENTES' | 'HISTORICAS')}
              >
                <option value="TODAS">Todas</option>
                <option value="VIGENTES">Solo vigentes</option>
                <option value="HISTORICAS">Solo historicas</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Desde</span>
              <input
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-semibold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Hasta</span>
              <input
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-semibold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Minimo</span>
              <input
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-semibold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                inputMode="numeric"
                placeholder="$ 0"
                value={minValue}
                onChange={(event) => setMinValue(limitDecimalNumber(event.target.value, FORM_LIMITS.moneyDigits))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Maximo</span>
              <input
                className="h-10 w-full rounded-xl border border-stone-300 bg-[#fbfaf7] px-3 text-sm font-semibold outline-none transition focus:border-[#A8841C] focus:bg-white focus:ring-2 focus:ring-[#A8841C]/10"
                inputMode="numeric"
                placeholder="$"
                value={maxValue}
                onChange={(event) => setMaxValue(limitDecimalNumber(event.target.value, FORM_LIMITS.moneyDigits))}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-on-surface-variant">
            Cargando cotizaciones...
          </div>
        ) : visibleQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
            <p>{searchQuery.trim() ? 'No hay coincidencias con la busqueda.' : 'No hay cotizaciones registradas.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <QuotesTable quotes={pagination.items} />
          </div>
        )}

        <QuotesTablePagination
          entityLabel="cotizaciones"
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

export default QuotesPage;
