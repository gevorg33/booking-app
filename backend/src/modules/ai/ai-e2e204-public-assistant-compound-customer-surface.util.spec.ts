import { buildCompoundCommandRecipes } from './ai-command-registry.build.js';
import {
  decomposePublicAssistantCompoundPrompt,
  isPublicAssistantCompoundPrompt,
  rescuePublicAssistantCompoundIntent,
} from './ai-public-assistant-compound.util.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERN_IDS,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import {
  E2E204_COMPOUND_MUST_REACH,
  E2E204_GOLDEN_CUSTOMER_ID,
  E2E204_GOLDEN_PUBLIC_ID,
  E2E204_NEGATIVE_MUST_STAY_SINGLE,
  E2E204_RECIPE_ID,
} from './ai-e2e204-public-assistant-compound-customer-surface.fixtures.js';

describe('e2e-bug.204 public_assistant_compound on customer surface', () => {
  it('registers recipe on both public and customer surfaces', () => {
    const recipe = buildCompoundCommandRecipes().find(
      (r) => r.id === E2E204_RECIPE_ID,
    );
    expect(recipe).toBeDefined();
    expect(recipe?.surfaces).toEqual(
      expect.arrayContaining(['public', 'customer']),
    );
  });

  it('exposes golden patterns for public and customer', () => {
    expect(GOLDEN_COMPOUND_PATTERN_IDS).toContain(E2E204_GOLDEN_CUSTOMER_ID);
    expect(GOLDEN_COMPOUND_PATTERN_IDS).toContain(E2E204_GOLDEN_PUBLIC_ID);
    expect(
      GOLDEN_COMPOUND_PATTERNS.find((p) => p.id === E2E204_GOLDEN_CUSTOMER_ID)
        ?.recipeId,
    ).toBe(E2E204_RECIPE_ID);
    expect(
      GOLDEN_COMPOUND_PATTERNS.find((p) => p.id === E2E204_GOLDEN_PUBLIC_ID)
        ?.recipeId,
    ).toBe(E2E204_RECIPE_ID);
  });

  it.each(E2E204_COMPOUND_MUST_REACH.map((row) => [row.id, row] as const))(
    'customer surface decomposes %s',
    (_id, row) => {
      expect(isPublicAssistantCompoundPrompt(row.prompt)).toBe(true);
      expect(
        decomposePublicAssistantCompoundPrompt(row.prompt).map((s) => s.action),
      ).toEqual([...row.orderedActions]);

      const customer = decomposeDeterministicForSurface('customer', row.prompt);
      expect(customer?.recipeId).toBe(E2E204_RECIPE_ID);
      expect(customer?.steps.map((s) => s.action)).toEqual([
        ...row.orderedActions,
      ]);

      const pub = decomposeDeterministicForSurface('public', row.prompt);
      expect(pub?.recipeId).toBe(E2E204_RECIPE_ID);
      expect(pub?.steps.map((s) => s.action)).toEqual([...row.orderedActions]);
    },
  );

  it.each(
    E2E204_COMPOUND_MUST_REACH.filter((row) => row.formerSteal).map(
      (row) => [row.id, row] as const,
    ),
  )('rescues former steal for %s', (_id, row) => {
    expect(
      rescuePublicAssistantCompoundIntent(row.prompt, row.formerSteal!),
    ).toEqual({
      action: 'compound_intent',
      rescueReason: 'public_assistant_compound',
    });
  });

  it.each(
    E2E204_NEGATIVE_MUST_STAY_SINGLE.map((row) => [row.id, row] as const),
  )('negative stays non-compound for %s', (_id, row) => {
    expect(isPublicAssistantCompoundPrompt(row.prompt)).toBe(false);
    expect(decomposePublicAssistantCompoundPrompt(row.prompt)).toEqual([]);
    expect(
      decomposeDeterministicForSurface('customer', row.prompt)?.recipeId,
    ).not.toBe(E2E204_RECIPE_ID);
  });
});
