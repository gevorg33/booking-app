import {
  CLASSIFICATION_AB_VARIANTS,
} from './ai-classification-engine.fixtures.js';
import {
  buildClassifierAppendix,
  retrieveFewShotExamples,
} from './ai-classification-engine.util.js';
import { DEFAULT_FEWSHOT_LIMIT } from './ai-classification-fewshot.util.js';
import type { AiSettings } from './ai-settings.types.js';
import {
  assignAbVariant,
  pickActiveClassificationAbExperiment,
} from './ai-platform.util.js';
import {
  CLASSIFICATION_AB_EXPERIMENT_ID,
  CLASSIFICATION_AB_PROBE_CASES,
  type ClassificationAbProbeCase,
} from './ai-classification-ab-harness.fixtures.js';

export type ClassificationAbVariantKey = keyof typeof CLASSIFICATION_AB_VARIANTS;

export interface ClassificationAbProbeResult {
  caseId: string;
  variantKey: ClassificationAbVariantKey;
  variantId: string;
  passed: boolean;
  shortlistHit: boolean;
  fewShotHit: boolean;
  errors: string[];
}

export interface ClassificationAbVariantScore {
  variantKey: ClassificationAbVariantKey;
  variantId: string;
  label: string;
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  shortlistAccuracy: number;
  fewShotAccuracy: number;
  results: ClassificationAbProbeResult[];
}

export interface ClassificationAbHarnessReport {
  generatedAt: string;
  probeCount: number;
  scores: ClassificationAbVariantScore[];
  winner: ClassificationAbVariantKey;
  promotedVariantId: string;
  tieBreakApplied: boolean;
  promotionNote: string;
}

export const CLASSIFICATION_AB_VARIANT_KEYS = Object.keys(
  CLASSIFICATION_AB_VARIANTS,
) as ClassificationAbVariantKey[];

export function resolveFewShotLimitForAbVariant(
  variantKey: ClassificationAbVariantKey,
): number {
  return variantKey === 'fewshot_heavy'
    ? DEFAULT_FEWSHOT_LIMIT + 2
    : DEFAULT_FEWSHOT_LIMIT;
}

/** Score one probe prompt for a single appendix variant. */
export function evaluateClassificationAbProbe(
  probe: ClassificationAbProbeCase,
  variantKey: ClassificationAbVariantKey,
): ClassificationAbProbeResult {
  const variantId = CLASSIFICATION_AB_VARIANTS[variantKey].id;
  const errors: string[] = [];
  const appendix = buildClassifierAppendix({
    businessId: 'ab-harness-probe',
    prompt: probe.prompt,
    surface: probe.surface,
    entityMemory: probe.entityMemory,
    abVariantId: variantId,
  });
  const fewShots = retrieveFewShotExamples(
    probe.prompt,
    probe.surface,
    resolveFewShotLimitForAbVariant(variantKey),
  );

  const shortlistHit = appendix.shortlist.includes(probe.expectedAction);
  const fewShotHit = fewShots.some(
    (entry) => entry.action === probe.expectedAction,
  );

  if (!fewShotHit) {
    errors.push(
      `few-shot missing action ${probe.expectedAction} (count=${fewShots.length})`,
    );
  }
  if (!shortlistHit) {
    errors.push(
      `shortlist missing ${probe.expectedAction} in [${appendix.shortlist.join(', ')}]`,
    );
  }

  return {
    caseId: probe.id,
    variantKey,
    variantId,
    // Variants only differ in few-shot depth; shortlist is tracked for reporting.
    passed: fewShotHit,
    shortlistHit,
    fewShotHit,
    errors,
  };
}

export function scoreClassificationAbVariant(
  probes: ClassificationAbProbeCase[],
  variantKey: ClassificationAbVariantKey,
): ClassificationAbVariantScore {
  const results = probes.map((probe) =>
    evaluateClassificationAbProbe(probe, variantKey),
  );
  const passed = results.filter((entry) => entry.passed).length;
  const shortlistHits = results.filter((entry) => entry.shortlistHit).length;
  const fewShotHits = results.filter((entry) => entry.fewShotHit).length;
  const total = results.length;

  return {
    variantKey,
    variantId: CLASSIFICATION_AB_VARIANTS[variantKey].id,
    label: CLASSIFICATION_AB_VARIANTS[variantKey].label,
    total,
    passed,
    failed: total - passed,
    accuracy: total ? passed / total : 0,
    shortlistAccuracy: total ? shortlistHits / total : 0,
    fewShotAccuracy: total ? fewShotHits / total : 0,
    results,
  };
}

export function pickBestClassificationAbVariant(
  scores: ClassificationAbVariantScore[],
): { winner: ClassificationAbVariantKey; tieBreakApplied: boolean } {
  if (scores.length === 0) {
    return { winner: 'control', tieBreakApplied: false };
  }

  const sorted = [...scores].sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.fewShotAccuracy !== a.fewShotAccuracy) {
      return b.fewShotAccuracy - a.fewShotAccuracy;
    }
    if (a.variantKey === 'control') return -1;
    if (b.variantKey === 'control') return 1;
    return a.variantId.localeCompare(b.variantId);
  });

  const winner = sorted[0].variantKey;
  const tiedAtTop = scores.filter(
    (entry) =>
      entry.accuracy === sorted[0].accuracy &&
      entry.fewShotAccuracy === sorted[0].fewShotAccuracy,
  );
  return {
    winner,
    tieBreakApplied: tiedAtTop.length > 1,
  };
}

