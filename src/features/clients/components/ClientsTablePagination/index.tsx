import React from 'react';

interface ClientsTablePaginationProps {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ClientsTablePagination: React.FC<ClientsTablePaginationProps> = ({
  from,
  to,
  total,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-auto bg-white border-t border-stone-100 px-8 py-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-stone-400 font-medium">
        Mostrando <span className="font-bold text-text1">{from} - {to}</span> de{' '}
        <span className="font-bold text-text1">{total.toLocaleString('es-CO')}</span> clientes
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1 || totalPages === 0}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
              page === currentPage
                ? 'bg-gold text-white shadow-sm'
                : 'text-stone-400 hover:bg-stone-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default ClientsTablePagination;
