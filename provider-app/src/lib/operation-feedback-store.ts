import { toast } from 'sonner';

type Listener = () => void;

export type OperationFeedbackSnapshot = {
  pendingCount: number;
};

const SERVER_SNAPSHOT: OperationFeedbackSnapshot = Object.freeze({
  pendingCount: 0,
});

let pendingCount = 0;
let clientSnapshot: OperationFeedbackSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<Listener>();

function syncClientSnapshot(): OperationFeedbackSnapshot {
  if (clientSnapshot.pendingCount === pendingCount) {
    return clientSnapshot;
  }
  clientSnapshot = { pendingCount };
  return clientSnapshot;
}

function emit() {
  listeners.forEach((listener) => listener());
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
    toast.success(message);
  },
  pushError(message: string) {
    toast.error(message);
  },
};
