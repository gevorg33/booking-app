import { describe, expect, it } from '@jest/globals';
import { E2E328_MY_STATS_LOCALE_CASES } from './ai-e2e328-my-stats-locale.fixtures.js';
import { formatProviderMyStatsSummary } from './ai-provider-exp-2.util.js';

describe('e2e-bug.328: my_stats "Your/Team stats…" summaries localize under HY/RU', () => {
  it.each(E2E328_MY_STATS_LOCALE_CASES)(
    '$id localizes formatProviderMyStatsSummary',
    ({ prompt, locale, stats, expectFragment, forbidEnglishFragments }) => {
      const summary = formatProviderMyStatsSummary(
        stats,
        { currency: 'USD' },
        locale,
        prompt,
      );
      expect(summary).toContain(expectFragment);
      for (const forbidden of forbidEnglishFragments ?? []) {
        expect(summary).not.toContain(forbidden);
      }
    },
  );

  it('EN regression guard: default (no locale, no prompt) stays English', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'mine',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: false,
        completedBookings: 12,
        paidRevenue: 480,
        currency: 'USD',
        utilizationPercent: 72,
        bookedMinutes: 360,
        scheduledMinutes: 500,
        averageReviewScore: 4.8,
        newReviewsCount: 3,
        employeeCount: 1,
        tipsEnabled: true,
        tipTotal: 40,
        tippedVisitCount: 4,
      },
      { currency: 'USD' },
    );
    expect(summary).toBe(
      'Your stats this week: 12 completed visits, $480 paid revenue, 72% utilization (360/500 min), 4.8★ avg from 3 new reviews, $40 tips across 4 visits.',
    );
  });

  it('EN regression guard: singular counts still say "visit"/"review" (e2e-bug.303 non-regression)', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'month',
        scope: 'team',
        from: '2026-06-01',
        to: '2026-06-30',
        canTeamRollup: true,
        completedBookings: 1,
        paidRevenue: 40,
        currency: 'USD',
        utilizationPercent: 10,
        bookedMinutes: 60,
        scheduledMinutes: 600,
        averageReviewScore: 5,
        newReviewsCount: 1,
        employeeCount: 4,
        tipsEnabled: false,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('Team stats this month: 1 completed visit,');
    expect(summary).toContain('5★ avg from 1 new review');
    expect(summary).not.toContain('visits,');
  });
});
