import {
  COMPARE_SERVICES_PROMPTS,
  CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES,
  detectCompareServicesAction,
  enrichCompareServicesParamsFromPrompt,
  extractCompareServiceNamesFromPrompt,
  isCompareServicesPrompt,
  rescueCompareServicesIntent,
} from './ai-compare-services.util.js';
import { COMPARE_SERVICES_MULTILINGUAL_SCENARIOS } from './ai-compare-services-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_COMPARE_SERVICES_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { isExplainServicePricePrompt } from './ai-explain-service-price.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';

describe('ai-compare-services.util (ai-cmd-customer-4.1.4)', () => {
  it('exports classifier rules for compare_services', () => {
    expect(CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES).toContain(
      'compare_services',
    );
    expect(CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES).toContain(
      'Haircut vs blowdry price and duration',
    );
  });

  it.each(COMPARE_SERVICES_PROMPTS.map((row) => [row.id, row] as const))(
    'detects compare-services prompt $id',
    (_id, row) => {
      expect(isCompareServicesPrompt(row.prompt)).toBe(true);
      expect(detectCompareServicesAction(row.prompt)).toBe(row.expectedAction);
    },
  );

  it.each(
    COMPARE_SERVICES_MULTILINGUAL_SCENARIOS.map((row) => [row.id, row] as const),
  )('detects multilingual compare-services prompt $id', (_id, row) => {
    expect(isCompareServicesPrompt(row.prompt)).toBe(true);
    expect(rescueCompareServicesIntent(row.prompt, 'unknown')?.action).toBe(
      'compare_services',
    );
  });

  it.each(COMPARE_SERVICES_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues compare-services prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueCompareServicesIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'compare_services',
      );
    },
  );

  it('extracts serviceNames for haircut vs blowdry', () => {
    expect(
      extractCompareServiceNamesFromPrompt(
        'Haircut vs blowdry price and duration',
      ),
    ).toEqual(['haircut', 'blowdry']);
    const enriched = enrichCompareServicesParamsFromPrompt(
      {},
      'Haircut vs blowdry price and duration',
    );
    expect(enriched.serviceNames).toEqual(['haircut', 'blowdry']);
  });

  it('disambiguates single-service price questions', () => {
    expect(isCompareServicesPrompt('How much is a haircut?')).toBe(false);
    expect(isExplainServicePricePrompt('How much is a haircut?')).toBe(true);
    expect(
      isExplainServicePricePrompt('Haircut vs blowdry price and duration'),
    ).toBe(false);
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      COMPARE_SERVICES_PROMPTS.filter((row) => row.surface === 'customer')
        .length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      COMPARE_SERVICES_PROMPTS.filter((row) => row.surface === 'public').length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_COMPARE_SERVICES_CASES.length).toBe(
      COMPARE_SERVICES_PROMPTS.length +
        COMPARE_SERVICES_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_COMPARE_SERVICES_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
