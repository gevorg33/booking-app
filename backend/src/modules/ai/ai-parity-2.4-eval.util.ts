import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiCommandEvalCase, AiEvalLocale } from './eval/ai-command-eval.types.js';
import {
  PARITY_24_INTENT_SPECS,
  parity24SpecKey,
  type Parity24IntentSpec,
} from './ai-parity-2.4-eval.fixtures.js';

export const PARITY_24_REQUIRED_LOCALES: readonly AiEvalLocale[] = ['en', 'hy', 'ru'];

export interface Parity24EvalStatus {
  complete: boolean;
  errors: string[];
  requiredSpecs: number;
  coveredSpecs: number;
  totalCases: number;
}

function isParity24EvalCase(evalCase: AiCommandEvalCase): boolean {
  return evalCase.id.startsWith('parity24-');
}

export function listParity24EvalCases(
  cases: readonly AiCommandEvalCase[],
): AiCommandEvalCase[] {
  return cases.filter(isParity24EvalCase);
}

export function assertParity24EvalComplete(
  allCases: readonly AiCommandEvalCase[],
): Parity24EvalStatus {
  const parityCases = listParity24EvalCases(allCases);
  const errors: string[] = [];
  let coveredSpecs = 0;

  for (const spec of PARITY_24_INTENT_SPECS) {
    const key = parity24SpecKey(spec);
    const matching = parityCases.filter(
      (entry) =>
        entry.surface === spec.surface &&
        (entry.expect.rescuedAction === spec.intent ||
          entry.expect.action === spec.intent),
    );
    if (matching.length === 0) {
      errors.push(`${key}: no eval cases`);
      continue;
    }

    let specOk = true;
    for (const locale of PARITY_24_REQUIRED_LOCALES) {
      const localeCase = matching.find((entry) => entry.locale === locale);
      if (!localeCase) {
        errors.push(`${key}: missing locale ${locale}`);
        specOk = false;
        continue;
      }
      if (localeCase.accessTier !== spec.accessTier) {
        errors.push(
          `${localeCase.id}: accessTier ${localeCase.accessTier ?? 'unset'} expected ${spec.accessTier}`,
        );
        specOk = false;
      }
      if (localeCase.surface !== spec.surface) {
        errors.push(
          `${localeCase.id}: surface ${localeCase.surface} expected ${spec.surface}`,
        );
        specOk = false;
      }
    }

    if (specOk) coveredSpecs += 1;
  }

  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  for (const evalCase of parityCases) {
    if (seenIds.has(evalCase.id)) duplicateIds.add(evalCase.id);
    seenIds.add(evalCase.id);
  }
  for (const id of duplicateIds) {
    errors.push(`duplicate eval id ${id}`);
  }

  return {
    complete: errors.length === 0,
    errors,
    requiredSpecs: PARITY_24_INTENT_SPECS.length,
    coveredSpecs,
    totalCases: parityCases.length,
  };
}

export function formatParity24EvalReport(status: Parity24EvalStatus): string {
  const lines = [
    'AI Feature Parity Eval Coverage (parity-2.4)',
    `Status: ${status.complete ? 'PASS' : 'FAIL'}`,
    `Intent/surface specs: ${status.coveredSpecs}/${status.requiredSpecs}`,
    `Eval cases: ${status.totalCases}`,
    `Locales required: ${PARITY_24_REQUIRED_LOCALES.join(', ')}`,
  ];
  if (status.errors.length > 0) {
    lines.push('', 'Issues:');
    for (const error of status.errors.slice(0, 30)) {
      lines.push(`  - ${error}`);
    }
  }
  return lines.join('\n');
}

/** Test helper — lookup spec for an intent on a surface. */
export function findParity24IntentSpec(
  intent: string,
  surface: CommandSurface,
): Parity24IntentSpec | undefined {
  return PARITY_24_INTENT_SPECS.find(
    (spec) => spec.intent === intent && spec.surface === surface,
  );
}

export function expectedParity24AccessTier(
  intent: string,
  surface: CommandSurface,
): AccessTier | undefined {
  return findParity24IntentSpec(intent, surface)?.accessTier;
}
