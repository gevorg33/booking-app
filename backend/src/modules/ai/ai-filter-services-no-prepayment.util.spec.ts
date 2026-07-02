import {
  CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES,
  FILTER_SERVICES_NO_PREPAYMENT_PROMPTS,
  detectFilterServicesNoPrepaymentAction,
  enrichFilterServicesNoPrepaymentParamsFromPrompt,
  isFilterServicesNoPrepaymentPrompt,
  rescueFilterServicesNoPrepaymentIntent,
} from './ai-filter-services-no-prepayment.util.js';
import { FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_SCENARIOS } from './ai-filter-services-no-prepayment-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_FILTER_SERVICES_NO_PREPAYMENT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-filter-services-no-prepayment.util (ai-cmd-customer-4.1.7)', () => {
  it('exports classifier rules for filter_services_no_prepayment', () => {
    expect(
      CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES,
    ).toContain('filter_services_no_prepayment');
    expect(
      CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES,
    ).toContain('What can I book without paying online?');
  });

  it.each(
    FILTER_SERVICES_NO_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects no-prepayment browse prompt $id', (_id, row) => {
    expect(isFilterServicesNoPrepaymentPrompt(row.prompt)).toBe(true);
    expect(detectFilterServicesNoPrepaymentAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual no-prepayment browse prompt $id', (_id, row) => {
    expect(isFilterServicesNoPrepaymentPrompt(row.prompt)).toBe(true);
    expect(
      rescueFilterServicesNoPrepaymentIntent(row.prompt, 'unknown')?.action,
    ).toBe('filter_services_no_prepayment');
  });

  it.each(
    FILTER_SERVICES_NO_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues no-prepayment browse prompt $id from unknown', (_id, row) => {
    const rescued = rescueFilterServicesNoPrepaymentIntent(
      row.prompt,
      'unknown',
    );
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it('enriches prepaymentMode none and optional serviceCategory', () => {
    const enriched = enrichFilterServicesNoPrepaymentParamsFromPrompt(
      {},
      'What massage services can I book without paying online?',
    );
    expect(enriched.prepaymentMode).toBe('none');
    expect(enriched.onlinePaymentEnabled).toBe(false);
    expect(enriched.serviceCategory).toBe('massage');
  });

  it('disambiguates single-service payment options from catalog browse', () => {
    expect(
      isFilterServicesNoPrepaymentPrompt(
        'What can I book without paying online?',
      ),
    ).toBe(true);
    expect(
      isFilterServicesNoPrepaymentPrompt(
        'Can I pay cash for massage when I book?',
      ),
    ).toBe(false);
    expect(
      isFilterServicesNoPrepaymentPrompt(
        "Which services still don't accept online payment?",
      ),
    ).toBe(false);
    expect(
      isFilterServicesNoPrepaymentPrompt(
        'List services with deposit prepayment on public booking',
      ),
    ).toBe(false);
  });

  it.each(AI_COMMAND_EVAL_FILTER_SERVICES_NO_PREPAYMENT_CASES)(
    'eval golden case $id passes deterministic rescue',
    (evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    },
  );
});
