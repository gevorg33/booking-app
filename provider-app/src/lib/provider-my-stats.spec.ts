import { describe, expect, it } from 'vitest';
import {
  formatScheduledHoursLabel,
  formatStatsPeriodLabel,
  formatUtilizationPercent,
} from './provider-my-stats';

describe('provider-my-stats util (prov-exp-2.1)', () => {
  it('formats utilization percent', () => {
    expect(formatUtilizationPercent(62.4)).toBe('62%');
    expect(formatUtilizationPercent(100)).toBe('100%');
  });

  it('formats period labels', () => {
    expect(
      formatStatsPeriodLabel('week', { week: 'This week', month: 'This month' }),
    ).toBe('This week');
    expect(
      formatStatsPeriodLabel('month', { week: 'This week', month: 'This month' }),
    ).toBe('This month');
  });

  it('formats scheduled hours from minutes', () => {
    expect(formatScheduledHoursLabel(480, 'hrs scheduled')).toBe('8 hrs scheduled');
    expect(formatScheduledHoursLabel(90, 'hrs scheduled')).toBe('1.5 hrs scheduled');
  });
});
