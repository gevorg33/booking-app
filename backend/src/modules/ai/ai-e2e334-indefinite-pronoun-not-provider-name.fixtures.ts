/**
 * e2e-bug.334 — indefinite pronouns ("anyone", "anybody", "someone",
 * "somebody", "everyone", "everybody") must never be resolved as a literal
 * provider name. `NAMED_SCHEDULE_PATTERNS` (ai-explain-provider-availability.util.ts)
 * captures "is X free/available" generically, and `PROVIDER_NAME_BLOCKLIST`
 * didn't exclude these pronouns — so "is anyone free tomorrow morning for
 * Swedish massage" was treated as a named-schedule lookup for employee
 * "anyone" (`"I couldn't find \"anyone\". Available specialists: …"`)
 * instead of a team-wide availability check.
 */

export type E2e334PronounCase = {
  id: string;
  prompt: string;
};

/** Every indefinite pronoun × the two named-schedule-triggering verbs. */
export const E2E334_INDEFINITE_PRONOUN_CASES: readonly E2e334PronounCase[] = [
  {
    id: 'anyone-free',
    prompt: 'is anyone free tomorrow morning for Swedish massage',
  },
  {
    id: 'anyone-available',
    prompt: 'is anyone available this afternoon for a haircut',
  },
  {
    id: 'anybody-free',
    prompt: 'is anybody free tomorrow for Deep tissue massage',
  },
  {
    id: 'somebody-available',
    prompt: 'is somebody available today for a facial',
  },
  {
    id: 'someone-free',
    prompt: 'is someone free this evening for Swedish massage',
  },
  { id: 'everybody-free', prompt: 'is everybody free tomorrow morning' },
  {
    id: 'everyone-available',
    prompt: 'is everyone available this week for a haircut',
  },
] as const;

export type E2e334NamedProviderCase = {
  id: string;
  prompt: string;
  expectedName: string;
};

/** Regression: real named-provider asks must still resolve correctly. */
export const E2E334_NAMED_PROVIDER_REGRESSION_CASES: readonly E2e334NamedProviderCase[] =
  [
    {
      id: 'named-karo-free',
      prompt: 'is Karo Mazmanyan free tomorrow for Swedish massage',
      expectedName: 'Karo Mazmanyan',
    },
    {
      id: 'named-gevorg-available',
      prompt: 'is Gevorg available this afternoon',
      expectedName: 'Gevorg',
    },
  ] as const;
