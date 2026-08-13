import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  itemLabel?: string;
  className?: string;
  showSummary?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  itemLabel = 'registros',
  className = '',
  showSummary = true,
}) => {
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages || totalPages === 0;

  // Calculate summary text
  let summaryText = '';
  if (totalItems !== undefined) {
    if (totalItems === 0) {
      summaryText = `Mostrando 0 de 0 ${itemLabel}`;
    } else {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      summaryText = `Mostrando ${startItem} - ${endItem} de ${totalItems} ${itemLabel}`;
    }
  }

  // Generate page numbers array (with ellipses if totalPages > 7)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`pagination-container ${className}`}>
      {showSummary && summaryText && (
        <div className="pagination__summary">{summaryText}</div>
      )}

      <div className="pagination__controls">
        {/* Botón Anterior */}
        <button
          type="button"
          className="pagination__btn pagination__btn--prev"
          disabled={isPrevDisabled}
          onClick={() => !isPrevDisabled && onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          title={isPrevDisabled ? 'No hay páginas anteriores' : 'Página anterior'}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Números de páginas */}
        <div className="pagination__pages">
          {pages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="pagination__ellipsis">
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                className={`pagination__page ${isActive ? 'pagination__page--active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Página ${p}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          className="pagination__btn pagination__btn--next"
          disabled={isNextDisabled}
          onClick={() => !isNextDisabled && onPageChange(currentPage + 1)}
          aria-label="Página siguiente"
          title={isNextDisabled ? 'No hay más páginas' : 'Página siguiente'}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
