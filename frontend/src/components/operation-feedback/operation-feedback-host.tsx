'use client';

import { useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { operationFeedbackStore } from '@/lib/operation-feedback-store';

export function OperationFeedbackHost({ accentColor }: { accentColor?: string }) {
  const { pendingCount } = useSyncExternalStore(
    operationFeedbackStore.subscribe,
    operationFeedbackStore.getSnapshot,
    operationFeedbackStore.getServerSnapshot,
  );

  const accent = accentColor ?? 'var(--tenant-primary, #2563eb)';

  if (pendingCount <= 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none bg-black/10 dark:bg-black/25"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white dark:bg-gray-900 px-8 py-6 shadow-xl border border-gray-200 dark:border-gray-700 pointer-events-auto">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: accent }} />
      </div>
    </div>
  );
}
