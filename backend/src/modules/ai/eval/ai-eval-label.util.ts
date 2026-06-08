import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import type { AiEvalLabelQueue } from '../entities/ai-eval-label-queue.entity.js';

export const DEFAULT_HARVESTED_CASES_FILE = join(
  process.cwd(),
  'src/modules/ai/eval/ai-command-eval.harvested.cases.ts',
);

export type AiEvalLabelOutcome = 'execution' | 'clarify';

export interface AiEvalLabelDraft {
  labelOutcome?: AiEvalLabelOutcome | null;
  expectedAction?: string | null;
  expectedRescuedAction?: string | null;
  rescueFromAction?: string | null;
  expectedParams?: Record<string, unknown> | null;
  expectedClarifyFields?: string[] | null;
}

export function buildEvalCaseId(row: AiEvalLabelQueue, businessId: string): string {
  return `harvest-${businessId.slice(0, 8)}-${row.promptHash.slice(0, 12)}`;
}

export function buildEvalCaseFromLabelQueueItem(
  row: AiEvalLabelQueue,
  businessId: string,
): AiCommandEvalCase {
  const id = row.evalCaseId ?? buildEvalCaseId(row, businessId);
  const labelOutcome = row.labelOutcome ?? 'execution';
  const locale = normalizeEvalLocale(row.locale);
  const surface = normalizeEvalSurface(row.surface);

  if (labelOutcome === 'clarify') {
    return {
      id,
      prompt: row.promptSnippet,
      locale,
      surface,
      corpus: 'harvested',
      difficulty: 'ambiguity',
      domain: inferDomain(row.classifiedAction),
      expect: {
        clarifyAction: row.classifiedAction,
        clarifyFields: row.expectedClarifyFields ?? undefined,
        classifiedParams: row.expectedParams ?? {},
        compoundExpectEmpty: true,
        compoundSurface: surface,
      },
    };
  }

  const rescuedAction =
    row.expectedRescuedAction ?? row.correctedAction ?? row.expectedAction ?? row.classifiedAction;
  const rescueFromAction =
    row.rescueFromAction ??
    (rescuedAction !== row.classifiedAction ? row.classifiedAction : undefined);

  return {
    id,
    prompt: row.promptSnippet,
    locale,
    surface,
    corpus: 'harvested',
    difficulty: 'medium',
    domain: inferDomain(rescuedAction),
    expect: {
      rescuedAction,
      ...(rescueFromAction ? { rescueFromAction } : {}),
      ...(row.expectedParams ? { paramsPartial: row.expectedParams } : {}),
    },
  };
}

export function formatEvalCaseFixtureSnippet(evalCase: AiCommandEvalCase): string {
  return `${JSON.stringify(evalCase, null, 2)},`;
}

export function formatHarvestedCasesModule(cases: AiCommandEvalCase[]): string {
  return `import type { AiCommandEvalCase } from './ai-command-eval.types.js';

/** acc-2.2 — production-labeled eval cases (append via AI Ops labeling tool). */
export const AI_COMMAND_EVAL_HARVESTED_CASES: AiCommandEvalCase[] = ${JSON.stringify(cases, null, 2)};
`;
}

export function parseHarvestedCasesFromModule(
  moduleSource: string,
): AiCommandEvalCase[] {
  const match = moduleSource.match(
    /export const AI_COMMAND_EVAL_HARVESTED_CASES[^=]*=\s*(\[[\s\S]*?\]);/,
  );
  if (!match?.[1]) return [];
  return JSON.parse(match[1]) as AiCommandEvalCase[];
}

export function appendEvalCaseToHarvestedCasesFile(
  evalCase: AiCommandEvalCase,
  casesFilePath = DEFAULT_HARVESTED_CASES_FILE,
): { appended: boolean; reason?: string; totalCases: number } {
  if (process.env.AI_EVAL_FIXTURE_APPEND !== '1') {
    return {
      appended: false,
      reason: 'Set AI_EVAL_FIXTURE_APPEND=1 to write golden eval fixtures from the labeling tool.',
      totalCases: 0,
    };
  }

  const source = readFileSync(casesFilePath, 'utf8');
  const existing = parseHarvestedCasesFromModule(source);
  if (existing.some((entry) => entry.id === evalCase.id)) {
    return {
      appended: false,
      reason: `Eval case ${evalCase.id} is already in harvested fixtures.`,
      totalCases: existing.length,
    };
  }

  const nextCases = [...existing, evalCase];
  writeFileSync(casesFilePath, formatHarvestedCasesModule(nextCases), 'utf8');
  return { appended: true, totalCases: nextCases.length };
}

function normalizeEvalLocale(locale: string): AiCommandEvalCase['locale'] {
  if (locale === 'hy' || locale === 'ru' || locale === 'translit') return locale;
  return 'en';
}

function normalizeEvalSurface(
  surface: string,
): AiCommandEvalCase['surface'] {
  if (
    surface === 'dashboard' ||
    surface === 'provider' ||
    surface === 'customer' ||
    surface === 'public'
  ) {
    return surface;
  }
  return 'dashboard';
}

function inferDomain(action: string): string {
  if (action.includes('booking') || action.includes('slot')) return 'booking';
  if (action.includes('payment') || action.includes('revenue')) return 'payments';
  if (action.includes('customer') || action.includes('crm')) return 'crm';
  if (action.includes('schedule') || action.includes('clear')) return 'schedule';
  if (action.includes('clinic') || action.includes('test')) return 'clinic';
  return 'booking';
}

export function applyLabelDraftToQueueRow(
  row: AiEvalLabelQueue,
  draft: AiEvalLabelDraft,
): void {
  if (draft.labelOutcome !== undefined && draft.labelOutcome !== null) {
    row.labelOutcome = draft.labelOutcome;
  }
  if (draft.expectedAction !== undefined) {
    row.expectedAction = draft.expectedAction;
  }
  if (draft.expectedRescuedAction !== undefined) {
    row.expectedRescuedAction = draft.expectedRescuedAction;
  }
  if (draft.rescueFromAction !== undefined) {
    row.rescueFromAction = draft.rescueFromAction;
  }
  if (draft.expectedParams !== undefined) {
    row.expectedParams = draft.expectedParams;
  }
  if (draft.expectedClarifyFields !== undefined) {
    row.expectedClarifyFields = draft.expectedClarifyFields;
  }
}
