export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
}

export const paginate = <T,>(
  items: T[],
  requestedPage: number,
  pageSize: number,
): PaginationResult<T> => {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages || 1);
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    items: pageItems,
    currentPage,
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    total,
  };
};

export const compactPages = (
  currentPage: number,
  totalPages: number,
): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }
  if (currentPage < totalPages) {
    pages.add(currentPage + 1);
  }
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous > 1) {
      result.push('ellipsis');
    }
    result.push(page);
  });

  return result;
};
