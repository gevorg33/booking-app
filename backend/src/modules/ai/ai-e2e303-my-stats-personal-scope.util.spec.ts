import {
  E2E303_PARAMS_FALLBACK_CASES,
  E2E303_PERSONAL_SCOPE_CASES,
  E2E303_TEAM_SCOPE_CASES,
} from './ai-e2e303-my-stats-personal-scope.fixtures.js';
import {
  hasExplicitTeamMyStatsCue,
  hasFirstPersonMyStatsCue,
  inferMyStatsScopeFromPrompt,
} from './ai-provider-exp-2.util.js';

describe('e2e-bug.303: my_stats first-person → Your (mine) scope', () => {
  it.each(E2E303_PERSONAL_SCOPE_CASES)(
    'personal $id → mine (beats params.scope=team)',
    ({ prompt, params, expectScope }) => {
      expect(hasFirstPersonMyStatsCue(prompt)).toBe(true);
      expect(hasExplicitTeamMyStatsCue(prompt)).toBe(false);
      expect(inferMyStatsScopeFromPrompt(prompt, params ?? {})).toBe(
        expectScope,
      );
    },
  );

  it.each(E2E303_TEAM_SCOPE_CASES)(
    'team cue $id → team (beats params.scope=mine)',
    ({ prompt, params, expectScope }) => {
      expect(hasExplicitTeamMyStatsCue(prompt)).toBe(true);
      expect(inferMyStatsScopeFromPrompt(prompt, params ?? {})).toBe(
        expectScope,
      );
    },
  );

  it.each(E2E303_PARAMS_FALLBACK_CASES)(
    'params fallback $id',
    ({ prompt, params, expectScope }) => {
      expect(hasFirstPersonMyStatsCue(prompt)).toBe(false);
      expect(hasExplicitTeamMyStatsCue(prompt)).toBe(false);
      expect(inferMyStatsScopeFromPrompt(prompt, params ?? {})).toBe(
        expectScope,
      );
    },
  );

  it('EN how-am-I with scope=team still formats as Your', () => {
    expect(
      inferMyStatsScopeFromPrompt('How am I doing this month?', {
        scope: 'team',
      }),
    ).toBe('mine');
  });
});
