import { useSyncExternalStore } from 'react';
import { Toaster } from 'sonner';
import { operationFeedbackStore } from '../lib/operation-feedback-store';

const ACCENT = '#2563eb';

export function OperationFeedbackHost() {
  const { pendingCount } = useSyncExternalStore(
    operationFeedbackStore.subscribe,
    operationFeedbackStore.getSnapshot,
    operationFeedbackStore.getServerSnapshot,
  );

  return (
    <>
      <Toaster richColors closeButton position="bottom-center" theme="light" />
      {pendingCount > 0 && (
        <div
          className="operation-feedback-overlay"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="operation-feedback-spinner-card">
            <div className="operation-feedback-spinner" style={{ borderTopColor: ACCENT }} />
          </div>
        </div>
      )}
    </>
  );
}
