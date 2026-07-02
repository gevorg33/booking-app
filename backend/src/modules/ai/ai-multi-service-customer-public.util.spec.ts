import {
  BOOK_MULTI_SERVICE_PROMPTS,
  CHECK_MULTI_SERVICE_AVAILABILITY_PROMPTS,
  CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES,
  MULTI_SERVICE_COMPOUND_PROMPTS,
  MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS,
  decomposePublicMultiServiceCompoundPrompt,
  detectMultiServiceCustomerPublicAction,
  enrichMultiServiceBookingParamsFromPrompt,
  extractMultiServiceNamesFromPrompt,
  isPublicMultiServiceCompoundPrompt,
  rescueMultiServiceCustomerPublicIntent,
} from './ai-multi-service-customer-public.util.js';
import { AI_COMMAND_EVAL_MULTI_SERVICE_CUSTOMER_PUBLIC_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-multi-service-customer-public.util (ai-cmd-customer-4.0 P1)', () => {
  it('exports classifier rules for book and check multi-service', () => {
    expect(CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES).toContain(
      'book_multi_service',
    );
    expect(CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES).toContain(
      'check_multi_service_availability',
    );
  });

  it.each(
    MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS.map((row) => [row.id, row] as const),
  )('detects multi-service prompt $id', (_id, row) => {
    expect(detectMultiServiceCustomerPublicAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues multi-service prompt $id from unknown', (_id, row) => {
    const rescued = rescueMultiServiceCustomerPublicIntent(
      row.prompt,
      'unknown',
    );
    expect(rescued?.action).toBe(row.expectedAction);
  });

  it('extracts paired service names from spa-day phrasing', () => {
    expect(
      extractMultiServiceNamesFromPrompt(
        'Massage and facial same afternoon — find a time',
      ),
    ).toEqual(expect.arrayContaining(['massage', 'facial']));
    expect(
      extractMultiServiceNamesFromPrompt(
        'Schedule haircut and color on the same visit',
      ),
    ).toEqual(['haircut', 'color']);
    expect(
      enrichMultiServiceBookingParamsFromPrompt(
        {},
        'Book massage and facial together',
      ).serviceNames,
    ).toEqual(['massage', 'facial']);
  });

  it.each(MULTI_SERVICE_COMPOUND_PROMPTS.map((row) => [row.id, row] as const))(
    'decomposes public multi-service compound $id',
    (_id, row) => {
      expect(isPublicMultiServiceCompoundPrompt(row.prompt)).toBe(true);
      expect(
        decomposePublicMultiServiceCompoundPrompt(row.prompt).map(
          (step) => step.action,
        ),
      ).toEqual(row.orderedActions);
    },
  );

  it('maps multi-service fixtures to passing eval golden cases', () => {
    expect(BOOK_MULTI_SERVICE_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(
      CHECK_MULTI_SERVICE_AVAILABILITY_PROMPTS.length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_MULTI_SERVICE_CUSTOMER_PUBLIC_CASES.length).toBe(
      MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_MULTI_SERVICE_CUSTOMER_PUBLIC_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
