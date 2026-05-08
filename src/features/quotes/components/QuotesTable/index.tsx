import React from 'react';
import QuoteTableRow from '@/features/quotes/components/QuoteTableRow';
import type { QuoteRecord } from '@/features/quotes/types';

interface QuotesTableProps {
  quotes: QuoteRecord[];
}

const QuotesTable: React.FC<QuotesTableProps> = ({ quotes }) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-stone-50/70 border-b border-border">
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">ID</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Evento</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Cliente</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Creación</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Valor total</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Estado</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3 text-right">Acciones</th>
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
