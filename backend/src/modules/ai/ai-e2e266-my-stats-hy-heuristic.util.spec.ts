import {
  E2E266_MY_STATS_NEGATIVES,
  E2E266_MY_STATS_POSITIVE,
} from './ai-e2e266-my-stats-hy-heuristic.fixtures.js';
import {
  isMyStatsPrompt,
  rescueProviderExp2Intent,
} from './ai-provider-exp-2.util.js';

describe('e2e-bug.266 my_stats Armenian heuristic', () => {
  it.each(E2E266_MY_STATS_POSITIVE.map((row) => [row.id, row] as const))(
    'still detects my_stats for $id',
    (_id, row) => {
      expect(isMyStatsPrompt(row.prompt)).toBe(true);
      expect(rescueProviderExp2Intent(row.prompt, 'unknown')?.action).toBe(
        'my_stats',
      );
    },
  );

  it.each(E2E266_MY_STATS_NEGATIVES.map((row) => [row.id, row] as const))(
    'does not false-positive my_stats for $id',
    (_id, row) => {
      expect(isMyStatsPrompt(row.prompt)).toBe(false);
      expect(rescueProviderExp2Intent(row.prompt, 'unknown')?.action).not.toBe(
        'my_stats',
      );
    },
  );

  it('նչ+եմ substrings alone are not enough for my_stats', () => {
    // Contains նչ (ինչու) and եմ (չեմ) — the old heuristic would match.
    expect(isMyStatsPrompt('Ինչու չեմ կարող')).toBe(false);
  });
});
