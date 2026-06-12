import { clearIntentAnchorBankCache } from './intent-anchor.bank.js';
import {
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { SEMANTIC_ALLOWED_ACTIONS_SCENARIOS } from './semantic-allowed-actions.fixtures.js';
import {
  resolveSemanticAllowedActions,
  resolveSurfaceSemanticActions,
  SEMANTIC_ALLOWED_ACTIONS_PIPE_MARKER,
} from './semantic-allowed-actions.util.js';
import { getIntentAnchorBank } from './intent-anchor.bank.js';

describe('semantic-allowed-actions.util (pipe-1.4.6)', () => {
  beforeEach(() => {
    clearIntentAnchorBankCache();
  });

  it('exports pipe marker', () => {
    expect(SEMANTIC_ALLOWED_ACTIONS_PIPE_MARKER).toBe('pipe-1.4.6');
  });

  it.each(SEMANTIC_ALLOWED_ACTIONS_SCENARIOS)(
    '$id resolves allowed semantic actions',
    ({ surface, lastAction, mustInclude, mustExclude }) => {
      const allowed = resolveSemanticAllowedActions(surface, lastAction);
      for (const action of mustInclude) {
        expect(allowed).toContain(action);
      }
      for (const action of mustExclude) {
        expect(allowed).not.toContain(action);
      }
    },
  );

  it('public surface blocks create_direct_schedule semantic match', () => {
    const prompt = 'They need regular work time on the calendar next week';
    const allowed = resolveSemanticAllowedActions('public');
    const anchors = filterAnchorsForSurface(
      getIntentAnchorBank(),
      'public',
      allowed,
    );
    const match = resolveSemanticMatch(
      rankAnchorsDeterministic(prompt, anchors),
      { threshold: SEMANTIC_CONCEPT_THRESHOLD },
    );
    expect(match?.action).not.toBe('create_direct_schedule');
    expect(resolveSurfaceSemanticActions('public')).not.toContain(
      'create_direct_schedule',
    );
  });

  it('after check_providers_for_service blocks schedule semantic on dashboard', () => {
    const prompt = 'They need regular work time on the calendar next week';
    const allowed = resolveSemanticAllowedActions(
      'dashboard',
      'check_providers_for_service',
    );
    expect(allowed).not.toContain('create_direct_schedule');
    const narrowed = filterAnchorsForSurface(
      getIntentAnchorBank(),
      'dashboard',
      allowed,
    );
    const unrestricted = filterAnchorsForSurface(
      getIntentAnchorBank(),
      'dashboard',
      resolveSemanticAllowedActions('dashboard'),
    );
    const narrowedTop = rankAnchorsDeterministic(prompt, narrowed)[0];
    const unrestrictedTop = rankAnchorsDeterministic(prompt, unrestricted)[0];
    expect(narrowedTop?.anchor.action).not.toBe('create_direct_schedule');
    expect(unrestrictedTop?.anchor.action).toBe('create_direct_schedule');
  });

  it('after create_direct_schedule still resolves schedule paraphrase', () => {
    const prompt = 'They need regular work time on the calendar next week';
    const allowed = resolveSemanticAllowedActions(
      'dashboard',
      'create_direct_schedule',
    );
    const anchors = filterAnchorsForSurface(
      getIntentAnchorBank(),
      'dashboard',
      allowed,
    );
    const match = resolveSemanticMatch(
      rankAnchorsDeterministic(prompt, anchors),
      { threshold: SEMANTIC_CONCEPT_THRESHOLD },
    );
    expect(match?.action).toBe('create_direct_schedule');
  });
});
