import React from 'react';
import PageTitle from '@/components/ui/PageTitle';
import type { ClientsTab } from '@/features/clients/types';

interface ClientsHeaderProps {
  activeTab: ClientsTab;
  searchQuery: string;
  onTabChange: (tab: ClientsTab) => void;
  onSearchChange: (value: string) => void;
  onCreateClient: () => void;
}

const tabs: ClientsTab[] = ['Todos', 'Socios', 'No Socios'];

const ClientsHeader: React.FC<ClientsHeaderProps> = ({
  activeTab,
  searchQuery,
  onTabChange,
  onSearchChange,
  onCreateClient,
}) => {
  return (
    <PageTitle
      eyebrow="Relacion comercial"
      title="Clientes"
      description="Consulta y registro de socios y no socios para solicitudes de evento."
      actions={
        <button
          type="button"
          onClick={onCreateClient}
          className="flex items-center gap-2 rounded-xl bg-[#A8841C] px-4 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#7A5E10]"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Nuevo cliente
        </button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;

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

        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
            search
          </span>
          <input
            className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-10 pr-3 text-sm font-semibold focus:border-[#A8841C] focus:ring-1 focus:ring-[#A8841C]/20"
            placeholder="Buscar por cedula, nombre o telefono"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </PageTitle>
  );
};

export default ClientsHeader;
