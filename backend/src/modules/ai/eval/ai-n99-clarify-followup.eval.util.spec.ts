import {
  AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES,
} from './ai-n99-clarify-followup.eval.util.js';
import { N99_CLARIFY_FOLLOWUP_SCENARIOS } from '../ai-n99-clarify-success.fixtures.js';

describe('ai-n99-clarify-followup.eval.util', () => {
  it('maps every n99 clarify follow-up scenario to eval cases', () => {
    expect(AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES).toHaveLength(
      N99_CLARIFY_FOLLOWUP_SCENARIOS.length,
    );
    expect(AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES.every(
      (entry) => entry.corpus === 'clarify_followup',
    )).toBe(true);
  });
});
