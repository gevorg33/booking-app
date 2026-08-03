/**
 * e2e-bug.303 — first-person how-am-I / my_stats must stay scope=mine
 * even when classifier params say scope=team (owner token bias).
 * Explicit team cues still resolve to team.
 */

export type E2e303ScopeCase = {
  id: string;
  prompt: string;
  /** Classifier often wrongly sends team for owners — must still be mine. */
  params?: Record<string, unknown>;
  expectScope: 'mine' | 'team';
};

export const E2E303_PERSONAL_SCOPE_CASES: readonly E2e303ScopeCase[] = [
  {
    id: 'ai-e2e303-en-how-am-i-month',
    prompt: 'How am I doing this month?',
    params: { scope: 'team', period: 'month' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-en-how-am-i-week',
    prompt: 'How am I doing this week?',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-en-show-my-stats',
    prompt: 'Show my stats this week',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-en-my-performance',
    prompt: 'Summarize my performance this week',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-hy-how-am-i-month',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-hy-how-am-i-week',
    prompt: 'Ինչպես եմ այս շաբաթ',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-hy-my-cucanish',
    prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-hy-my-utilization',
    prompt: 'Իմ օգտագործումը և եկամուտը այս շաբաթ',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-ru-kak-u-menya',
    prompt: 'Как у меня дела этот месяц?',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-ru-moya-statistika',
    prompt: 'Моя статистика за неделю',
    params: { scope: 'team' },
    expectScope: 'mine',
  },
] as const;

export const E2E303_TEAM_SCOPE_CASES: readonly E2e303ScopeCase[] = [
  {
    id: 'ai-e2e303-en-team-stats',
    prompt: 'Team stats for the week',
    params: {},
    expectScope: 'team',
  },
  {
    id: 'ai-e2e303-en-team-stats-params-mine',
    prompt: 'Team stats for the week',
    params: { scope: 'mine' },
    expectScope: 'team',
  },
  {
    id: 'ai-e2e303-hy-team-cucanish',
    prompt: 'Թիմի ցուցանիշները այս շաբաթ',
    params: {},
    expectScope: 'team',
  },
  {
    id: 'ai-e2e303-ru-team-statistika',
    prompt: 'Статистика команды за неделю',
    params: {},
    expectScope: 'team',
  },
] as const;

/** Ambiguous prompt — params.scope may decide. */
export const E2E303_PARAMS_FALLBACK_CASES: readonly E2e303ScopeCase[] = [
  {
    id: 'ai-e2e303-bare-stats-params-team',
    prompt: 'stats this week',
    params: { scope: 'team' },
    expectScope: 'team',
  },
  {
    id: 'ai-e2e303-bare-stats-params-mine',
    prompt: 'stats this week',
    params: { scope: 'mine' },
    expectScope: 'mine',
  },
  {
    id: 'ai-e2e303-bare-stats-default',
    prompt: 'stats this week',
    params: {},
    expectScope: 'mine',
  },
] as const;
