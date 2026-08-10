import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  LIST_PROVIDERS_NEGATIVE_PROMPTS,
  LIST_PROVIDERS_PROMPTS,
  LIST_PROVIDERS_RESCUE_SCENARIOS,
} from './ai-list-providers.fixtures.js';
import {
  isListProvidersPrompt,
  rescueListProvidersIntent,
} from './ai-list-providers.util.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';

describe('e2e-bug.189 list_providers roster (not check_providers_for_service)', () => {
  const rescue = new AiIntentRescueService();

  it.each(LIST_PROVIDERS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects roster prompt %s',
    (_id, row) => {
      expect(isListProvidersPrompt(row.prompt)).toBe(true);
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(false);
    },
  );

  it.each(LIST_PROVIDERS_NEGATIVE_PROMPTS.map((row) => [row.id, row] as const))(
    'does not treat availability/rank as roster %s',
    (_id, row) => {
      expect(isListProvidersPrompt(row.prompt)).toBe(false);
    },
  );

  it.each(LIST_PROVIDERS_RESCUE_SCENARIOS.map((row) => [row.id, row] as const))(
    'rescues %s to list_providers',
    (_id, row) => {
      expect(
        rescueListProvidersIntent(row.prompt, row.misclassifiedAction),
      ).toEqual({
        action: 'list_providers',
        rescueReason: 'list_providers_roster',
      });

      const result = rescue.rescue({
        prompt: row.prompt,
        action: row.misclassifiedAction,
        params: {},
        surface: row.surface,
      });
      expect(result?.action).toBe(row.expectedAction);
      expect(result?.rescueReason).toBe('list_providers_roster');
    },
  );

  it('does not re-rescue when already list_providers', () => {
    expect(
      rescueListProvidersIntent('Who are your providers?', 'list_providers'),
    ).toBeNull();
  });

  it('payments rescue does not steal roster into check_providers_for_service', () => {
    expect(isCheckProvidersForServicePrompt('Who are your providers?')).toBe(
      false,
    );
    expect(
      isCheckProvidersForServicePrompt('Who are your providers / specialists?'),
    ).toBe(false);
    expect(isCheckProvidersForServicePrompt('list all specialists')).toBe(
      false,
    );
  });
});
