import { useSyncExternalStore } from 'react';
import { operationFeedbackStore } from '../lib/operation-feedback-store.js';

const ACCENT = '#2563eb';

/** Network-aware mutation feedback for booking flows (adopt-5.4). */
export function OperationFeedbackHost() {
  const { pendingCount, toasts } = useSyncExternalStore(
    operationFeedbackStore.subscribe,
    operationFeedbackStore.getSnapshot,
    operationFeedbackStore.getServerSnapshot,
  );

  return (
    <>
      {pendingCount > 0 && (
        <div
          aria-live="polite"
          aria-busy="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid #e5e7eb',
              borderTopColor: ACCENT,
              animation: 'consumer-feedback-spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 88,
          left: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: toast.kind === 'error' ? '#fef2f2' : '#ecfdf5',
              color: toast.kind === 'error' ? '#991b1b' : '#065f46',
              border: `1px solid ${toast.kind === 'error' ? '#fecaca' : '#a7f3d0'}`,
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <span>{toast.message}</span>
            {toast.onRetry && toast.retryLabel ? (
              <button
                type="button"
                onClick={toast.onRetry}
                style={{
                  border: '1px solid #fecaca',
                  background: '#fff',
                  color: '#991b1b',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {toast.retryLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes consumer-feedback-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
