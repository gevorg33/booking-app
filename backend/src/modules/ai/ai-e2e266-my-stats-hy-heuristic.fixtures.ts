/**
 * e2e-bug.266 — Armenian my_stats must not match bare նչ+եմ substrings
 * inside unrelated FAQ prompts ("Ինչու չեմ կարող…").
 */

export type E2e266MyStatsCase = {
  id: string;
  prompt: string;
  expectMyStats: boolean;
  /** When false, Exp2 rescue must not return my_stats. */
  note?: string;
};

/** Legitimate Armenian / EN my_stats prompts that must keep working. */
export const E2E266_MY_STATS_POSITIVE: readonly E2e266MyStatsCase[] = [
  {
    id: 'e2e266-pos-how-am-i-hy',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    expectMyStats: true,
  },
  {
    id: 'e2e266-pos-how-am-i-hy-plain',
    prompt: 'Ինչպես եմ այս շաբաթ',
    expectMyStats: true,
  },
  {
    id: 'e2e266-pos-cucanish-hy',
    prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
    expectMyStats: true,
  },
  {
    id: 'e2e266-pos-utilization-hy',
    prompt: 'Իմ օգտագործումը և եկամուտը այս շաբաթ',
    expectMyStats: true,
  },
  {
    id: 'e2e266-pos-team-hy',
    prompt: 'Թիմի ցուցանիշները այս շաբաթ',
    expectMyStats: true,
  },
  {
    id: 'e2e266-pos-how-am-i-en',
    prompt: 'How am I doing this month?',
    expectMyStats: true,
  },
  {
    id: 'e2e266-pos-week-stats-en',
    prompt: 'Show my stats this week',
    expectMyStats: true,
  },
];

/**
 * Armenian FAQ / dashboard-handoff phrasing that contains նչ+եմ (or similar)
 * but is NOT a stats request.
 */
export const E2E266_MY_STATS_NEGATIVES: readonly E2e266MyStatsCase[] = [
  {
    id: 'e2e266-neg-reassign-hy',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    expectMyStats: false,
    note: 'explain_reassign_limit',
  },
  {
    id: 'e2e266-neg-templates-hy',
    prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    expectMyStats: false,
    note: 'explain_dashboard_only_action',
  },
  {
    id: 'e2e266-neg-loyalty-hy',
    prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    expectMyStats: false,
    note: 'explain_dashboard_only_action',
  },
  {
    id: 'e2e266-neg-call-client-hy',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    expectMyStats: false,
    note: 'explain_dashboard_only_action',
  },
  {
    id: 'e2e266-neg-intake-hy',
    prompt: 'Ինչու չեմ կարող բացել ամբողջական ընդունելության պատասխանները',
    expectMyStats: false,
    note: 'explain_dashboard_only_action',
  },
  {
    id: 'e2e266-neg-why-cant-i-generic-hy',
    prompt: 'Ինչու չեմ կարող սա անել հավելվածում',
    expectMyStats: false,
  },
  {
    id: 'e2e266-neg-floor-meaning-hy',
    prompt: 'Ի՞նչ է նշանակում floor status-ը',
    expectMyStats: false,
    note: 'explain_floor_status',
  },
];
