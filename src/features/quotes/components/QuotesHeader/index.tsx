import React from 'react';
import PageTitle from '@/components/ui/PageTitle';
import type { QuotesTab } from '@/features/quotes/types';

interface QuotesHeaderProps {
  activeTab: QuotesTab;
  onTabChange: (tab: QuotesTab) => void;
}

const tabs: QuotesTab[] = ['Recientes', 'Pendientes', 'Aprobadas'];

const QuotesHeader: React.FC<QuotesHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <PageTitle
      eyebrow="Gestion comercial"
      title="Cotizaciones"
      description="Seguimiento economico de eventos y propuestas enviadas al cliente."
      actions={
        <>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-black text-stone-700 transition-colors hover:bg-stone-50"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filtros
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-black text-stone-700 transition-colors hover:bg-stone-50"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar
          </button>
        </>
      }
    >
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`rounded-full border px-3 py-1.5 text-xs font-black transition-colors ${
                isActive
                  ? 'border-[#A8841C] bg-[#A8841C] text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-[#A8841C] hover:text-[#A8841C]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>
    </PageTitle>
  );
};

export default QuotesHeader;
