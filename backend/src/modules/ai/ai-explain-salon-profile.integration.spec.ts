import {
  EXPLAIN_SALON_PROFILE_PROMPTS,
  EXPLAIN_SALON_PROFILE_RESCUE_SCENARIOS,
} from './ai-explain-salon-profile.fixtures.js';
import { rescueExplainSalonProfileIntent } from './ai-explain-salon-profile.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_EXPLAIN_SALON_PROFILE_CASES } from './eval/ai-command-eval.cases.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { isAiBusinessHoursLocationIntentForSurface } from './ai-business-hours-location-dispatch.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES } from './ai-explain-salon-profile.fixtures.js';

describe('ai-explain-salon-profile integration (ai-cmd-customer-4.20.5)', () => {
  it.each(EXPLAIN_SALON_PROFILE_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainSalonProfileIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('public classifier schema includes explain_salon_profile rules', () => {
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('explain_salon_profile');
    expect(schema).toContain('Tell me about this salon');
    expect(CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES).toContain(
      'SalonProfilePage',
    );
  });

  it('is registered on customer and public surfaces', () => {
    expect(
      isAiBusinessHoursLocationIntentForSurface(
        'explain_salon_profile',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiBusinessHoursLocationIntentForSurface(
        'explain_salon_profile',
        'public',
      ),
    ).toBe(true);
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_SALON_PROFILE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it.each(
    EXPLAIN_SALON_PROFILE_PROMPTS.filter(
      (entry) => entry.surface === 'public',
    ).slice(0, 3),
  )('chip prompt $id is in eval golden set', ({ id }) => {
    expect(
      AI_COMMAND_EVAL_EXPLAIN_SALON_PROFILE_CASES.some((row) =>
        row.id.includes(id.replace('-public', '')),
      ),
    ).toBe(true);
  });
});
