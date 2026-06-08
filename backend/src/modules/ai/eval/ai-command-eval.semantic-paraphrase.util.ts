import { tokenizeForRag } from '../ai-rag.util.js';
import type { AiCommandEvalCase, AiEvalLocale } from './ai-command-eval.types.js';
import {
  SEMANTIC_PARAPHRASE_INTENT_BANK,
  SEMANTIC_PARAPHRASE_LOCALES,
  SEMANTIC_PARAPHRASE_MIN_PER_LOCALE,
  type SemanticParaphraseLocale,
} from './ai-command-eval.semantic-paraphrase.fixtures.js';

export {
  SEMANTIC_PARAPHRASE_INTENT_BANK,
  SEMANTIC_PARAPHRASE_LOCALES,
  SEMANTIC_PARAPHRASE_MIN_PER_LOCALE,
} from './ai-command-eval.semantic-paraphrase.fixtures.js';

export function normalizeParaphraseForDistinctness(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function tokenSignature(prompt: string): string {
  return tokenizeForRag(prompt).sort().join('|');
}

/** Assert prompts are lexically distinct within a locale/intent group. */
export function assertLexicallyDistinctParaphrases(
  prompts: readonly string[],
  label: string,
): string[] {
  const failures: string[] = [];
  const byNormalized = new Map<string, string>();
  const byTokens = new Map<string, string>();

  for (const prompt of prompts) {
    const normalized = normalizeParaphraseForDistinctness(prompt);
    if (byNormalized.has(normalized)) {
      failures.push(
        `${label}: duplicate normalized paraphrase "${prompt}" vs "${byNormalized.get(normalized)}"`,
      );
      continue;
    }
    byNormalized.set(normalized, prompt);

    const signature = tokenSignature(prompt);
    if (byTokens.has(signature)) {
      failures.push(
        `${label}: duplicate token signature "${prompt}" vs "${byTokens.get(signature)}"`,
      );
      continue;
    }
    byTokens.set(signature, prompt);
  }

  return failures;
}

export function buildSemanticParaphraseEvalCases(): AiCommandEvalCase[] {
  const cases: AiCommandEvalCase[] = [];

  for (const [action, config] of Object.entries(SEMANTIC_PARAPHRASE_INTENT_BANK)) {
    for (const locale of SEMANTIC_PARAPHRASE_LOCALES) {
      const prompts = config[locale];
      prompts.forEach((prompt, index) => {
        cases.push({
          id: `sem-${locale}-${action}-${index + 1}`,
          prompt,
          locale,
          surface: config.surface,
          corpus: 'semantic_paraphrase',
          difficulty: 'medium',
          domain: action.includes('booking') || action.includes('appointment')
            ? 'booking'
            : 'operations',
          semanticParaphrase: true,
          expect: {
            rescuedAction: action,
            rescueFromAction: 'unknown',
          },
        });
      });
    }
  }

  return cases;
}

export interface SemanticParaphraseCoverageReport {
  totalCases: number;
  intentCount: number;
  minPerLocale: number;
  byIntentLocale: Record<string, Partial<Record<SemanticParaphraseLocale, number>>>;
  parityPassed: boolean;
  distinctPassed: boolean;
  failures: string[];
}

export function buildSemanticParaphraseCoverageReport(
  cases: AiCommandEvalCase[] = buildSemanticParaphraseEvalCases(),
): SemanticParaphraseCoverageReport {
  const byIntentLocale: SemanticParaphraseCoverageReport['byIntentLocale'] = {};
  const failures: string[] = [];

  for (const [action, config] of Object.entries(SEMANTIC_PARAPHRASE_INTENT_BANK)) {
    byIntentLocale[action] = {};
    for (const locale of SEMANTIC_PARAPHRASE_LOCALES) {
      const prompts = config[locale];
      byIntentLocale[action]![locale] = prompts.length;

      if (prompts.length < SEMANTIC_PARAPHRASE_MIN_PER_LOCALE) {
        failures.push(
          `${action}/${locale}: expected >= ${SEMANTIC_PARAPHRASE_MIN_PER_LOCALE} paraphrases, got ${prompts.length}`,
        );
      }

      failures.push(
        ...assertLexicallyDistinctParaphrases(
          prompts,
          `${action}/${locale}`,
        ),
      );
    }
  }

  const corpusCases = cases.filter(
    (entry) => entry.corpus === 'semantic_paraphrase' || entry.semanticParaphrase,
  );
  if (corpusCases.length !== cases.length) {
    failures.push('semantic paraphrase corpus contains non-semantic rows');
  }

  for (const evalCase of corpusCases) {
    const action = evalCase.expect.rescuedAction ?? evalCase.expect.action;
    const locale = (evalCase.locale ?? 'en') as AiEvalLocale;
    if (!action) {
      failures.push(`${evalCase.id}: missing expected action`);
      continue;
    }
    if (!SEMANTIC_PARAPHRASE_LOCALES.includes(locale as SemanticParaphraseLocale)) {
      failures.push(`${evalCase.id}: unsupported locale ${locale}`);
    }
  }

  return {
    totalCases: cases.length,
    intentCount: Object.keys(SEMANTIC_PARAPHRASE_INTENT_BANK).length,
    minPerLocale: SEMANTIC_PARAPHRASE_MIN_PER_LOCALE,
    byIntentLocale,
    parityPassed: failures.filter((entry) => entry.includes('expected >=')).length === 0,
    distinctPassed: failures.filter((entry) => entry.includes('duplicate')).length === 0,
    failures,
  };
}

export function assertSemanticParaphraseCoverageGate(
  cases: AiCommandEvalCase[] = buildSemanticParaphraseEvalCases(),
): SemanticParaphraseCoverageReport {
  const report = buildSemanticParaphraseCoverageReport(cases);
  if (report.failures.length > 0) {
    throw new Error(
      `Semantic paraphrase coverage gate failed (acc-3.16):\n${report.failures.join('\n')}`,
    );
  }
  return report;
}

export function formatSemanticParaphraseCoverageReport(
  report: SemanticParaphraseCoverageReport,
): string {
  const lines = [
    `Semantic paraphrase corpus (acc-3.16): ${report.totalCases} cases across ${report.intentCount} intents`,
    `Minimum per locale: ${report.minPerLocale}`,
  ];
  for (const [action, locales] of Object.entries(report.byIntentLocale)) {
    const counts = SEMANTIC_PARAPHRASE_LOCALES.map(
      (locale) => `${locale}=${locales[locale] ?? 0}`,
    ).join(', ');
    lines.push(`- ${action}: ${counts}`);
  }
  if (report.failures.length > 0) {
    lines.push('Failures:');
    lines.push(...report.failures.map((entry) => `  - ${entry}`));
  }
  return lines.join('\n');
}
