/**
 * e2e-bug.346 — "tell me about"/"learn about" + "this/the/your <noun>" must
 * never be captured as a named-provider specialty lookup. `hasNamedProviderCue`
 * matched "tell me about" for any following text, gated only by the
 * e2e-bug.191 salon/business exclusion — so "this booking" (or any other
 * non-person noun) fell through and got treated as a provider name. Fixed by
 * a general determiner check: a capture led by "this/the/your" is a noun
 * reference, not a person's name, regardless of which noun follows. Also
 * closes the same recurring gap noted for "the wine tour" (task #259).
 */

export type E2e346NonPersonAboutCase = {
  id: string;
  prompt: string;
  expectExplainProviderSpecialty: boolean;
};

export const E2E346_NON_PERSON_ABOUT_CASES: readonly E2e346NonPersonAboutCase[] =
  [
    {
      id: 'e346-exact-reported-repro-this-booking',
      prompt: 'Tell me about this booking',
      expectExplainProviderSpecialty: false,
    },
    {
      id: 'e346-the-wine-tour',
      prompt: 'Tell me about the wine tour',
      expectExplainProviderSpecialty: false,
    },
    {
      id: 'e346-your-membership',
      prompt: 'Learn more about your membership',
      expectExplainProviderSpecialty: false,
    },
    {
      id: 'e346-this-appointment',
      prompt: 'Tell me about this appointment',
      expectExplainProviderSpecialty: false,
    },
  ] as const;

/** Controls — legitimate named-provider "tell me about"/"learn about" phrasing must be unaffected. */
export const E2E346_LEGIT_NAMED_PROVIDER_CONTROL_CASES: readonly E2e346NonPersonAboutCase[] =
  [
    {
      id: 'e346-legit-tell-me-about-anna',
      prompt: 'Tell me about Anna',
      expectExplainProviderSpecialty: true,
    },
    {
      id: 'e346-legit-learn-about-sophie',
      prompt: 'Learn about Sophie',
      expectExplainProviderSpecialty: true,
    },
  ] as const;
