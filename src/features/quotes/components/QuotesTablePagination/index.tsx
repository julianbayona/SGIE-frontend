import React from 'react';

interface QuotesTablePaginationProps {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const QuotesTablePagination: React.FC<QuotesTablePaginationProps> = ({
  from,
  to,
  total,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
      <span className="text-xs font-medium text-stone-500 uppercase tracking-widest">
        Mostrando {from}-{to} de {total} Cotizaciones
      </span>

      <div className="flex gap-1">
        <button
          type="button"
          disabled={currentPage === 1 || totalPages === 0}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 bg-white text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded font-bold text-xs transition-colors ${
              page === currentPage
                ? 'bg-primary-gold text-white'
                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 bg-white text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default QuotesTablePagination;
