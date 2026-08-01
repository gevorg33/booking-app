import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosError, AxiosInstance } from 'axios';
import {
  attachOperationFeedbackToAxios,
  extractErrorMessage,
  failureMessageForKind,
  inferOperationKind,
  runWithOperationFeedback,
  shouldShowOperationFeedback,
  successMessageForKind,
} from './operation-feedback';
import { operationFeedbackStore } from './operation-feedback-store';
import { LOCALE_COOKIE } from '@/i18n';

vi.mock('./operation-feedback-store', () => ({
  operationFeedbackStore: {
    start: vi.fn(),
    stop: vi.fn(),
    pushSuccess: vi.fn(),
    pushError: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    getSnapshot: vi.fn(() => ({ pendingCount: 0 })),
    getServerSnapshot: vi.fn(() => ({ pendingCount: 0 })),
  },
}));

const store = vi.mocked(operationFeedbackStore);

describe('operation-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = `${LOCALE_COOKIE}=en; path=/`;
  });

  afterEach(() => {
    document.cookie = '';
  });

  describe('inferOperationKind', () => {
    it('maps HTTP verbs to operation kinds', () => {
      expect(inferOperationKind()).toBeNull();
      expect(inferOperationKind('GET')).toBeNull();
      expect(inferOperationKind('post')).toBe('create');
      expect(inferOperationKind('PUT')).toBe('update');
      expect(inferOperationKind('DELETE')).toBe('delete');
    });
  });

  describe('shouldShowOperationFeedback', () => {
    it('skips read-only and configured URL patterns', () => {
      expect(shouldShowOperationFeedback('get', '/businesses/1/bookings')).toBe(false);
      expect(shouldShowOperationFeedback('post', '/auth/login')).toBe(false);
      expect(shouldShowOperationFeedback('post', '/businesses/1/services', true)).toBe(false);
      expect(shouldShowOperationFeedback('post', undefined)).toBe(true);
      expect(shouldShowOperationFeedback('post', '/businesses/1/services')).toBe(true);
    });

    it('skips public assistant and guide-telemetry POSTs (e2e-bug.223)', () => {
      expect(
        shouldShowOperationFeedback(
          'post',
          '/public/gevgas-operations-7c299253/assistant',
        ),
      ).toBe(false);
      expect(
        shouldShowOperationFeedback(
          'post',
          '/public/salon/assistant?locale=en',
        ),
      ).toBe(false);
      expect(
        shouldShowOperationFeedback(
          'post',
          '/public/salon/assistant/guide-telemetry',
        ),
      ).toBe(false);
      expect(shouldShowOperationFeedback('post', '/businesses/1/ai/command')).toBe(
        false,
      );
    });
  });

  describe('successMessageForKind', () => {
    it('uses custom and contextual booking messages', () => {
      expect(successMessageForKind('create', '  Saved!  ')).toBe('Saved!');
      expect(successMessageForKind('create', undefined, '/public/book')).toContain('booking');
      expect(successMessageForKind('create', undefined, '/multi-service/book')).toContain('booking');
      expect(successMessageForKind('delete', undefined, '/bookings/1/cancel')).toContain('cancel');
      expect(successMessageForKind('create', undefined, '/gift-cards/purchase')).toContain('Purchase');
      expect(successMessageForKind('update')).toContain('Saved');
      expect(successMessageForKind('delete')).toContain('Deleted');
      expect(successMessageForKind('create')).toContain('Created');
    });

    it.each([
      {
        id: 'guest-manage-cancel-post',
        kind: 'create' as const,
        url: '/public/gevgas-operations-7c299253/bookings/manage/cancel',
      },
      {
        id: 'guest-package-cancel-post',
        kind: 'create' as const,
        url: '/public/salon/bookings/manage/package/cancel',
      },
      {
        id: 'signed-in-cancel-post',
        kind: 'create' as const,
        url: '/public/salon/me/bookings/bk-1/cancel',
      },
      {
        id: 'dashboard-cancel-put',
        kind: 'update' as const,
        url: '/businesses/biz/bookings/bk-1/cancel',
      },
      {
        id: 'dashboard-cancel-delete',
        kind: 'delete' as const,
        url: '/bookings/1/cancel',
      },
    ])(
      'e2e-bug.216 cancel paths toast cancelled (not confirmed): $id',
      ({ kind, url }) => {
        const msg = successMessageForKind(kind, undefined, url);
        expect(msg).toBe('Your booking was cancelled.');
        expect(msg).not.toMatch(/confirmed/i);
      },
    );

    it('e2e-bug.216 runWithOperationFeedback on manage cancel pushes cancelled toast', async () => {
      await runWithOperationFeedback(
        'post',
        '/public/gevgas-operations-7c299253/bookings/manage/cancel',
        async () => ({ status: 'cancelled' }),
      );
      expect(store.pushSuccess).toHaveBeenCalledWith(
        'Your booking was cancelled.',
      );
      expect(store.pushSuccess).not.toHaveBeenCalledWith(
        'Your booking is confirmed.',
      );
    });

    it('e2e-bug.221 running-late POST does not toast booking confirmed', () => {
      const msg = successMessageForKind(
        'create',
        undefined,
        '/public/salon/me/bookings/bk-1/running-late',
      );
      expect(msg).not.toMatch(/confirmed/i);
      expect(msg).not.toMatch(/Created successfully/i);
      expect(msg).toContain('Saved');
    });

    it('e2e-bug.216 manage reschedule does not toast booking confirmed', () => {
      const msg = successMessageForKind(
        'create',
        undefined,
        '/public/salon/bookings/manage/reschedule',
      );
      expect(msg).not.toMatch(/confirmed/i);
      expect(msg).not.toMatch(/cancelled/i);
      expect(msg).toMatch(/Saved/i);
    });
  });

  describe('failureMessageForKind', () => {
    it('prefixes API errors and falls back when detail is missing', () => {
      expect(failureMessageForKind('create', { response: { data: { message: 'Duplicate' } } })).toBe(
        'Could not create. Duplicate',
      );
      expect(failureMessageForKind('update', null)).toContain('Something went wrong');
      expect(failureMessageForKind('delete', 'Network down')).toBe('Could not delete. Network down');
    });
  });

  describe('extractErrorMessage', () => {
    it('normalizes string, Error, and axios payload shapes', () => {
      expect(extractErrorMessage('  oops  ')).toBe('oops');
      expect(extractErrorMessage(new Error('boom'))).toBe('boom');
      expect(
        extractErrorMessage({
          response: { data: { message: ['a', '', 'b'] } },
        } as AxiosError),
      ).toBe('a, b');
      expect(
        extractErrorMessage({
          response: { data: { message: ['only'] } },
        } as AxiosError),
      ).toBe('only');
      expect(
        extractErrorMessage({
          response: { data: { message: 'Denied', error: 'ignored' } },
        } as AxiosError),
      ).toBe('Denied');
      expect(
        extractErrorMessage({
          response: { data: { error: 'fallback field' } },
        } as AxiosError),
      ).toBe('fallback field');
      expect(extractErrorMessage({ response: { data: { message: '   ' } } })).toBeNull();
      expect(extractErrorMessage({ response: { data: { message: ['', ''] } } })).toBeNull();
      expect(extractErrorMessage(null)).toBeNull();
    });

    it('prefers Nest message over axios status Error.message (e2e-bug.63)', () => {
      const err = new Error('Request failed with status code 500') as Error & {
        response?: { data?: { message?: string } };
      };
      err.response = { data: { message: 'Invitation email failed' } };
      expect(extractErrorMessage(err)).toBe('Invitation email failed');
    });

    it('drops bare axios status text so toasts use the kind fallback (e2e-bug.63)', () => {
      expect(extractErrorMessage(new Error('Request failed with status code 404'))).toBeNull();
      const toast = failureMessageForKind(
        'create',
        new Error('Request failed with status code 500'),
      );
      expect(toast).toMatch(/Something went wrong/i);
      expect(toast).not.toMatch(/Request failed with status code/i);
    });
  });

  describe('runWithOperationFeedback', () => {
    it('shows success toast on happy path', async () => {
      await expect(
        runWithOperationFeedback('post', '/businesses/1/services', async () => 'ok'),
      ).resolves.toBe('ok');
      expect(store.start).toHaveBeenCalled();
      expect(store.pushSuccess).toHaveBeenCalled();
      expect(store.stop).toHaveBeenCalled();
    });

    it('shows error toast and rethrows on failure', async () => {
      await expect(
        runWithOperationFeedback('put', '/businesses/1/services/2', async () => {
          throw new Error('nope');
        }),
      ).rejects.toThrow('nope');
      expect(store.pushError).toHaveBeenCalled();
    });

    it('skips feedback when URL is excluded', async () => {
      await runWithOperationFeedback('post', '/auth/login', async () => true);
      expect(store.start).not.toHaveBeenCalled();
    });

    it('skips feedback for public assistant paths (e2e-bug.223)', async () => {
      await runWithOperationFeedback(
        'post',
        '/public/gevgas-operations-7c299253/assistant',
        async () => ({ success: false, action: 'unknown' }),
      );
      expect(store.start).not.toHaveBeenCalled();
      expect(store.pushSuccess).not.toHaveBeenCalled();

      await runWithOperationFeedback(
        'post',
        '/public/salon/assistant/guide-telemetry',
        async () => ({ recorded: 1 }),
      );
      expect(store.start).not.toHaveBeenCalled();
    });

    it('honors skip option and custom success message', async () => {
      await runWithOperationFeedback(
        'post',
        '/businesses/1/services',
        async () => true,
        { skip: true, successMessage: 'Custom ok' },
      );
      expect(store.start).not.toHaveBeenCalled();

      await runWithOperationFeedback('post', '/businesses/1/services', async () => true, {
        successMessage: 'Custom ok',
      });
      expect(store.pushSuccess).toHaveBeenCalledWith('Custom ok');
    });
  });

  describe('attachOperationFeedbackToAxios', () => {
    it('wires request and response interceptors', async () => {
      const handlers: {
        request?: { fulfilled: (c: unknown) => unknown };
        response?: { fulfilled: (r: unknown) => unknown; rejected: (e: unknown) => unknown };
      } = {};

      const api = {
        interceptors: {
          request: {
            use: (fn: (c: unknown) => unknown) => {
              handlers.request = { fulfilled: fn };
            },
          },
          response: {
            use: (
              ok: (r: unknown) => unknown,
              err: (e: unknown) => unknown,
            ) => {
              handlers.response = { fulfilled: ok, rejected: err };
            },
          },
        },
      } as unknown as AxiosInstance;

      attachOperationFeedbackToAxios(api);

      handlers.request?.fulfilled({ method: 'post', url: '/businesses/1/foo' });
      expect(store.start).toHaveBeenCalled();

      handlers.response?.fulfilled({
        status: 200,
        config: { method: 'post', url: '/businesses/1/foo' },
      });
      expect(store.pushSuccess).toHaveBeenCalled();
      expect(store.stop).toHaveBeenCalled();

      vi.clearAllMocks();
      handlers.response?.fulfilled({
        status: 200,
        config: { method: 'post', url: undefined, operationSuccessMessage: 'Done' },
      });
      expect(store.pushSuccess).toHaveBeenCalledWith('Done');

      vi.clearAllMocks();
      handlers.response?.fulfilled({
        status: 202,
        config: { method: 'post', url: '/businesses/1/foo' },
      });
      expect(store.pushSuccess).not.toHaveBeenCalled();

      vi.clearAllMocks();
      await expect(
        handlers.response?.rejected({
          config: { method: 'delete', url: '/businesses/1/foo/2' },
        }),
      ).rejects.toBeDefined();
      expect(store.pushError).toHaveBeenCalled();

      handlers.request?.fulfilled({ method: 'get', url: '/businesses/1/foo' });
      expect(store.start).not.toHaveBeenCalled();

      vi.clearAllMocks();
      handlers.request?.fulfilled({
        method: 'post',
        url: '/businesses/1/items',
        skipOperationFeedback: true,
      });
      expect(store.start).not.toHaveBeenCalled();

      handlers.request?.fulfilled({ method: 'post', url: undefined });
      expect(store.start).toHaveBeenCalled();

      vi.clearAllMocks();
      await expect(handlers.response?.rejected({})).rejects.toEqual({});
      expect(store.pushError).not.toHaveBeenCalled();

      vi.clearAllMocks();
      await expect(
        handlers.response?.rejected({
          config: { method: 'patch', url: '/businesses/1/items/9' },
        }),
      ).rejects.toBeDefined();
      expect(store.pushError).toHaveBeenCalled();

      vi.clearAllMocks();
      await expect(
        handlers.response?.rejected({
          config: { method: 'delete', url: undefined },
        }),
      ).rejects.toBeDefined();
      expect(store.pushError).toHaveBeenCalled();
    });

    it('reads localized feedback from locale cookie', () => {
      document.cookie = `${LOCALE_COOKIE}=hy; path=/`;
      expect(successMessageForKind('create', undefined, '/book')).toContain('ամրագրում');

      document.cookie = `${LOCALE_COOKIE}=ru; path=/`;
      expect(successMessageForKind('create')).toContain('создан');
    });

    it('falls back to English without or with invalid locale cookie', () => {
      document.cookie = '';
      expect(successMessageForKind('create')).toContain('Created');

      document.cookie = `${LOCALE_COOKIE}=invalid; path=/`;
      expect(successMessageForKind('create')).toContain('Created');
    });

    it('uses English when document is unavailable', () => {
      const doc = globalThis.document;
      // @ts-expect-error simulate SSR
      globalThis.document = undefined;
      expect(successMessageForKind('update')).toContain('Saved');
      globalThis.document = doc;
    });
  });
});
