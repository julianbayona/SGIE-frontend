import React from 'react';
import QuoteTableRow from '@/features/quotes/components/QuoteTableRow';
import type { QuoteRecord } from '@/features/quotes/types';

interface QuotesTableProps {
  quotes: QuoteRecord[];
}

const QuotesTable: React.FC<QuotesTableProps> = ({ quotes }) => {
  return (
    <table className="w-full min-w-[1060px] border-collapse text-left">
      <thead>
        <tr className="border-b border-border bg-[#f8f3e8]">
          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text3">ID</th>
          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text3">Evento</th>
          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text3">Cliente</th>
          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text3">Version</th>
          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text3">Valor total</th>
          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text3">Estado</th>
          <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-text3">
            Acciones
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-stone-100">
        {quotes.map((quote) => (
          <QuoteTableRow key={quote.id} quote={quote} />
        ))}
      </tbody>
    </table>
  );
};

export default QuotesTable;
