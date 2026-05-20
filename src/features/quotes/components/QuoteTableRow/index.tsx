import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { QuoteRecord } from '@/features/quotes/types';
import { formatShortId } from '@/utils/formatters';

interface QuoteTableRowProps {
  quote: QuoteRecord;
}

const QuoteTableRow: React.FC<QuoteTableRowProps> = ({ quote }) => {
  const isMember = quote.customerType === 'Socio';

  return (
    <tr className="transition-colors hover:bg-[#fbf7eb]/60">
      <td className="px-6 py-5">
        <div className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-black tracking-wide text-text1">
          {formatShortId(quote.id, 'COT-')}
        </div>
        <p className="mt-2 text-xs font-semibold text-text3">
          {quote.isCurrent ? 'Version vigente' : 'Version historica'}
        </p>
      </td>

      <td className="px-6 py-5">
        <p className="text-sm font-black text-text1">{quote.eventName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-text3">
          <span>{quote.eventMeta}</span>
          <span className="text-stone-300">-</span>
          <span>{quote.eventDateLabel}</span>
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-[#f3ead4] text-xs font-black text-[#8a6a13]">
            {quote.customerName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text1">{quote.customerName}</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isMember ? 'bg-green-bg text-green-text' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {quote.customerType}
            </span>
          </div>
        </div>
      </td>

      <td className="px-6 py-5 text-sm font-semibold text-text2">{quote.createdAt}</td>
      <td className="px-6 py-5">
        <p className="font-display text-lg font-black text-text1">{quote.totalValue}</p>
      </td>

      <td className="px-6 py-5">
        <StatusBadge type="quote" status={quote.status} />
      </td>

      <td className="px-6 py-5 text-right">
        <div className="flex justify-end gap-2">
          <Link
            to={`/events/${quote.eventId}/cotizacion`}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-black text-text2 transition-colors hover:border-[#A8841C] hover:text-[#A8841C]"
          >
            Abrir evento
          </Link>
          <Link
            to={`/events/${quote.eventId}/cotizaciones/${quote.id}`}
            className="rounded-lg bg-[#A8841C] px-3 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#7A5E10]"
          >
            Ver detalle
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default QuoteTableRow;
