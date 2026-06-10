type Listener = () => void;

export type ToastKind = 'success' | 'error';

export type OperationToast = {
  id: string;
  kind: ToastKind;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export type OperationFeedbackSnapshot = {
  pendingCount: number;
  toasts: OperationToast[];
};

const SERVER_SNAPSHOT: OperationFeedbackSnapshot = Object.freeze({
  pendingCount: 0,
  toasts: [],
});

let pendingCount = 0;
let toasts: OperationToast[] = [];
let clientSnapshot: OperationFeedbackSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<Listener>();

function syncClientSnapshot(): OperationFeedbackSnapshot {
  if (clientSnapshot.pendingCount === pendingCount && clientSnapshot.toasts === toasts) {
    return clientSnapshot;
  }
  clientSnapshot = { pendingCount, toasts: [...toasts] };
  return clientSnapshot;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function pushToast(
  kind: ToastKind,
  message: string,
  retry?: { retryLabel: string; onRetry: () => void },
) {
  toasts = [
    ...toasts,
    {
      id: `${Date.now()}-${Math.random()}`,
      kind,
      message,
      retryLabel: retry?.retryLabel,
      onRetry: retry?.onRetry,
    },
  ];
  emit();
  setTimeout(() => {
    toasts = toasts.slice(1);
    emit();
  }, 6_000);
}

export const operationFeedbackStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): OperationFeedbackSnapshot {
    return syncClientSnapshot();
  },
  getServerSnapshot(): OperationFeedbackSnapshot {
    return SERVER_SNAPSHOT;
  },
  start() {
    pendingCount += 1;
    emit();
  },
  stop() {
    pendingCount = Math.max(0, pendingCount - 1);
    emit();
  },
  pushSuccess(message: string) {
    pushToast('success', message);
  },
  pushError(message: string, retry?: { retryLabel: string; onRetry: () => void }) {
    pushToast('error', message, retry);
  },
  resetForTests() {
    pendingCount = 0;
    toasts = [];
    clientSnapshot = SERVER_SNAPSHOT;
    emit();
  },
};
