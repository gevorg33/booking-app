import {
  E2E346_LEGIT_NAMED_PROVIDER_CONTROL_CASES,
  E2E346_NON_PERSON_ABOUT_CASES,
} from './ai-e2e346-tell-me-about-this-noun-not-provider-name.fixtures.js';
import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';

describe('e2e-bug.346: "tell me about this/the/your <noun>" must not be captured as a named-provider specialty lookup', () => {
  it.each(E2E346_NON_PERSON_ABOUT_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(
        row.expectExplainProviderSpecialty,
      );
    },
  );

  it.each(
    E2E346_LEGIT_NAMED_PROVIDER_CONTROL_CASES.map(
      (row) => [row.id, row] as const,
    ),
  )('%s — legit named-provider phrasing unaffected', (_id, row) => {
    expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(
      row.expectExplainProviderSpecialty,
    );
  });
});
