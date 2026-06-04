import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosError, AxiosInstance } from 'axios';
import {
  attachOperationFeedbackToAxios,
  extractErrorMessage,
  failureMessageForKind,
  inferOperationKind,
  shouldShowOperationFeedback,
  successMessageForKind,
} from './operation-feedback';
import { operationFeedbackStore } from './operation-feedback-store';
import { useAuthStore } from '../services/auth-store';
import { clearStoredLocale } from '../i18n/locale-storage';

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

describe('provider operation-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStoredLocale();
    useAuthStore.setState({
      user: null,
      business: null,
      employee: null,
      businesses: [],
      token: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    clearStoredLocale();
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
    it('skips read-only, AI, and auth URL patterns', () => {
      expect(shouldShowOperationFeedback('get', '/businesses/1/bookings')).toBe(false);
      expect(shouldShowOperationFeedback('post', '/auth/login')).toBe(false);
      expect(shouldShowOperationFeedback('post', '/businesses/1/provider/ai/command')).toBe(false);
      expect(shouldShowOperationFeedback('post', '/businesses/1/services', true)).toBe(false);
      expect(shouldShowOperationFeedback('post', undefined)).toBe(true);
      expect(shouldShowOperationFeedback('post', '/businesses/1/provider/bookings/1')).toBe(true);
    });
  });

  describe('successMessageForKind', () => {
    it('uses custom messages and localized defaults', () => {
      expect(successMessageForKind('create', '  Saved!  ')).toBe('Saved!');
      expect(successMessageForKind('update')).toContain('Saved');
      expect(successMessageForKind('delete')).toContain('Deleted');
      expect(successMessageForKind('create')).toContain('Created');
    });

    it('reads Armenian messages when user locale is hy', () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'a@b.c', locale: 'hy' },
        business: null,
        employee: null,
        businesses: [],
        token: 't',
        isAuthenticated: true,
      });
      expect(successMessageForKind('create')).toContain('ստեղծվեց');
    });
  });

  describe('failureMessageForKind', () => {
    it('prefixes API errors and falls back when detail is missing', () => {
      expect(failureMessageForKind('create', { response: { data: { message: 'Duplicate' } } })).toContain(
        'Duplicate',
      );
      expect(failureMessageForKind('update', null)).toMatch(/wrong|սխալ|не так/i);
      expect(failureMessageForKind('delete', 'Network down')).toContain('Network down');
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
      expect(extractErrorMessage({ response: { data: { message: 'Denied' } } } as AxiosError)).toBe('Denied');
      expect(extractErrorMessage({ response: { data: { message: '   ' } } })).toBeNull();
      expect(extractErrorMessage({ response: { data: { message: ['', ''] } } })).toBeNull();
      expect(extractErrorMessage(new Error('   '))).toBeNull();
      expect(extractErrorMessage('   ')).toBeNull();
      expect(extractErrorMessage(null)).toBeNull();
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
            use: (ok: (r: unknown) => unknown, err: (e: unknown) => unknown) => {
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

      vi.clearAllMocks();
      await expect(
        handlers.response?.rejected({
          config: { method: 'post', url: '/auth/login' },
        }),
      ).rejects.toBeDefined();
      expect(store.pushError).not.toHaveBeenCalled();

      vi.clearAllMocks();
      handlers.response?.fulfilled({
        status: 200,
        config: { method: 'get', url: '/businesses/1/foo' },
      });
      expect(store.pushSuccess).not.toHaveBeenCalled();
    });

    it('uses business locale when user locale is absent', () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'a@b.c' },
        business: { id: 'b1', name: 'Biz', locale: 'ru' },
        employee: null,
        businesses: [],
        token: 't',
        isAuthenticated: true,
      });
      expect(successMessageForKind('create')).toMatch(/создан|Created/i);
    });
  });
});
