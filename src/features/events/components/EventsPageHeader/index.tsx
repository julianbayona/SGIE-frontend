import React from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '@/components/ui/PageTitle';
import type { EventsTab } from '@/features/events/types';

interface EventsPageHeaderProps {
  activeTab: EventsTab;
  onTabChange: (tab: EventsTab) => void;
}

const tabs: EventsTab[] = ['Todos', 'Activos', 'Pendientes', 'Confirmados', 'Cancelados'];

const EventsPageHeader: React.FC<EventsPageHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <PageTitle
      eyebrow="Gestion operativa"
      title="Gestion de eventos"
      description="Seguimiento del flujo cliente, menu, cotizacion, anticipo y confirmacion."
      actions={
        <Link
          to="/events/request"
          className="flex items-center gap-2 rounded-xl bg-[#A8841C] px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-[#7A5E10] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Crear solicitud
        </Link>
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

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-black text-stone-600 transition-colors hover:border-[#A8841C] hover:text-[#A8841C]"
        >
          <span className="material-symbols-outlined text-base">tune</span>
          Filtros
        </button>
      </nav>
    </PageTitle>
  );
};

export default EventsPageHeader;
