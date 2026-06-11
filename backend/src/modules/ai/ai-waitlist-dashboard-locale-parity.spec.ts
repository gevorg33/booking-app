import { listWaitlistDashboardLocaleParityGaps } from './ai-waitlist-dashboard-locale-parity.util.js';
import { WAITLIST_DASHBOARD_EN_SCENARIO_IDS } from './ai-waitlist-dashboard.fixtures.js';
import { WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS } from './ai-waitlist-dashboard-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_WAITLIST_DASHBOARD_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_WAITLIST_DASHBOARD_MULTILINGUAL_CASES } from './ai-waitlist-dashboard-multilingual.eval.util.js';

describe('ai-waitlist-dashboard locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN waitlist scenario', () => {
    expect(listWaitlistDashboardLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(WAITLIST_DASHBOARD_MULTILINGUAL_SCENARIOS).toHaveLength(
      WAITLIST_DASHBOARD_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_WAITLIST_DASHBOARD_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_WAITLIST_DASHBOARD_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
