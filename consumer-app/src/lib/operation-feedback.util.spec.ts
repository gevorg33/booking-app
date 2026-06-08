import { describe, expect, it } from 'vitest';
import axios from 'axios';
import {
  attachOperationFeedbackToAxios,
  failureMessageForKind,
  inferOperationKind,
  shouldShowOperationFeedback,
} from './operation-feedback.js';
import { operationFeedbackStore } from './operation-feedback-store.js';
import { isRetryableNetworkError } from './consumer-network-ux.util.js';

describe('operation-feedback.util (adopt-5.4)', () => {
  it('infers mutation kinds from HTTP methods', () => {
    expect(inferOperationKind('post')).toBe('create');
    expect(inferOperationKind('patch')).toBe('update');
    expect(inferOperationKind('delete')).toBe('delete');
    expect(inferOperationKind('get')).toBeNull();
  });

  it('skips read-only and slot lookup URLs', () => {
    expect(shouldShowOperationFeedback('post', '/public/demo/slots')).toBe(false);
    expect(shouldShowOperationFeedback('post', '/public/demo/bookings')).toBe(true);
  });

  it('uses friendly network copy for retryable failures', () => {
    const message = failureMessageForKind('create', { code: 'ERR_NETWORK' });
    expect(message).toContain('load');
    expect(isRetryableNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
  });

  it('shows error toast with retry for network mutations', async () => {
    operationFeedbackStore.resetForTests();
    const api = axios.create({ baseURL: 'https://example.test' });
    attachOperationFeedbackToAxios(api);

    await expect(api.post('/public/demo/bookings', {})).rejects.toBeTruthy();
    const toast = operationFeedbackStore.getSnapshot().toasts[0];
    expect(toast?.kind).toBe('error');
    expect(toast?.retryLabel).toBeTruthy();
    expect(typeof toast?.onRetry).toBe('function');
  });
});
