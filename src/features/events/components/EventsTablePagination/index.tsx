import React from 'react';

interface EventsTablePaginationProps {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const EventsTablePagination: React.FC<EventsTablePaginationProps> = ({
  from,
  to,
  total,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="p-6 bg-stone-50/50 flex flex-wrap justify-between items-center gap-3 border-t border-border">
      <p className="text-xs text-text3">
        Mostrando <span className="font-bold text-text1">{from} - {to}</span> de {total} eventos
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage === 1 || totalPages === 0}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 flex items-center justify-center rounded bg-white border border-border hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
              page === currentPage
                ? 'bg-gold text-white'
                : 'bg-white border border-border hover:bg-surface text-text2'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 flex items-center justify-center rounded bg-white border border-border hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default EventsTablePagination;
