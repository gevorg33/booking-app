import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { SemanticPhraseEntry } from './ai-classification-engine.types.js';
import { AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES } from './eval/ai-command-eval.semantic-paraphrase.cases.js';

/** @deprecated Import AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES — kept for acc-3.16 eval imports. */
export const SEMANTIC_PARAPHRASE_EVAL_CASES: AiCommandEvalCase[] =
  AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES;

export function buildSemanticParaphraseBank(): SemanticPhraseEntry[] {
  return SEMANTIC_PARAPHRASE_EVAL_CASES.map((entry) => ({
    id: entry.id,
    action: entry.expect.rescuedAction ?? entry.expect.action ?? 'unknown',
    surface: entry.surface ?? 'dashboard',
    phrase: entry.prompt,
    locale: entry.locale,
    source: 'eval_paraphrase' as const,
  }));
}

export { AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES };
