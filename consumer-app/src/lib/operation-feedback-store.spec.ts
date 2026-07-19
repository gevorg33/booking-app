import { describe, expect, it, beforeEach } from 'vitest';
import { operationFeedbackStore } from './operation-feedback-store.js';

describe('operationFeedbackStore (e2e-bug.14)', () => {
  beforeEach(() => {
    operationFeedbackStore.resetForTests();
  });

  it('returns a stable snapshot identity across repeated getSnapshot calls', () => {
    const a = operationFeedbackStore.getSnapshot();
    const b = operationFeedbackStore.getSnapshot();
    expect(a).toBe(b);
    expect(a.pendingCount).toBe(0);
    expect(a.toasts).toEqual([]);
  });

  it('returns a new snapshot only when state changes', () => {
    const before = operationFeedbackStore.getSnapshot();
    operationFeedbackStore.start();
    const afterStart = operationFeedbackStore.getSnapshot();
    expect(afterStart).not.toBe(before);
    expect(afterStart.pendingCount).toBe(1);
    expect(operationFeedbackStore.getSnapshot()).toBe(afterStart);

    operationFeedbackStore.stop();
    const afterStop = operationFeedbackStore.getSnapshot();
    expect(afterStop.pendingCount).toBe(0);
    expect(operationFeedbackStore.getSnapshot()).toBe(afterStop);
  });
});
