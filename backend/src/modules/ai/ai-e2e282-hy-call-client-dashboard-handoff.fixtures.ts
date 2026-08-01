/**
 * e2e-bug.282 — HY/RU "why can't I call the client" must be
 * explain_dashboard_only_action, not summarize_client / my_stats.
 */

export type E2e282HandoffCase = {
  id: string;
  prompt: string;
  expectDashboardHandoff: boolean;
  expectSummarizeClient: boolean;
  expectMyStats: boolean;
};

export const E2E282_CALL_HANDOFF_CASES: readonly E2e282HandoffCase[] = [
  {
    id: 'e2e282-hy-zangahararel',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
  {
    id: 'e2e282-hy-zangel',
    prompt: 'Ինչու չեմ կարող զանգել հաճախորդին',
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
  {
    id: 'e2e282-en-call-client',
    prompt: "Why can't I call the client?",
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
  {
    id: 'e2e282-en-phone-customer',
    prompt: "Why can't I phone the customer?",
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
  {
    id: 'e2e282-ru-pozvonit',
    prompt: 'Почему я не могу позвонить клиенту?',
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
  {
    id: 'e2e282-hy-templates',
    prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
  {
    id: 'e2e282-hy-loyalty',
    prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    expectDashboardHandoff: true,
    expectSummarizeClient: false,
    expectMyStats: false,
  },
];

export const E2E282_CONTROL_CASES: readonly E2e282HandoffCase[] = [
  {
    id: 'e2e282-control-summarize-hy',
    prompt: 'Ամփոփիր այս հաճախորդին',
    expectDashboardHandoff: false,
    expectSummarizeClient: true,
    expectMyStats: false,
  },
  {
    id: 'e2e282-control-summarize-en',
    prompt: 'Summarize this client',
    expectDashboardHandoff: false,
    expectSummarizeClient: true,
    expectMyStats: false,
  },
  {
    id: 'e2e282-control-my-stats-hy',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    expectDashboardHandoff: false,
    expectSummarizeClient: false,
    expectMyStats: true,
  },
  {
    id: 'e2e282-control-reassign-hy',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    expectDashboardHandoff: false, // dedicated explain_reassign_limit
    expectSummarizeClient: false,
    expectMyStats: false,
  },
];
