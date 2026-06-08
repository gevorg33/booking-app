import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import {
  buildIntentConfusionMatrix,
  buildIntentScorecards,
  EVAL_FAILED_PREDICTION,
  formatEvalIntentScorecards,
  formatWeakestIntentScorecards,
  inferEvalCaseIntent,
  inferEvalPredictedIntent,
  summarizeIntentMetrics,
} from './ai-command-eval.scorecard.util.js';

describe('ai-command-eval.scorecard.util (acc-2.11)', () => {
  it('inferEvalCaseIntent maps security, clarify, and rescue cases', () => {
    expect(
      inferEvalCaseIntent({
        id: 'x',
        prompt: 'p',
        expect: { securityBlocked: true },
      }),
    ).toBe('security_blocked');
    expect(
      inferEvalCaseIntent({
        id: 'x',
        prompt: 'p',
        expect: { clarifyAction: 'create_booking', clarifyFields: ['date'] },
      }),
    ).toBe('clarify:create_booking');
    expect(
      inferEvalCaseIntent({
        id: 'x',
        prompt: 'p',
        expect: { rescuedAction: 'clear_schedule' },
      }),
    ).toBe('clear_schedule');
  });

  it('computes precision/recall/F1 from gold vs predicted intents', () => {
    const cases: AiCommandEvalCase[] = [
      {
        id: 'tp-1',
        prompt: 'book gevorg',
        expect: { rescuedAction: 'create_booking' },
      },
      {
        id: 'tp-2',
        prompt: 'book mary',
        expect: { rescuedAction: 'create_booking' },
      },
      {
        id: 'fn-1',
        prompt: 'who is free',
        expect: { rescuedAction: 'check_providers_for_service' },
      },
      {
        id: 'fp-source',
        prompt: 'book nearest',
        expect: { rescuedAction: 'create_booking' },
      },
    ];

    const results = [
      { id: 'tp-1', passed: true, errors: [] },
      { id: 'tp-2', passed: true, errors: [] },
      {
        id: 'fn-1',
        passed: false,
        errors: ['rescuedAction: expected check_providers_for_service, got none'],
      },
      {
        id: 'fp-source',
        passed: false,
        errors: [
          'rescuedAction: expected create_booking, got check_providers_for_service',
        ],
      },
    ];

    expect(inferEvalPredictedIntent(cases[3]!, results[3]!)).toBe(
      'check_providers_for_service',
    );

    const scorecards = buildIntentScorecards(cases, results);
    const booking = scorecards.find((row) => row.intent === 'create_booking');
    const providers = scorecards.find(
      (row) => row.intent === 'check_providers_for_service',
    );

    expect(booking).toMatchObject({
      total: 3,
      truePositives: 2,
      falseNegatives: 1,
      falsePositives: 0,
      precision: 1,
      recall: 2 / 3,
    });
    expect(providers).toMatchObject({
      total: 1,
      truePositives: 0,
      falseNegatives: 1,
      falsePositives: 1,
      precision: 0,
      recall: 0,
    });

    const metrics = summarizeIntentMetrics(scorecards);
    expect(metrics.microPrecision).toBeCloseTo(2 / 3);
    expect(metrics.microRecall).toBeCloseTo(2 / 4);
  });

  it('maps generic failures to eval_failed without cross-intent false positives', () => {
    const evalCase: AiCommandEvalCase = {
      id: 'route-fail',
      prompt: 'show schedule',
      expect: { routeTier: 'compound' },
    };
    const result = {
      id: 'route-fail',
      passed: false,
      errors: ['routeTier: expected compound, got read_only'],
    };

    expect(inferEvalPredictedIntent(evalCase, result)).toBe('route:read_only');

    const matrix = buildIntentConfusionMatrix([evalCase], [result]);
    expect(matrix).toEqual([
      {
        goldIntent: 'route:compound',
        predictedIntent: 'route:read_only',
        count: 1,
      },
    ]);
  });

  it('formats scorecards with precision/recall/F1 columns', () => {
    const formatted = formatEvalIntentScorecards([
      {
        intent: 'create_booking',
        total: 10,
        passed: 9,
        failed: 1,
        accuracy: 0.9,
        truePositives: 9,
        falsePositives: 1,
        falseNegatives: 1,
        precision: 0.9,
        recall: 0.9,
        f1: 0.9,
      },
    ]);
    expect(formatted).toContain('precision / recall / F1');
    expect(formatted).toContain('P 90.0% · R 90.0% · F1 90.0%');

    const weakest = formatWeakestIntentScorecards([
      {
        intent: 'create_booking',
        total: 10,
        passed: 8,
        failed: 2,
        accuracy: 0.8,
        truePositives: 8,
        falsePositives: 0,
        falseNegatives: 2,
        precision: 1,
        recall: 0.8,
        f1: 0.8888888888888888,
      },
    ]);
    expect(weakest).toContain('Weakest intents');
    expect(weakest).toContain('FN 2');
  });

  it('uses eval_failed bucket when no structured misprediction is available', () => {
    expect(
      inferEvalPredictedIntent(
        { id: 'x', prompt: 'p', expect: { routeTier: 'compound' } },
        { id: 'x', passed: false, errors: ['unexpected failure'] },
      ),
    ).toBe(EVAL_FAILED_PREDICTION);
  });
});
