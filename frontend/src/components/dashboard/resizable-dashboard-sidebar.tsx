'use client';

import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { useResizableSidebar } from '@/lib/use-resizable-sidebar';

export function ResizableDashboardSidebar({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { width, isResizing, startResize, nudgeWidth } = useResizableSidebar();

  return (
    <div
      className={`relative flex min-h-screen shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 ${
        isResizing ? 'select-none' : ''
      }`}
      style={{ width }}
    >
      {children}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t('nav.resizeSidebar')}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={startResize}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            nudgeWidth(-8);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nudgeWidth(8);
          }
        }}
        className={`absolute -right-1 top-0 z-10 h-full w-2 touch-none cursor-col-resize transition-colors ${
          isResizing
            ? 'bg-blue-500/40'
            : 'hover:bg-blue-500/25 focus-visible:bg-blue-500/30 focus-visible:outline-none'
        }`}
      />
    </div>
  );
}
