import {
  PUBLIC_ASSISTANT_COMPOUND_NEGATIVE_PROMPTS,
  PUBLIC_ASSISTANT_COMPOUND_PROMPTS,
  PUBLIC_ASSISTANT_COMPOUND_RECIPE_ID,
} from './ai-public-assistant-compound.fixtures.js';
import {
  decomposePublicAssistantCompoundPrompt,
  isPublicAssistantCompoundPrompt,
  rescuePublicAssistantCompoundIntent,
} from './ai-public-assistant-compound.util.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from './intent-decomposition.util.js';

describe('e2e-bug.100 public_assistant_compound registry examples', () => {
  it.each(
    PUBLIC_ASSISTANT_COMPOUND_PROMPTS.map((row) => [row.id, row] as const),
  )('detects and decomposes %s', (_id, row) => {
    expect(isPublicAssistantCompoundPrompt(row.prompt)).toBe(true);
    expect(isCompoundPrompt(row.prompt)).toBe(true);

    const steps = decomposePublicAssistantCompoundPrompt(row.prompt);
    expect(steps.map((s) => s.action)).toEqual([...row.orderedActions]);

    const decomposition = decomposeDeterministicForSurface(
      'public',
      row.prompt,
    );
    expect(decomposition?.recipeId).toBe(PUBLIC_ASSISTANT_COMPOUND_RECIPE_ID);
    expect(decomposition?.steps.map((s) => s.action)).toEqual([
      ...row.orderedActions,
    ]);
  });

  it.each(
    PUBLIC_ASSISTANT_COMPOUND_NEGATIVE_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('does not match single-intent %s', (_id, row) => {
    expect(isPublicAssistantCompoundPrompt(row.prompt)).toBe(false);
    expect(decomposePublicAssistantCompoundPrompt(row.prompt)).toEqual([]);
  });

  it.each(
    PUBLIC_ASSISTANT_COMPOUND_PROMPTS.filter((row) => row.misclassifiedAction).map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misroute for %s', (_id, row) => {
    const rescued = rescuePublicAssistantCompoundIntent(
      row.prompt,
      row.misclassifiedAction!,
    );
    expect(rescued).toEqual({
      action: 'compound_intent',
      rescueReason: 'public_assistant_compound',
    });
  });

  it('does not rescue when already compound_intent', () => {
    expect(
      rescuePublicAssistantCompoundIntent(
        'List providers and check availability',
        'compound_intent',
      ),
    ).toBeNull();
  });
});
