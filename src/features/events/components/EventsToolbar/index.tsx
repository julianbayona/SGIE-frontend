import React from 'react';
import type { EventsTab } from '@/features/events/types';

interface EventsToolbarProps {
  activeTab: EventsTab;
  onTabChange: (tab: EventsTab) => void;
}

const tabs: EventsTab[] = ['Todos', 'Activos', 'Pendientes', 'Confirmados', 'Cancelados'];

const EventsToolbar: React.FC<EventsToolbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="p-5 pb-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-border">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`pb-4 border-b-2 text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-gold text-gold font-bold'
                    : 'border-transparent text-text3 hover:text-gold'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="ml-auto pb-3 flex items-center gap-2">
          <button
            type="button"
            className="p-2 bg-panel text-text2 rounded flex items-center gap-2 text-xs font-semibold hover:bg-hover transition-colors"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsToolbar;
