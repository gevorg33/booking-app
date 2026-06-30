import {
  CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES,
  EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS,
  detectExplainBusinessHoursAndLocationAction,
  enrichExplainBusinessHoursLocationParamsFromPrompt,
  isExplainBusinessHoursAndLocationPrompt,
  rescueExplainBusinessHoursAndLocationIntent,
} from './ai-explain-business-hours-and-location.util.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_SCENARIOS } from './ai-explain-business-hours-and-location-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-business-hours-and-location.util (ai-cmd-customer-4.1.5)', () => {
  it('exports classifier rules for explain_business_hours_and_location', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES,
    ).toContain('explain_business_hours_and_location');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES,
    ).toContain('When are you open Saturday?');
  });

  it.each(
    EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.map((row) => [row.id, row] as const),
  )('detects hours/location prompt $id', (_id, row) => {
    expect(isExplainBusinessHoursAndLocationPrompt(row.prompt)).toBe(true);
    expect(detectExplainBusinessHoursAndLocationAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual hours/location prompt $id', (_id, row) => {
    expect(isExplainBusinessHoursAndLocationPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainBusinessHoursAndLocationIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_business_hours_and_location');
  });

  it.each(
    EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues hours/location prompt $id from unknown', (_id, row) => {
    const rescued = rescueExplainBusinessHoursAndLocationIntent(
      row.prompt,
      'unknown',
    );
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it('enriches aspect and weekday params', () => {
    const enriched = enrichExplainBusinessHoursLocationParamsFromPrompt(
      {},
      'When are you open Saturday?',
    );
    expect(enriched.aspect).toBe('hours');
    expect(enriched.weekday).toBe('saturday');
  });

  it('disambiguates general salon description from hours/location', () => {
    expect(
      isExplainBusinessHoursAndLocationPrompt('Tell me about the salon'),
    ).toBe(false);
    expect(
      isExplainBusinessHoursAndLocationPrompt('Where are you located?'),
    ).toBe(true);
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CASES.length).toBe(
      EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.length +
        EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
