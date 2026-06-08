import {
  AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES,
} from './ai-n99-no-clarify.eval.util.js';
import { N99_NO_CLARIFY_AUTOFILL_SCENARIOS } from '../ai-n99-no-clarify-completion.fixtures.js';

describe('ai-n99-no-clarify.eval.util', () => {
  it('exports one eval case per autofill/guard/over-ask scenario', () => {
    expect(AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES.length).toBeGreaterThanOrEqual(
      N99_NO_CLARIFY_AUTOFILL_SCENARIOS.length,
    );
    expect(
      AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES.every((entry) => entry.corpus === 'no_clarify'),
    ).toBe(true);
  });
});
