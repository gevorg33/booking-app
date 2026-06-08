import { matchSemanticIntent } from '../ai-classification-engine.util.js';
import { SEMANTIC_PARAPHRASE_EVAL_CASES } from '../ai-classification-paraphrase.fixtures.js';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';

/** acc-3.16 — evaluate semantic matcher against paraphrase corpus. */
export function evaluateSemanticParaphraseEvalCase(
  evalCase: AiCommandEvalCase,
): AiEvalCaseResult {
  const errors: string[] = [];
  const expectedAction =
    evalCase.expect.rescuedAction ?? evalCase.expect.action;
  if (!expectedAction) {
    errors.push('semantic paraphrase case requires rescuedAction or action');
    return { id: evalCase.id, passed: false, errors };
  }

  const surface = evalCase.surface ?? 'dashboard';
  const match = matchSemanticIntent(evalCase.prompt, surface, {
    threshold: 0.35,
  });

  if (!match) {
    errors.push(`semantic match: expected ${expectedAction}, got none`);
  } else if (match.action !== expectedAction) {
    errors.push(
      `semantic match: expected ${expectedAction}, got ${match.action} (${match.matchedPhraseId})`,
    );
  }

  return {
    id: evalCase.id,
    passed: errors.length === 0,
    errors,
  };
}

export function runSemanticParaphraseEvalSuite(
  cases: AiCommandEvalCase[] = SEMANTIC_PARAPHRASE_EVAL_CASES,
): { passed: number; failed: number; results: AiEvalCaseResult[] } {
  const results = cases.map((entry) => evaluateSemanticParaphraseEvalCase(entry));
  const failed = results.filter((entry) => !entry.passed).length;
  return {
    passed: results.length - failed,
    failed,
    results,
  };
}

export { SEMANTIC_PARAPHRASE_EVAL_CASES };
