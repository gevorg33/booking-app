import { E2E342_UNKNOWN_RESCUE_CASES } from './ai-e2e342-provider-exp2-unknown-registry-gap.fixtures.js';
import { rescueProviderExp2Intent } from './ai-provider-exp-2.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.342: list_team_unpaid_today / explain_reviews_inbox reachable on a genuine unknown classification', () => {
  const rescue = new AiIntentRescueService();

  it('both actions are now present in the command registry for surface=provider', () => {
    expect(isIntentAllowedOnSurface('list_team_unpaid_today', 'provider')).toBe(
      true,
    );
    expect(isIntentAllowedOnSurface('explain_reviews_inbox', 'provider')).toBe(
      true,
    );
  });

  it.each(E2E342_UNKNOWN_RESCUE_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      // The deterministic detector was always correct — confirms the bug was
      // purely in registry wiring, not classification logic.
      expect(rescueProviderExp2Intent(row.prompt, 'unknown')?.action).toBe(
        row.expectedAction,
      );

      // The full gateway path — this is what acceptRescueForSurface used to
      // silently drop back to null before the registry fix.
      const result = rescue.rescue({
        prompt: row.prompt,
        action: 'unknown',
        params: {},
        surface: 'provider',
      });
      expect(result?.action).toBe(row.expectedAction);
    },
  );
});