/** Run appendix A/B harness across all registered variants. */
export function runClassificationAbHarness(
  probes: ClassificationAbProbeCase[] = CLASSIFICATION_AB_PROBE_CASES,
): ClassificationAbHarnessReport {
  const scores = CLASSIFICATION_AB_VARIANT_KEYS.map((variantKey) =>
    scoreClassificationAbVariant(probes, variantKey),
  );
  const { winner, tieBreakApplied } = pickBestClassificationAbVariant(scores);
  const promotedVariantId = CLASSIFICATION_AB_VARIANTS[winner].id;

  return {
    generatedAt: new Date().toISOString(),
    probeCount: probes.length,
    scores,
    winner,
    promotedVariantId,
    tieBreakApplied,
    promotionNote: tieBreakApplied
      ? `Tie at ${(scores.find((entry) => entry.variantKey === winner)?.accuracy ?? 0) * 100}% — promoted stable control variant.`
      : `Promoted ${promotedVariantId} with best appendix support accuracy.`,
  };
}

export function formatClassificationAbHarnessReport(
  report: ClassificationAbHarnessReport,
): string {
  const lines = [
    `Classification A/B harness (${report.generatedAt})`,
    `Probes: ${report.probeCount}`,
    `Winner: ${report.promotedVariantId}${report.tieBreakApplied ? ' (tie-break)' : ''}`,
    report.promotionNote,
    '',
    'Variant scores:',
  ];

  for (const score of report.scores) {
    lines.push(
      `- ${score.variantId}: ${score.passed}/${score.total} (${(score.accuracy * 100).toFixed(1)}%) · shortlist ${(score.shortlistAccuracy * 100).toFixed(1)}% · few-shot ${(score.fewShotAccuracy * 100).toFixed(1)}%`,
    );
  }

  const failed = report.scores
    .flatMap((score) => score.results.filter((entry) => !entry.passed))
    .slice(0, 12);
  if (failed.length > 0) {
    lines.push('', 'Failed probes (first 12):');
    for (const entry of failed) {
      lines.push(
        `  - ${entry.caseId}@${entry.variantId}: ${entry.errors.join('; ')}`,
      );
    }
  }

  return lines.join('\n');
}

/** acc-3.10 — apply harness winner to enterprise settings (disables live experiment). */
export function applyClassificationAbPromotionToSettings(
  settings: AiSettings,
  promotedVariantId: string,
  experimentId = CLASSIFICATION_AB_EXPERIMENT_ID,
): AiSettings {
  const experiments = settings.enterprise?.abExperiments ?? [];
  return {
    ...settings,
    enterprise: {
      ...settings.enterprise,
      classificationAppendixVariantId: promotedVariantId,
      abExperiments: experiments.map((experiment) =>
        experiment.id === experimentId
          ? {
              ...experiment,
              promotedClassificationVariantId: promotedVariantId,
              enabled: false,
            }
          : experiment,
      ),
    },
  };
}

/** ai-e5 — resolve live appendix variant from promoted winner or experiment bucket. */
export function resolveClassificationAppendixVariantId(
  businessId: string,
  settings: AiSettings,
): string {
  const enterprise = settings.enterprise;
  const promoted =
    enterprise?.classificationAppendixVariantId ??
    pickActiveClassificationAbExperiment(enterprise?.abExperiments)
      ?.promotedClassificationVariantId;

  if (promoted) {
    return promoted;
  }

  const experiment = pickActiveClassificationAbExperiment(
    enterprise?.abExperiments,
  );
  const variants = experiment?.classificationVariants ?? [];
  if (variants.length > 1 && experiment) {
    const idx = assignAbVariant(businessId, experiment.id, variants.length);
    return variants[idx]?.id ?? CLASSIFICATION_AB_VARIANTS.control.id;
  }

  return CLASSIFICATION_AB_VARIANTS.control.id;
}

/** CI gate — every variant must meet minimum appendix support on probe corpus. */
export function assertClassificationAbHarnessGate(
  report: ClassificationAbHarnessReport,
  options: { minFewShotAccuracy?: number } = {},
): void {
  const minFewShotAccuracy = options.minFewShotAccuracy ?? 0.85;
  const failures: string[] = [];

  for (const score of report.scores) {
    if (score.fewShotAccuracy + 1e-9 < minFewShotAccuracy) {
      failures.push(
        `${score.variantId} few-shot accuracy ${(score.fewShotAccuracy * 100).toFixed(1)}% below floor ${(minFewShotAccuracy * 100).toFixed(1)}%`,
      );
    }
  }

  const control = report.scores.find((entry) => entry.variantKey === 'control');
  const heavy = report.scores.find(
    (entry) => entry.variantKey === 'fewshot_heavy',
  );
  if (control && heavy && heavy.fewShotAccuracy + 1e-9 < control.fewShotAccuracy) {
    failures.push(
      `fewshot_heavy few-shot accuracy ${(heavy.fewShotAccuracy * 100).toFixed(1)}% regressed below control ${(control.fewShotAccuracy * 100).toFixed(1)}%`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      [
        'Classification A/B harness gate failed (acc-3.10).',
        formatClassificationAbHarnessReport(report),
        '',
        ...failures.map((line) => `  - ${line}`),
      ].join('\n'),
    );
  }
}
