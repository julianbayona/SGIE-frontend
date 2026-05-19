import React, { useEffect, useMemo, useState } from 'react';
import QuotesHeader from '@/features/quotes/components/QuotesHeader';
import QuotesTable from '@/features/quotes/components/QuotesTable';
import QuotesTablePagination from '@/features/quotes/components/QuotesTablePagination';
import eventosApi from '@/api/eventos';
import clientesApi from '@/api/clientes';
import catalogosApi from '@/api/catalogos';
import cotizacionesApi from '@/api/cotizaciones';
import type { QuoteRecord, QuoteStatus, QuotesTab } from '@/features/quotes/types';
import type { EstadoCotizacion } from '@/api/types';
import { formatShortId } from '@/utils/formatters';
import { paginate } from '@/utils/pagination';

const estadoMap: Record<EstadoCotizacion, QuoteStatus> = {
  BORRADOR: 'Borrador',
  GENERADA: 'Generada',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  DESACTUALIZADA: 'Desactualizada',
};

const pendingStatusRank: Partial<Record<QuoteStatus, number>> = {
  Enviada: 0,
  Generada: 1,
  Borrador: 2,
  Desactualizada: 3,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const PAGE_SIZE = 7;

const QuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QuotesTab>('Recientes');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const eventos = await eventosApi.listar();
        const [clientes, tiposEvento] = await Promise.all([
          clientesApi.listar(),
          catalogosApi.listarTiposEvento(),
        ]);
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

            return cotizaciones.map((cotizacion) => ({
              id: cotizacion.id,
              eventId: evento.id,
              sortDate: evento.fechaHoraInicio,
              eventName: `${tipoEvento?.nombre ?? 'Evento'} - ${new Date(evento.fechaHoraInicio).toLocaleDateString('es-CO')}`,
              eventMeta: formatShortId(evento.id, 'EV-'),
              customerName: cliente?.nombreCompleto ?? 'Cliente desconocido',
              customerType: cliente?.tipoCliente === 'SOCIO' ? 'Socio' : 'No Socio',
              createdAt: cotizacion.vigente ? 'Vigente' : `Histórica ${formatShortId(cotizacion.reservaId, 'RES-')}`,
              totalValue: formatCurrency(Number(cotizacion.valorTotal)),
              status: estadoMap[cotizacion.estado],
            }));
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
    const filtered = quotes.filter((quote) => {
      if (activeTab === 'Aprobadas') return quote.status === 'Aceptada';
      if (activeTab === 'Pendientes') return ['Enviada', 'Generada', 'Borrador', 'Desactualizada'].includes(quote.status);
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (activeTab === 'Pendientes') {
        const statusDiff = (pendingStatusRank[a.status] ?? 99) - (pendingStatusRank[b.status] ?? 99);
        if (statusDiff !== 0) return statusDiff;
      }

      return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
    });
  }, [activeTab, quotes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const pagination = useMemo(() => paginate(visibleQuotes, currentPage, PAGE_SIZE), [currentPage, visibleQuotes]);

  return (
    <section className="space-y-6">
      <QuotesHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-lg overflow-hidden shadow-sm border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
            Cargando cotizaciones...
          </div>
        ) : visibleQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant text-sm gap-2">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
            <p>No hay cotizaciones registradas.</p>
          </div>
        ) : (
          <QuotesTable quotes={pagination.items} />
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
