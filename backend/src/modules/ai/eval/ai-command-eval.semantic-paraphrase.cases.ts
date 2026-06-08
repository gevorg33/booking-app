import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import { buildSemanticParaphraseEvalCases } from './ai-command-eval.semantic-paraphrase.util.js';

/** acc-3.12 / acc-3.16 — semantic paraphrase eval rows (append via labeling/harvest, no matcher code changes). */
export const AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES: AiCommandEvalCase[] =
  buildSemanticParaphraseEvalCases();
