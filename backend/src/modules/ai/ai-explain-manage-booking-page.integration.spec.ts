import {
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS,
  CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES,
} from './ai-explain-manage-booking-page.fixtures.js';
import { rescueExplainManageBookingPageIntent } from './ai-explain-manage-booking-page.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_EXPLAIN_MANAGE_BOOKING_PAGE_CASES } from './eval/ai-command-eval.cases.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';

describe('ai-explain-manage-booking-page integration (ai-cmd-customer-4.20.7)', () => {
  it.each(EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainManageBookingPageIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('public classifier schema includes explain_manage_booking_page rules', () => {
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('explain_manage_booking_page');
    expect(schema).toContain('What can I do on this manage page?');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES,
    ).toContain('ManageBookingPage');
  });

  it('is registered on customer surface via self-service handler', () => {
    expect(
      resolveHandlerForSurface('explain_manage_booking_page', 'customer'),
    ).toBe('AiSelfServiceBookingService');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_MANAGE_BOOKING_PAGE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it.each(
    EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS.filter(
      (entry) => entry.surface === 'public',
    ).slice(0, 3),
  )('chip prompt $id is in eval golden set', ({ id }) => {
    expect(
      AI_COMMAND_EVAL_EXPLAIN_MANAGE_BOOKING_PAGE_CASES.some((row) =>
        row.id.includes(id.replace('-public', '')),
      ),
    ).toBe(true);
  });
});
