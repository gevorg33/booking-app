import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type {
  ClassificationSurface,
  SemanticPhraseEntry,
} from './ai-classification-engine.types.js';

export type SemanticPhraseSource =
  | 'canonical'
  | 'eval_paraphrase'
  | 'harvested'
  | 'business_learned';

export interface StoredSemanticPhrasingBank {
  version: number;
  updatedAt?: string;
  note?: string;
  phrases: SemanticPhraseEntry[];
}

export const DEFAULT_SEMANTIC_PHRASING_BANK_PATH = join(
  process.cwd(),
  'src/modules/ai/ai-semantic-phrasing-bank.json',
);

const DIST_SEMANTIC_PHRASING_BANK_PATH = join(
  process.cwd(),
  'dist/modules/ai/ai-semantic-phrasing-bank.json',
);

let storedBankCache: SemanticPhraseEntry[] | null = null;
let evalDerivedCache: SemanticPhraseEntry[] | null = null;

export function hashSemanticPhrase(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

export function resolveSemanticPhraseBankPath(
  bankPath = DEFAULT_SEMANTIC_PHRASING_BANK_PATH,
): string {
  if (existsSync(bankPath)) return bankPath;
  if (existsSync(DIST_SEMANTIC_PHRASING_BANK_PATH)) {
    return DIST_SEMANTIC_PHRASING_BANK_PATH;
  }
  return bankPath;
}

export function parseStoredSemanticPhrasingBank(
  raw: string,
): StoredSemanticPhrasingBank {
  const parsed = JSON.parse(raw) as StoredSemanticPhrasingBank;
  if (!Array.isArray(parsed.phrases)) {
    throw new Error('ai-semantic-phrasing-bank.json must include phrases[]');
  }
  return parsed;
}

/** acc-3.12 — load canonical EN/HY/RU utterances from committed JSON bank. */
export function loadStoredCanonicalPhrasingBank(
  bankPath = DEFAULT_SEMANTIC_PHRASING_BANK_PATH,
): SemanticPhraseEntry[] {
  if (storedBankCache) return storedBankCache;

  const resolvedPath = resolveSemanticPhraseBankPath(bankPath);
  const raw = readFileSync(resolvedPath, 'utf8');
  const parsed = parseStoredSemanticPhrasingBank(raw);
  storedBankCache = parsed.phrases.map((entry) => ({
    ...entry,
    source: entry.source ?? 'canonical',
  }));
  return storedBankCache;
}

/** Eval cases eligible for semantic phrasing bank (no code changes beyond eval rows). */
export function isSemanticParaphraseEvalCase(
  evalCase: AiCommandEvalCase,
): boolean {
  if (evalCase.semanticParaphrase === true) return true;
  if (evalCase.corpus === 'semantic_paraphrase') return true;
  if (/^sem(-|$)/.test(evalCase.id)) return true;
  return false;
}

export function resolveSemanticActionFromEvalCase(
  evalCase: AiCommandEvalCase,
): string | null {
  const action =
    evalCase.expect.rescuedAction ??
    evalCase.expect.action ??
    null;
  if (!action || action === 'unknown') return null;
  return action;
}

export function evalCaseToSemanticPhraseEntry(
  evalCase: AiCommandEvalCase,
): SemanticPhraseEntry | null {
  if (!isSemanticParaphraseEvalCase(evalCase)) return null;
  const action = resolveSemanticActionFromEvalCase(evalCase);
  if (!action) return null;

  return {
    id: evalCase.id,
    action,
    surface: evalCase.surface ?? 'dashboard',
    phrase: evalCase.prompt,
    locale: evalCase.locale,
    source:
      evalCase.corpus === 'harvested'
        ? 'harvested'
        : ('eval_paraphrase' as const),
  };
}

function loadEvalSemanticParaphraseCases(): AiCommandEvalCase[] {
  const semanticModule = require('./eval/ai-command-eval.semantic-paraphrase.cases.js') as {
    AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES: AiCommandEvalCase[];
  };
  const harvestedModule = require('./eval/ai-command-eval.harvested.cases.js') as {
    AI_COMMAND_EVAL_HARVESTED_CASES: AiCommandEvalCase[];
  };

  return [
    ...semanticModule.AI_COMMAND_EVAL_SEMANTIC_PARAPHRASE_CASES,
    ...harvestedModule.AI_COMMAND_EVAL_HARVESTED_CASES.filter(
      isSemanticParaphraseEvalCase,
    ),
  ];
}

/** acc-3.12 — eval/harvest rows merged into phrasing bank without matcher code changes. */
export function loadEvalDerivedSemanticPhrases(): SemanticPhraseEntry[] {
  if (evalDerivedCache) return evalDerivedCache;

  const byPhraseHash = new Map<string, SemanticPhraseEntry>();
  for (const evalCase of loadEvalSemanticParaphraseCases()) {
    const entry = evalCaseToSemanticPhraseEntry(evalCase);
    if (!entry) continue;
    byPhraseHash.set(hashSemanticPhrase(entry.phrase), entry);
  }

  evalDerivedCache = [...byPhraseHash.values()];
  return evalDerivedCache;
}

export function mergeSemanticPhraseBank(
  entries: SemanticPhraseEntry[],
): SemanticPhraseEntry[] {
  const byId = new Map<string, SemanticPhraseEntry>();
  for (const entry of entries) {
    byId.set(entry.id, entry);
  }
  return [...byId.values()];
}

/** Full semantic phrasing bank: stored canonical JSON + eval pipeline rows. */
export function buildSemanticPhrasingBank(
  surface?: ClassificationSurface,
  businessParaphrases: SemanticPhraseEntry[] = [],
): SemanticPhraseEntry[] {
  const merged = mergeSemanticPhraseBank([
    ...businessParaphrases,
    ...loadStoredCanonicalPhrasingBank(),
    ...loadEvalDerivedSemanticPhrases(),
  ]);
  return surface ? merged.filter((entry) => entry.surface === surface) : merged;
}

export function summarizeSemanticPhrasingBank(
  bank: SemanticPhraseEntry[] = buildSemanticPhrasingBank(),
): {
  total: number;
  byLocale: Record<string, number>;
  byAction: Record<string, number>;
  bySource: Record<string, number>;
} {
  const byLocale: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const entry of bank) {
    const locale = entry.locale ?? 'en';
    byLocale[locale] = (byLocale[locale] ?? 0) + 1;
    byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
    const source = entry.source ?? 'canonical';
    bySource[source] = (bySource[source] ?? 0) + 1;
  }

  return { total: bank.length, byLocale, byAction, bySource };
}

/** @deprecated Use buildSemanticPhrasingBank — kept for acc-3.11 callers. */
export function buildSemanticIntentPhraseBank(
  surface?: ClassificationSurface,
): SemanticPhraseEntry[] {
  return buildSemanticPhrasingBank(surface);
}

export function resetSemanticPhrasingBankCachesForTests(): void {
  storedBankCache = null;
  evalDerivedCache = null;
}
