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

  const orderedQuotes = quotes;

  if (variant === 'compact') {
    return (
      <section className="rounded-2xl border border-border bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8841C]">Historial</p>
            <h4 className="mt-1 font-display text-lg font-bold text-on-surface">Versiones de cotizacion</h4>
          </div>
          <span className="rounded-full border border-[#A8841C]/25 bg-[#fff8e4] px-2.5 py-1 text-[11px] font-black text-[#7a5c09]">
            {orderedQuotes.length} version{orderedQuotes.length === 1 ? '' : 'es'}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {orderedQuotes.map((quote, index) => {
            const versionNumber = orderedQuotes.length - index;
            const isSelected = quote.id === selectedQuoteId;

            return (
              <Link
                key={quote.id}
                to={`/events/${eventId}/cotizaciones/${quote.id}`}
                className={`group block rounded-xl border px-3.5 py-3 transition-colors ${
                  isSelected
                    ? 'border-[#A8841C]/70 bg-[#fbf4df]'
                    : 'border-stone-200 bg-white hover:border-[#A8841C]/45 hover:bg-[#fffbf1]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${
                        isSelected ? 'bg-[#A8841C] text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      V{versionNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-on-surface">
                          {formatCurrency(Number(quote.valorTotal))}
                        </p>
                        {quote.vigente ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Vigente
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                        {formatShortId(quote.id, 'COT-')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge type="quote" status={estadoMap[quote.estado]} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 px-6 py-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A8841C]">Versiones</p>
          <h3 className="mt-1 font-display text-xl font-bold text-on-surface">Historial de cotizaciones</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Cada version conserva sus items y valores originales para trazabilidad.
          </p>
        </div>
        <span className="rounded-full border border-[#A8841C]/25 bg-[#fff8e4] px-3 py-1 text-xs font-black text-[#7a5c09]">
          {orderedQuotes.length} version{orderedQuotes.length === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/20 border-t border-outline-variant/20">
        {orderedQuotes.map((quote, index) => {
          const versionNumber = orderedQuotes.length - index;
          const isSelected = quote.id === selectedQuoteId;

          return (
            <Link
              key={quote.id}
              to={`/events/${eventId}/cotizaciones/${quote.id}`}
              className={`grid gap-4 px-6 py-4 transition-colors md:grid-cols-[160px_minmax(0,1fr)_190px_110px] md:items-center ${
                isSelected ? 'bg-[#fbf4df]' : 'bg-white hover:bg-[#fffbf1]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full text-xs font-black ${
                    isSelected ? 'bg-[#A8841C] text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  V{versionNumber}
                </span>
                <div>
                  <p className="text-sm font-black text-on-surface">Version {versionNumber}</p>
                  <p className="text-xs text-on-surface-variant">{formatShortId(quote.id, 'COT-')}</p>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Total cotizado</p>
                <p className="mt-1 truncate font-display text-lg font-bold text-on-surface">
                  {formatCurrency(Number(quote.valorTotal))}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="quote" status={estadoMap[quote.estado]} />
                {quote.vigente ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Vigente
                  </span>
                ) : null}
              </div>

              <span className="text-sm font-black text-[#A8841C] md:text-right">
                {isSelected ? 'Viendo' : 'Ver detalle'}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuoteHistoryPanel;
