import { describe, expect, it } from 'vitest';
import { openingHoursSummaryLines } from './public-opening-hours.util.js';

describe('public-opening-hours.util (e2e-bug.50)', () => {
  it('returns empty when hours missing', () => {
    expect(openingHoursSummaryLines(undefined)).toEqual([]);
    expect(openingHoursSummaryLines(null)).toEqual([]);
    expect(
      openingHoursSummaryLines({ days: [], summaryLines: [] }),
    ).toEqual([]);
  });

  it('returns summary lines for profile render', () => {
    expect(
      openingHoursSummaryLines({
        days: [],
        summaryLines: ['Mon–Fri 09:00–19:00', 'Sat 10:00–17:00', 'Sun Closed'],
      }),
    ).toEqual(['Mon–Fri 09:00–19:00', 'Sat 10:00–17:00', 'Sun Closed']);
  });
});
