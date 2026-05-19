import React from 'react';
import { Link } from 'react-router-dom';

import type { CotizacionResponse, EstadoCotizacion } from '@/api/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { QuoteStatus } from '@/features/quotes/types';
import { formatShortId } from '@/utils/formatters';

interface QuoteHistoryPanelProps {
  eventId: string;
  quotes: CotizacionResponse[];
  selectedQuoteId?: string | null;
  variant?: 'default' | 'compact';
}

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

const QuoteHistoryPanel: React.FC<QuoteHistoryPanelProps> = ({
  eventId,
  quotes,
  selectedQuoteId,
  variant = 'default',
}) => {
  if (quotes.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <section className="rounded-lg border border-border bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Historial</p>
            <h4 className="mt-1 font-display text-lg font-bold text-on-surface">Versiones anteriores</h4>
          </div>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-600">
            {quotes.length}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {quotes.map((quote, index) => {
            const versionNumber = quotes.length - index;
            const isSelected = quote.id === selectedQuoteId;

            return (
              <Link
                key={quote.id}
                to={`/events/${eventId}/cotizaciones/${quote.id}`}
                className={`block rounded-lg border px-3 py-3 transition-colors ${
                  isSelected
                    ? 'border-[#A8841C]/60 bg-[#fbf7eb]'
                    : 'border-stone-200 bg-white hover:border-[#A8841C]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-on-surface">Versión {versionNumber}</p>
                      {quote.vigente ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Vigente
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-on-surface-variant">
                      {formatShortId(quote.id, 'COT-')}
                    </p>
                  </div>
                  <StatusBadge type="quote" status={estadoMap[quote.estado]} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="font-display text-base font-bold text-on-surface">
                    {formatCurrency(Number(quote.valorTotal))}
                  </p>
                  <span className="text-xs font-bold text-[#A8841C]">Ver</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Versiones</p>
          <h3 className="mt-1 font-display text-xl font-bold text-on-surface">Historial de cotizaciones</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Cada versión conserva sus propios ítems y valores para consulta histórica.
          </p>
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-stone-600">
          {quotes.length} versión{quotes.length === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {quotes.map((quote, index) => {
          const versionNumber = quotes.length - index;
          const isSelected = quote.id === selectedQuoteId;

          return (
            <article
              key={quote.id}
              className={`rounded-xl border p-4 transition-colors ${
                isSelected
                  ? 'border-[#A8841C]/60 bg-[#fbf7eb]'
                  : 'border-stone-200 bg-white hover:border-[#A8841C]/40'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-on-surface">Versión {versionNumber}</p>
                    {quote.vigente ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Vigente
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Histórica
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">{formatShortId(quote.id, 'COT-')}</p>
                </div>
                <StatusBadge type="quote" status={estadoMap[quote.estado]} />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Valor total</p>
                  <p className="mt-1 font-display text-lg font-bold text-on-surface">
                    {formatCurrency(Number(quote.valorTotal))}
                  </p>
                </div>
                <Link
                  to={`/events/${eventId}/cotizaciones/${quote.id}`}
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition-colors hover:border-[#A8841C] hover:text-[#A8841C]"
                >
                  {isSelected ? 'Viendo detalle' : 'Ver detalle'}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default QuoteHistoryPanel;
