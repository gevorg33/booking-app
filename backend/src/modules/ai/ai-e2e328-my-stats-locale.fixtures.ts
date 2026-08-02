/**
 * e2e-bug.328 — provider my_stats "Your/Team stats…" summaries must
 * localize under HY/RU prompts (and explicit locale), not stay hardcoded
 * EN. Residual from e2e-bug.303.
 */

import type { ProviderMyStatsView } from '../provider-mobile/provider-my-stats.util.js';

export const E2E328_STATS_MINE: ProviderMyStatsView = {
  period: 'month',
  scope: 'mine',
  from: '2026-06-01',
  to: '2026-06-30',
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
};

export const E2E328_STATS_TEAM: ProviderMyStatsView = {
  period: 'week',
  scope: 'team',
  from: '2026-06-02',
  to: '2026-06-08',
  canTeamRollup: true,
  completedBookings: 21,
  paidRevenue: 900,
  currency: 'USD',
  utilizationPercent: 61,
  bookedMinutes: 300,
  scheduledMinutes: 492,
  averageReviewScore: 4.2,
  newReviewsCount: 1,
  employeeCount: 4,
  tipsEnabled: false,
};

export type E2e328LocaleCase = {
  id: string;
  prompt: string;
  locale?: 'en' | 'hy' | 'ru';
  stats: ProviderMyStatsView;
  expectFragment: string;
  forbidEnglishFragments?: string[];
};

export const E2E328_MY_STATS_LOCALE_CASES: readonly E2e328LocaleCase[] = [
  {
    id: 'ai-e2e328-en-mine',
    prompt: 'How am I doing this month?',
    locale: 'en',
    stats: E2E328_STATS_MINE,
    expectFragment: 'Your stats this month',
  },
  {
    id: 'ai-e2e328-hy-mine-script',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    stats: E2E328_STATS_MINE,
    expectFragment: 'Ձեր ցուցանիշները այս ամիս',
    forbidEnglishFragments: ['Your stats this month', 'completed visit'],
  },
  {
    id: 'ai-e2e328-hy-mine-explicit-locale',
    prompt: 'How am I doing this month?',
    locale: 'hy',
    stats: E2E328_STATS_MINE,
    expectFragment: 'Ձեր ցուցանիշները այս ամիս',
    forbidEnglishFragments: ['Your stats this month'],
  },
  {
    id: 'ai-e2e328-ru-mine-script',
    prompt: 'Как у меня дела этот месяц?',
    stats: E2E328_STATS_MINE,
    expectFragment: 'Ваша статистика за этот месяц',
    forbidEnglishFragments: ['Your stats this month', 'completed visit'],
  },
  {
    id: 'ai-e2e328-ru-mine-explicit-locale',
    prompt: 'How am I doing this month?',
    locale: 'ru',
    stats: E2E328_STATS_MINE,
    expectFragment: 'Ваша статистика за этот месяц',
    forbidEnglishFragments: ['Your stats this month'],
  },
  {
    id: 'ai-e2e328-hy-team-script',
    prompt: 'Թիմի ցուցանիշները այս շաբաթ',
    stats: E2E328_STATS_TEAM,
    expectFragment: 'Թիմի ցուցանիշները այս շաբաթ',
    forbidEnglishFragments: ['Team stats this week'],
  },
  {
    id: 'ai-e2e328-ru-team-script',
    prompt: 'Командная статистика за эту неделю',
    stats: E2E328_STATS_TEAM,
    expectFragment: 'Командная статистика за эту неделю',
    forbidEnglishFragments: ['Team stats this week'],
  },
];
