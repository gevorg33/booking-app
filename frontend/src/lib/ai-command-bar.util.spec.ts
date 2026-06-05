import { describe, expect, it } from 'vitest';
import {
  extractSessionContext,
  findLastUndoableMessageId,
  mergeSessionContext,
  shouldInvalidateAfterAi,
} from './ai-command-bar.util';

describe('ai-command-bar.util', () => {
  describe('shouldInvalidateAfterAi', () => {
    it('returns false without success or action', () => {
      expect(shouldInvalidateAfterAi(undefined, true)).toBe(false);
      expect(shouldInvalidateAfterAi('create_booking', false)).toBe(false);
    });

    it('returns true for booking and schedule mutations', () => {
      expect(shouldInvalidateAfterAi('create_booking', true)).toBe(true);
      expect(shouldInvalidateAfterAi('reschedule_booking', true)).toBe(true);
      expect(shouldInvalidateAfterAi('fill_unused_slots', true)).toBe(true);
      expect(shouldInvalidateAfterAi('optimize_schedule', true)).toBe(true);
    });

    it('returns false for read-only actions', () => {
      expect(shouldInvalidateAfterAi('query_bookings', true)).toBe(false);
    });
  });

  describe('extractSessionContext', () => {
    it('merges sessionContext, params, employee, and metrics', () => {
      const ctx = extractSessionContext({
        action: 'create_booking',
        details: {
          sessionContext: { route: '/dashboard/bookings' },
          employee: 'Anna',
          date: '2026-06-02',
          availableProviders: ['Anna', 'Bob'],
          params: { serviceName: 'Massage', timeSlot: '10:00' },
          appointmentMetric: 'count',
        },
      });
      expect(ctx.employeeName).toBe('Anna');
      expect(ctx.date).toBe('2026-06-02');
      expect(ctx.serviceName).toBe('Massage');
      expect(ctx.timeSlot).toBe('10:00');
      expect(ctx.availableProviders).toEqual(['Anna', 'Bob']);
      expect(ctx.lastAction).toBe('create_booking');
      expect(ctx.lastMetric).toBe('count');
      expect(ctx.route).toBe('/dashboard/bookings');
    });

    it('prefers explicit sessionContext fields over params', () => {
      const ctx = extractSessionContext({
        details: {
          sessionContext: { employeeName: 'FromSession' },
          params: { employeeName: 'FromParams' },
        },
      });
      expect(ctx.employeeName).toBe('FromSession');
    });

    it('uses bookingMetric fallback for lastMetric', () => {
      const ctx = extractSessionContext({
        details: { bookingMetric: 'revenue' },
      });
      expect(ctx.lastMetric).toBe('revenue');
      expect(ctx.bookingMetric).toBe('revenue');
    });

    it('reads employeeName and date from params when not on details', () => {
      const ctx = extractSessionContext({
        details: { params: { employeeName: 'Bob', date: '2026-06-02' } },
      });
      expect(ctx.employeeName).toBe('Bob');
      expect(ctx.date).toBe('2026-06-02');
    });

    it('fills params only when session fields are missing', () => {
      const ctx = extractSessionContext({
        details: {
          employee: 'Anna',
          date: '2026-06-01',
          params: {
            employeeName: 'Bob',
            date: '2026-06-02',
            serviceName: 'Massage',
            timeSlot: '11:00',
          },
        },
      });
      expect(ctx.employeeName).toBe('Anna');
      expect(ctx.date).toBe('2026-06-01');
      expect(ctx.serviceName).toBe('Massage');
      expect(ctx.timeSlot).toBe('11:00');
    });

    it('sets customerMetric from generic metric field', () => {
      const ctx = extractSessionContext({
        details: { metric: 'churn' },
      });
      expect(ctx.customerMetric).toBe('churn');
      expect(ctx.lastMetric).toBe('churn');
    });

    it('derives availableProviders from details.providers when names are only there', () => {
      const ctx = extractSessionContext({
        action: 'check_providers_for_service',
        details: {
          providers: [
            { id: 'e1', name: 'Karo Mazmanyan' },
            { id: 'e2', name: 'Mary Torgomyan' },
          ],
        },
      });
      expect(ctx.availableProviders).toEqual(['Karo Mazmanyan', 'Mary Torgomyan']);
      expect(ctx.lastAction).toBe('check_providers_for_service');
    });

    it('prefers explicit availableProviders over providers array', () => {
      const ctx = extractSessionContext({
        details: {
          availableProviders: ['Anna'],
          providers: [{ name: 'Bob' }],
        },
      });
      expect(ctx.availableProviders).toEqual(['Anna']);
    });
  });

  describe('mergeSessionContext', () => {
    it('keeps previous values when next omits them', () => {
      const merged = mergeSessionContext(
        { employeeName: 'Anna', date: 'today' },
        { serviceName: 'Cut' },
      );
      expect(merged.employeeName).toBe('Anna');
      expect(merged.date).toBe('today');
      expect(merged.serviceName).toBe('Cut');
    });

    it('retains previous serviceName when next omits it', () => {
      const merged = mergeSessionContext({ serviceName: 'Keep' }, { employeeName: 'Anna' });
      expect(merged.serviceName).toBe('Keep');
      expect(merged.employeeName).toBe('Anna');
    });

    it('overrides every tracked field when next provides values', () => {
      const prev = {
        employeeName: 'A',
        date: 'd1',
        dateFrom: 'df1',
        dateTo: 'dt1',
        serviceName: 's1',
        timeSlot: 't1',
        customerName: 'c1',
        templateName: 'tm1',
        timeFrom: '09:00',
        timeTo: '17:00',
        allProviders: false,
        lastAction: 'old',
        lastMetric: 'm1',
        appointmentMetric: 'am1',
        customerMetric: 'cm1',
        bookingMetric: 'bm1',
        route: '/old',
        availableProviders: ['A'],
      };
      const next = {
        employeeName: 'B',
        date: 'd2',
        dateFrom: 'df2',
        dateTo: 'dt2',
        serviceName: 's2',
        timeSlot: 't2',
        customerName: 'c2',
        templateName: 'tm2',
        timeFrom: '10:00',
        timeTo: '18:00',
        allProviders: true,
        lastAction: 'new',
        lastMetric: 'm2',
        appointmentMetric: 'am2',
        customerMetric: 'cm2',
        bookingMetric: 'bm2',
        route: '/new',
        availableProviders: ['B'],
      };
      expect(mergeSessionContext(prev, next)).toEqual(next);
    });
  });

  describe('findLastUndoableMessageId', () => {
    const messages = [
      { id: 'u1', role: 'user' as const },
      { id: 'a1', role: 'assistant' as const, success: true, action: 'query_bookings' },
      { id: 'a2', role: 'assistant' as const, success: true, action: 'create_booking' },
    ];

    it('returns null when undo is not available', () => {
      expect(findLastUndoableMessageId(messages, false)).toBeNull();
    });

    it('returns latest successful mutation message id', () => {
      expect(findLastUndoableMessageId(messages, true)).toBe('a2');
    });

    it('returns null when no mutation succeeded', () => {
      expect(
        findLastUndoableMessageId(
          [{ id: 'a1', role: 'assistant', success: true, action: 'unknown' }],
          true,
        ),
      ).toBeNull();
    });
  });
});
