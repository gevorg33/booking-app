import {
  FIND_EVENING_WEEKEND_SLOTS_PROMPTS,
  FIND_EVENING_WEEKEND_SLOTS_RESCUE_SCENARIOS,
} from './ai-find-evening-weekend-slots.fixtures.js';
import { rescueFindEveningWeekendSlotsIntent } from './ai-find-evening-weekend-slots.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_FIND_EVENING_WEEKEND_SLOTS_CASES } from './eval/ai-command-eval.cases.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES } from './ai-find-evening-weekend-slots.fixtures.js';

describe('ai-find-evening-weekend-slots integration (ai-cmd-customer-4.20.4)', () => {
  it.each(FIND_EVENING_WEEKEND_SLOTS_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueFindEveningWeekendSlotsIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('public classifier schema includes find_evening_weekend_slots chip rules', () => {
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('find_evening_weekend_slots');
    expect(schema).toContain('Evening or weekend slots for');
    expect(
      CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES,
    ).toContain('assistantDiscoverChipEveningWeekend');
  });

  it.each(
    FIND_EVENING_WEEKEND_SLOTS_PROMPTS.filter(
      (e) => e.surface === 'customer',
    ).slice(0, 3),
  )('chip prompt $id is in eval golden set', ({ id }) => {
    expect(
      AI_COMMAND_EVAL_FIND_EVENING_WEEKEND_SLOTS_CASES.some((row) =>
        row.id.includes(id.replace('-customer', '')),
      ),
    ).toBe(true);
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_FIND_EVENING_WEEKEND_SLOTS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
