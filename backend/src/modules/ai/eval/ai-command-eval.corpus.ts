import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import { buildAdversarialCorpusEvalCases } from './ai-command-eval.adversarial.util.js';
import { buildAmbiguityCorpusEvalCases } from './ai-command-eval.ambiguity.util.js';
import { buildTypoCorpusEvalCases } from './ai-command-eval.corpus.util.js';

/** acc-2.7 — prompts blocked by security preflight or enforceAction (eval-filtered). */
export const AI_COMMAND_EVAL_ADVERSARIAL_CASES: AiCommandEvalCase[] =
  buildAdversarialCorpusEvalCases();

/** acc-2.6 — prompts that should trigger clarify with expected fields, not execution. */
export const AI_COMMAND_EVAL_AMBIGUITY_CASES: AiCommandEvalCase[] =
  buildAmbiguityCorpusEvalCases();

/** acc-2.5 — typo/fuzzy variants of top stable rescue prompts (eval-filtered). */
export const AI_COMMAND_EVAL_TYPO_FUZZY_CASES: AiCommandEvalCase[] =
  buildTypoCorpusEvalCases();

export const AI_COMMAND_EVAL_CORPUS_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_ADVERSARIAL_CASES,
  ...AI_COMMAND_EVAL_AMBIGUITY_CASES,
  ...AI_COMMAND_EVAL_TYPO_FUZZY_CASES,
];
