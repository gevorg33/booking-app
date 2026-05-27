'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';

export const DEFAULT_PAGE_SIZE = 20;

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-800 text-sm">
      <p className="text-gray-500">
        {t('pagination.showing', { from, to, total: totalItems })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('pagination.previous')}
        </button>
        <span className="text-gray-400 tabular-nums px-2">
          {t('pagination.pageOf', { page: safePage, total: totalPages })}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          {t('pagination.next')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
