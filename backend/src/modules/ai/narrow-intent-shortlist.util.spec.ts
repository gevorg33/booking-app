import { NARROW_SHORTLIST_SCENARIOS } from './narrow-intent-shortlist.fixtures.js';
import {
  buildNarrowIntentShortlist,
  NARROW_INTENT_SHORTLIST_MAX,
  NARROW_INTENT_SHORTLIST_PIPE_MARKER,
  NARROW_RECLASSIFY_MARGIN,
  resolveNarrowShortlistSurfaceIntents,
} from './narrow-intent-shortlist.util.js';
import { DEFAULT_RERANK_RUNNER_UP_MARGIN } from './intent-candidate-rerank.util.js';

describe('narrow-intent-shortlist.util (pipe-1.4.7 / acc-3.3)', () => {
  it('exports pipe marker and margin aligned with rerank', () => {
    expect(NARROW_INTENT_SHORTLIST_PIPE_MARKER).toBe('pipe-1.4.7');
    expect(NARROW_RECLASSIFY_MARGIN).toBe(DEFAULT_RERANK_RUNNER_UP_MARGIN);
    expect(NARROW_RECLASSIFY_MARGIN).toBe(0.08);
    expect(NARROW_INTENT_SHORTLIST_MAX).toBe(10);
  });

  it.each(NARROW_SHORTLIST_SCENARIOS)(
    '$id builds surface-valid shortlist',
    ({ surface, ranked, mustInclude, mustExclude, maxLength }) => {
      const shortlist = buildNarrowIntentShortlist(ranked, surface, {
        max: maxLength ?? NARROW_INTENT_SHORTLIST_MAX,
      });
      expect(shortlist.length).toBeLessThanOrEqual(
        maxLength ?? NARROW_INTENT_SHORTLIST_MAX,
      );
      for (const action of mustInclude) {
        expect(shortlist).toContain(action);
      }
      for (const action of mustExclude ?? []) {
        expect(shortlist).not.toContain(action);
      }
      const surfaceIntents = new Set(
        resolveNarrowShortlistSurfaceIntents(surface),
      );
      for (const action of shortlist) {
        const isRanked = ranked.some((candidate) => candidate.action === action);
        expect(isRanked || surfaceIntents.has(action)).toBe(true);
      }
    },
  );
});
