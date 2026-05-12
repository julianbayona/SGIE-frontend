import React from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '@/components/ui/PageTitle';
import type { EventStatus } from '@/features/events/types';
import { FORM_LIMITS, limitText } from '@/utils/formLimits';

export type EventsSortOrder = 'proximos' | 'recientes' | 'cliente';

export interface EventsFilters {
  query: string;
  hall: string;
  eventKind: string;
  status: EventStatus | 'Todos';
  from: string;
  to: string;
  sortOrder: EventsSortOrder;
}

interface EventsPageHeaderProps {
  filters: EventsFilters;
  hallOptions: string[];
  eventKindOptions: string[];
  activeFiltersCount: number;
  onFiltersChange: (filters: EventsFilters) => void;
  onClearFilters: () => void;
}

const statuses: Array<EventStatus | 'Todos'> = [
  'Todos',
  'Pendiente',
  'Cotización enviada',
  'Cotización aprobada',
  'Pendiente anticipo',
  'Confirmado',
  'Cancelado',
];

const EventsPageHeader: React.FC<EventsPageHeaderProps> = ({
  filters,
  hallOptions,
  eventKindOptions,
  activeFiltersCount,
  onFiltersChange,
  onClearFilters,
}) => {
  const updateFilter = <K extends keyof EventsFilters>(key: K, value: EventsFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

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
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Filtros avanzados</p>
              <p className="text-xs font-semibold text-stone-400">Refina la lista sin cambiar el flujo del evento.</p>
            </div>
            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-black text-stone-600 transition-colors hover:border-[#A8841C] hover:bg-white hover:text-[#A8841C]"
              >
                <span className="material-symbols-outlined text-base">filter_alt_off</span>
                Limpiar filtros ({activeFiltersCount})
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr]">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Buscar</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-stone-400">
                  search
                </span>
                <input
                  value={filters.query}
                  onChange={(event) => updateFilter('query', limitText(event.target.value, FORM_LIMITS.mediumText))}
                  placeholder="Cliente, documento, salon o ID"
                  className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Salón</span>
              <select
                value={filters.hall}
                onChange={(event) => updateFilter('hall', event.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
              >
                <option value="">Todos</option>
                {hallOptions.map((hall) => (
                  <option key={hall} value={hall}>{hall}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Tipo evento</span>
              <select
                value={filters.eventKind}
                onChange={(event) => updateFilter('eventKind', event.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
              >
                <option value="">Todos</option>
                {eventKindOptions.map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Estado</span>
              <select
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value as EventsFilters['status'])}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Desde</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => updateFilter('from', event.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Hasta</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => updateFilter('to', event.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Orden</span>
              <select
                value={filters.sortOrder}
                onChange={(event) => updateFilter('sortOrder', event.target.value as EventsSortOrder)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-[#A8841C] focus:bg-white"
              >
                <option value="proximos">Próximos primero</option>
                <option value="recientes">Más recientes</option>
                <option value="cliente">Cliente A-Z</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </PageTitle>
  );
};

export default EventsPageHeader;
