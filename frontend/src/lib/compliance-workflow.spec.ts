import { describe, expect, it } from 'vitest';
import {
  GDPR_BREACH_NOTIFICATION_HOURS,
  canSubmitBreachReport,
  isBusinessOwner,
  resolveBreachDeadlineAlerts,
} from './compliance-workflow';

describe('compliance-workflow', () => {
  it('detects owner role', () => {
    expect(isBusinessOwner('owner')).toBe(true);
    expect(isBusinessOwner('admin')).toBe(false);
    expect(isBusinessOwner(null)).toBe(false);
  });

  it('validates breach report description length', () => {
    expect(canSubmitBreachReport('short')).toBe(false);
    expect(canSubmitBreachReport('  ten chars!  ')).toBe(true);
  });

  it.each([
    {
      id: 'approaching',
      deadline: '2026-06-04T10:00:00.000Z',
      now: new Date('2026-06-04T02:00:00.000Z').getTime(),
      approaching: true,
      overdue: false,
    },
    {
      id: 'overdue',
      deadline: '2026-06-04T10:00:00.000Z',
      now: new Date('2026-06-04T11:00:00.000Z').getTime(),
      approaching: false,
      overdue: true,
    },
    {
      id: 'future',
      deadline: '2026-06-04T10:00:00.000Z',
      now: new Date('2026-06-03T08:00:00.000Z').getTime(),
      approaching: false,
      overdue: false,
    },
  ])(
    'breach deadline alerts for $id',
    ({ deadline, now, approaching, overdue }) => {
      expect(resolveBreachDeadlineAlerts(deadline, now)).toEqual({
        approaching,
        overdue,
      });
    },
  );

  it('exports GDPR 72-hour constant', () => {
    expect(GDPR_BREACH_NOTIFICATION_HOURS).toBe(72);
  });
});
