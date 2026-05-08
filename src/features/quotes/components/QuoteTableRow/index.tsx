import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { QuoteRecord } from '@/features/quotes/types';
import { formatShortId } from '@/utils/formatters';

interface QuoteTableRowProps {
  quote: QuoteRecord;
}

const QuoteTableRow: React.FC<QuoteTableRowProps> = ({ quote }) => {
  const isMember = quote.customerType === 'Socio';

  return (
    <tr className="hover:bg-stone-50/70 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-text1">{formatShortId(quote.id, 'COT-')}</p>
        <p className="text-xs text-text3">Cotización</p>
      </td>

      <td className="px-6 py-4">
        <p className="text-sm font-bold text-text1">{quote.eventName}</p>
        <p className="text-xs text-text3">{formatShortId(quote.eventMeta, 'EV-')}</p>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text1">{quote.customerName}</span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
              isMember ? 'bg-green-bg text-green-text' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {quote.customerType}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 text-sm text-text2 font-medium">{quote.createdAt}</td>
      <td className="px-6 py-4 text-sm font-bold text-text1">{quote.totalValue}</td>

      <td className="px-6 py-4">
        <StatusBadge type="quote" status={quote.status} />
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded border border-border text-xs font-semibold text-text2 hover:bg-panel hover:text-gold transition-colors"
          >
            Ver cotización
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-panel rounded text-text3 hover:text-gold transition-colors"
            title="Más acciones"
          >
            <span className="material-symbols-outlined text-lg">more_horiz</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default QuoteTableRow;
