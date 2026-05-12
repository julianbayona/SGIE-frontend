import React from 'react';
import { compactPages } from '@/utils/pagination';

interface TablePaginationProps {
  entityLabel: string;
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  entityLabel,
  from,
  to,
  total,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = compactPages(currentPage, totalPages);
  const canGoPrevious = currentPage > 1 && totalPages > 0;
  const canGoNext = currentPage < totalPages && totalPages > 0;

  return (
    <div className="mt-auto border-t border-stone-200 bg-[#fbf8f2] px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
            {total === 0 ? `Sin ${entityLabel}` : `Mostrando ${from}-${to} de ${total.toLocaleString('es-CO')} ${entityLabel}`}
          </p>
          <p className="text-xs font-semibold text-stone-400">
            Página {totalPages === 0 ? 0 : currentPage} de {totalPages}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(1)}
            className="h-9 rounded-xl border border-stone-300 bg-white px-3 text-xs font-black text-stone-600 transition hover:border-[#A8841C] hover:text-[#A8841C] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Primero
          </button>
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            className="grid size-9 place-items-center rounded-xl border border-stone-300 bg-white text-stone-600 transition hover:border-[#A8841C] hover:text-[#A8841C] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Página anterior"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>

          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="grid size-9 place-items-center text-xs font-black text-stone-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`grid size-9 place-items-center rounded-xl text-xs font-black transition ${
                  page === currentPage
                    ? 'bg-[#A8841C] text-white shadow-sm'
                    : 'border border-stone-300 bg-white text-stone-600 hover:border-[#A8841C] hover:text-[#A8841C]'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(currentPage + 1)}
            className="grid size-9 place-items-center rounded-xl border border-stone-300 bg-white text-stone-600 transition hover:border-[#A8841C] hover:text-[#A8841C] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Página siguiente"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(totalPages)}
            className="h-9 rounded-xl border border-stone-300 bg-white px-3 text-xs font-black text-stone-600 transition hover:border-[#A8841C] hover:text-[#A8841C] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Último
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
