import {
  TYPO_CORPUS_ENTRIES,
  type TypoCorpusEntry,
} from './ai-typo-corpus.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function typoCorpusEvalCaseId(
  entry: Pick<TypoCorpusEntry, 'id'>,
): string {
  return `typo-corpus-${entry.id}`;
}

export function typoCorpusEntryToEvalCase(
  entry: TypoCorpusEntry,
): AiCommandEvalCase {
  return {
    id: typoCorpusEvalCaseId(entry),
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: entry.expect,
  };
}

export const AI_COMMAND_EVAL_TYPO_CORPUS_CASES: AiCommandEvalCase[] =
  TYPO_CORPUS_ENTRIES.map(typoCorpusEntryToEvalCase);
