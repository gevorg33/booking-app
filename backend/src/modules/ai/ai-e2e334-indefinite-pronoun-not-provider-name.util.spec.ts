import {
  E2E334_INDEFINITE_PRONOUN_CASES,
  E2E334_NAMED_PROVIDER_REGRESSION_CASES,
} from './ai-e2e334-indefinite-pronoun-not-provider-name.fixtures.js';
import {
  extractProviderNameForAvailabilityPrompt,
  isExplainProviderAvailabilityPrompt,
} from './ai-explain-provider-availability.util.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';

describe('e2e-bug.334: indefinite pronouns are never resolved as a provider name', () => {
  it.each(E2E334_INDEFINITE_PRONOUN_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, scenario) => {
      expect(
        extractProviderNameForAvailabilityPrompt(scenario.prompt),
      ).toBeNull();
      expect(isExplainProviderAvailabilityPrompt(scenario.prompt)).toBe(false);
      expect(isCheckProvidersForServicePrompt(scenario.prompt)).toBe(true);
    },
  );

  it.each(
    E2E334_NAMED_PROVIDER_REGRESSION_CASES.map((row) => [row.id, row] as const),
  )('%s keeps resolving a real provider name', (_id, scenario) => {
    expect(extractProviderNameForAvailabilityPrompt(scenario.prompt)).toBe(
      scenario.expectedName,
    );
    expect(isExplainProviderAvailabilityPrompt(scenario.prompt)).toBe(true);
  });
});
