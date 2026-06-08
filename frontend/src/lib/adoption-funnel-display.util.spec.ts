import { describe, expect, it } from 'vitest';
import {
  findWorstDropOffStep,
  formatAdoptionFunnelStepLabel,
  groupAdoptionFunnelBreakdowns,
} from './adoption-funnel-display.util';

describe('adoption-funnel-display.util (adopt-1.4)', () => {
  it('formats funnel step labels for display', () => {
    expect(formatAdoptionFunnelStepLabel('completed_booking')).toBe('completed booking');
  });

  it('groups breakdown rows by dimension', () => {
    const groups = groupAdoptionFunnelBreakdowns([
      {
        dimension: 'platform',
        value: 'ios',
        steps: [],
      },
      {
        dimension: 'locale',
        value: 'en',
        steps: [],
      },
      {
        dimension: 'platform',
        value: 'android',
        steps: [],
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.dimension).toBe('platform');
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[1]?.dimension).toBe('locale');
  });

  it('finds the step with the largest drop-off in a segment', () => {
    const worst = findWorstDropOffStep([
      {
        step: 'app_installed',
        count: 3,
        conversionFromPrevious: 1,
        dropOffFromPrevious: null,
      },
      {
        step: 'signed_in',
        count: 2,
        conversionFromPrevious: 0.67,
        dropOffFromPrevious: 0.33,
      },
      {
        step: 'completed_booking',
        count: 1,
        conversionFromPrevious: 0.5,
        dropOffFromPrevious: 0.5,
      },
    ]);

    expect(worst?.step).toBe('completed_booking');
  });
});
