import { AI_IMPLICATION_CORPUS_SCENARIOS } from './ai-implication-corpus.fixtures.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import {
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { resolveSemanticAllowedActions } from './semantic-allowed-actions.util.js';

describe('ai-implication-corpus semantic action coverage (pipe-1.11.1)', () => {
  it.each(
    AI_IMPLICATION_CORPUS_SCENARIOS.filter((scenario) => scenario.surface !== 'provider'),
  )(
    '$id resolves to $expectedAction on $surface',
    ({ prompt, surface, expectedAction, mustNotMatch }) => {
      const allowedActions = resolveSemanticAllowedActions(surface);
      const anchors = filterAnchorsForSurface(
        buildCanonicalPhrasingBank([]),
        surface,
        allowedActions,
      );
      const ranked = rankAnchorsDeterministic(prompt, anchors);
      const match = resolveSemanticMatch(ranked, {
        threshold: SEMANTIC_CONCEPT_THRESHOLD,
      });

      const top = ranked[0];
      const resolvedAction =
        match?.action ??
        (top && top.score >= SEMANTIC_CONCEPT_THRESHOLD ? top.anchor.action : undefined);

      expect(resolvedAction).toBe(expectedAction);
      if (mustNotMatch?.length && top) {
        for (const blocked of mustNotMatch) {
          expect(top.anchor.action).not.toBe(blocked);
        }
      }
    },
  );
});
