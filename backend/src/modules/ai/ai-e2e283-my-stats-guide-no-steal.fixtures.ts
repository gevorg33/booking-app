/**
 * e2e-bug.283 — rescueProductGuideIntent / product-guide heuristics must not
 * steal provider my_stats phrasing (esp. HY "Ինչպե՞ս եմ…") into guide_user_flow.
 */

export type E2e283GuideNoStealCase = {
  id: string;
  prompt: string;
  fromAction: string;
  surface: 'provider' | 'dashboard' | 'customer' | 'public';
  /** Expected action after rescueProductGuideIntent (unchanged for my_stats). */
  expectAction: string;
  expectMyStatsPrompt: boolean;
  /** resolveProductGuidePromptMatch.matched must be false for my_stats prompts. */
  expectGuideMatch: boolean;
};

/** Legitimate my_stats / how-am-I prompts that guide rescue must leave alone. */
export const E2E283_MY_STATS_NO_STEAL: readonly E2e283GuideNoStealCase[] = [
  {
    id: 'e2e283-hy-how-am-i-month-unknown',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'unknown',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-hy-how-am-i-month-my-stats',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    fromAction: 'my_stats',
    surface: 'provider',
    expectAction: 'my_stats',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-hy-how-am-i-week-plain',
    prompt: 'Ինչպես եմ այս շաբաթ',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'unknown',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-hy-cucanish',
    prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
    fromAction: 'my_stats',
    surface: 'provider',
    expectAction: 'my_stats',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-hy-utilization',
    prompt: 'Իմ օգտագործումը և եկամուտը այս շաբաթ',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'unknown',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-en-how-am-i',
    prompt: 'How am I doing this month?',
    fromAction: 'my_stats',
    surface: 'provider',
    expectAction: 'my_stats',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-en-show-stats',
    prompt: 'Show my stats this week',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'unknown',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-ru-kak-u-menya',
    prompt: 'Как у меня дела этот месяц?',
    fromAction: 'my_stats',
    surface: 'provider',
    expectAction: 'my_stats',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
  {
    id: 'e2e283-hy-how-am-i-dashboard-surface',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    fromAction: 'my_stats',
    surface: 'dashboard',
    expectAction: 'my_stats',
    expectMyStatsPrompt: true,
    expectGuideMatch: false,
  },
];

/** Real product-guide prompts must still rescue to guide (controls). */
export const E2E283_GUIDE_CONTROLS: readonly E2e283GuideNoStealCase[] = [
  {
    id: 'e2e283-ctrl-en-home-tab',
    prompt: 'How do I use the Home tab?',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'guide_user_flow',
    expectMyStatsPrompt: false,
    expectGuideMatch: true,
  },
  {
    id: 'e2e283-ctrl-hy-home-tab',
    prompt: 'Ինչպե՞ս օգտագործեմ Home tab-ը',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'guide_user_flow',
    expectMyStatsPrompt: false,
    expectGuideMatch: true,
  },
  {
    id: 'e2e283-ctrl-en-walkthrough',
    prompt: 'Walk me through my schedule today',
    fromAction: 'unknown',
    surface: 'provider',
    expectAction: 'guide_user_flow',
    expectMyStatsPrompt: false,
    expectGuideMatch: true,
  },
];
