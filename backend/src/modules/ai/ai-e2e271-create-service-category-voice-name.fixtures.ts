/**
 * e2e-bug.271 — voice "named X … please" must keep trailing name tokens
 * (unique suffixes), not truncate to the first word via classifier categoryName.
 */

export type E2e271VoiceCategoryCase = {
  id: string;
  prompt: string;
  /** Expected categoryName after extract / reconcile (full, no please). */
  expectedCategoryName: string;
  /** Simulated short classifier fragment that used to win. */
  classifierCategoryName?: string;
};

export const E2E271_VOICE_CATEGORY_NAME_CASES: readonly E2e271VoiceCategoryCase[] =
  [
    {
      id: 'ai-e2e271-brows-suffix-please',
      prompt: 'add catalog category named brows E2E271-abc123 please',
      expectedCategoryName: 'brows E2E271-abc123',
      classifierCategoryName: 'brows',
    },
    {
      id: 'ai-e2e271-brows-please-only',
      prompt: 'add catalog category named brows please',
      expectedCategoryName: 'brows',
      classifierCategoryName: 'brows',
    },
    {
      id: 'ai-e2e271-qa-nails-suffix',
      prompt: 'Add a new catalog category named QA Nails E2E271-xyz',
      expectedCategoryName: 'QA Nails E2E271-xyz',
      classifierCategoryName: 'QA Nails',
    },
    {
      id: 'ai-e2e271-spa-treatments-please',
      prompt: 'Create a catalog category named Spa Treatments please.',
      expectedCategoryName: 'Spa Treatments',
      classifierCategoryName: 'Spa',
    },
    {
      id: 'ai-e2e271-lash-lift-question',
      prompt: 'Can you add a new catalog category named Lash Lift E2E271-1?',
      expectedCategoryName: 'Lash Lift E2E271-1',
      classifierCategoryName: 'Lash',
    },
    {
      id: 'ai-e2e271-wellness-thanks',
      prompt: 'Add a new catalog category called Wellness E2E271-w thanks',
      expectedCategoryName: 'Wellness E2E271-w',
      classifierCategoryName: 'Wellness',
    },
    {
      id: 'ai-e2e271-service-category-voice',
      prompt: 'add service category named Color E2E271-c please',
      expectedCategoryName: 'Color E2E271-c',
      classifierCategoryName: 'Color',
    },
    {
      id: 'ai-e2e271-quoted-name',
      prompt: 'Create catalog category "QA E2E271 Cats"',
      expectedCategoryName: 'QA E2E271 Cats',
      classifierCategoryName: 'QA',
    },
    {
      id: 'ai-e2e271-thank-you',
      prompt: 'Add a new category named Pedicure E2E271-p thank you',
      expectedCategoryName: 'Pedicure E2E271-p',
      classifierCategoryName: 'Pedicure',
    },
    {
      id: 'ai-e2e271-makeup-pls',
      prompt: 'Create a new catalog category named Makeup E2E271-m pls',
      expectedCategoryName: 'Makeup E2E271-m',
      classifierCategoryName: 'Makeup',
    },
  ] as const;
