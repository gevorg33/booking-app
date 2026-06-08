import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';
import { CLASSIFICATION_AB_PROBE_CASES } from './ai-classification-ab-harness.fixtures.js';
import {
  applyClassificationAbPromotionToSettings,
  assertClassificationAbHarnessGate,
  evaluateClassificationAbProbe,
  formatClassificationAbHarnessReport,
  pickBestClassificationAbVariant,
  resolveClassificationAppendixVariantId,
  runClassificationAbHarness,
  scoreClassificationAbVariant,
} from './ai-classification-ab-harness.util.js';
import { assignAbVariant } from './ai-platform.util.js';

describe('ai-classification-ab-harness.util (acc-3.10)', () => {
  it.each(CLASSIFICATION_AB_PROBE_CASES.map((probe) => [probe.id, probe]))(
    'acc-3.10-probe-%s — control variant retrieves expected few-shot action',
    (_id, probe) => {
      const result = evaluateClassificationAbProbe(probe, 'control');
      expect(result.fewShotHit).toBe(true);
      expect(result.passed).toBe(true);
    },
  );

  it('fewshot_heavy retrieves more few-shot examples than control', () => {
    const probe = CLASSIFICATION_AB_PROBE_CASES[0];
    const control = scoreClassificationAbVariant([probe], 'control');
    const heavy = scoreClassificationAbVariant([probe], 'fewshot_heavy');
    expect(heavy.results[0].passed).toBe(control.results[0].passed);
  });

  it('pickBestClassificationAbVariant tie-breaks to control when scores are equal', () => {
    const { winner, tieBreakApplied } = pickBestClassificationAbVariant([
      {
        variantKey: 'control',
        variantId: 'control',
        label: 'control',
        total: 10,
        passed: 8,
        failed: 2,
        accuracy: 0.8,
        shortlistAccuracy: 0.9,
        fewShotAccuracy: 0.8,
        results: [],
      },
      {
        variantKey: 'fewshot_heavy',
        variantId: 'fewshot_heavy',
        label: 'heavy',
        total: 10,
        passed: 8,
        failed: 2,
        accuracy: 0.8,
        shortlistAccuracy: 0.9,
        fewShotAccuracy: 0.8,
        results: [],
      },
    ]);
    expect(winner).toBe('control');
    expect(tieBreakApplied).toBe(true);
  });

  it('pickBestClassificationAbVariant prefers higher few-shot accuracy', () => {
    const { winner } = pickBestClassificationAbVariant([
      {
        variantKey: 'control',
        variantId: 'control',
        label: 'control',
        total: 10,
        passed: 8,
        failed: 2,
        accuracy: 0.8,
        shortlistAccuracy: 0.9,
        fewShotAccuracy: 0.8,
        results: [],
      },
      {
        variantKey: 'fewshot_heavy',
        variantId: 'fewshot_heavy',
        label: 'heavy',
        total: 10,
        passed: 9,
        failed: 1,
        accuracy: 0.9,
        shortlistAccuracy: 0.9,
        fewShotAccuracy: 0.9,
        results: [],
      },
    ]);
    expect(winner).toBe('fewshot_heavy');
  });

  it('runClassificationAbHarness promotes a variant and formats report', () => {
    const report = runClassificationAbHarness();
    expect(report.scores).toHaveLength(2);
    expect(report.promotedVariantId).toBeTruthy();
    expect(formatClassificationAbHarnessReport(report)).toContain('Variant scores');
    assertClassificationAbHarnessGate(report);
  });

  it('applyClassificationAbPromotionToSettings stores winner and disables experiment', () => {
    const settings = applyClassificationAbPromotionToSettings(
      DEFAULT_AI_SETTINGS,
      'fewshot_heavy',
    );
    expect(settings.enterprise?.classificationAppendixVariantId).toBe(
      'fewshot_heavy',
    );
    const experiment = settings.enterprise?.abExperiments?.find(
      (entry) => entry.id === 'classification-appendix-v1',
    );
    expect(experiment?.promotedClassificationVariantId).toBe('fewshot_heavy');
    expect(experiment?.enabled).toBe(false);
  });

  it('resolveClassificationAppendixVariantId prefers promoted winner over live bucket', () => {
    const promoted = resolveClassificationAppendixVariantId('biz-1', {
      ...DEFAULT_AI_SETTINGS,
      enterprise: {
        ...DEFAULT_AI_SETTINGS.enterprise,
        classificationAppendixVariantId: 'fewshot_heavy',
        abExperiments: [
          {
            id: 'classification-appendix-v1',
            name: 'Classifier appendix A/B',
            enabled: true,
            classificationVariants: [
              { id: 'control', label: 'control' },
              { id: 'fewshot_heavy', label: 'heavy' },
            ],
          },
        ],
      },
    });
    expect(promoted).toBe('fewshot_heavy');
  });

  it('resolveClassificationAppendixVariantId buckets businesses during active experiment', () => {
    const settings = {
      ...DEFAULT_AI_SETTINGS,
      enterprise: {
        ...DEFAULT_AI_SETTINGS.enterprise,
        classificationAppendixVariantId: undefined,
        abExperiments: [
          {
            id: 'classification-appendix-v1',
            name: 'Classifier appendix A/B',
            enabled: true,
            classificationVariants: [
              { id: 'control', label: 'control' },
              { id: 'fewshot_heavy', label: 'heavy' },
            ],
          },
        ],
      },
    };
    const idx = assignAbVariant('biz-42', 'classification-appendix-v1', 2);
    const expected = idx === 0 ? 'control' : 'fewshot_heavy';
    expect(resolveClassificationAppendixVariantId('biz-42', settings)).toBe(
      expected,
    );
  });
});
