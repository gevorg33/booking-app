import {
  EXPLAIN_WHY_SIGN_IN_PROMPTS,
  EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS,
} from './ai-explain-why-sign-in.fixtures.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS } from './ai-explain-why-sign-in-multilingual.fixtures.js';
import { rescueExplainWhySignInIntent } from './ai-explain-why-sign-in.util.js';

describe('customer explain_why_sign_in integration (ai-cmd-customer-4.17.1)', () => {
  it.each(
    [
      ...EXPLAIN_WHY_SIGN_IN_PROMPTS,
      ...EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_why_sign_in for $0', (_id, prompt) => {
    expect(rescueExplainWhySignInIntent(prompt, 'unknown')?.action).toBe(
      'explain_why_sign_in',
    );
  });

  it.each(EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainWhySignInIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_why_sign_in');
    },
  );
});
