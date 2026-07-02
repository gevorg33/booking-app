import * as decompositionUtil from '../intent-decomposition.util.js';
import { AI_COMMAND_EVAL_IMPLICATION_CASES } from '../ai-implication-corpus.eval.util.js';
import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './ai-command-eval.runner.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import { AiIntentRescueService } from '../ai-intent-rescue.service.js';

describe('ai-command-eval.runner', () => {
  it('reports needsMultilingual mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'x',
      prompt: 'Show appointments today',
      expect: { needsMultilingual: true },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/needsMultilingual/);
  });

  it('reports routeTier mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'x',
      prompt: 'Optimize schedule for tomorrow',
      expect: { routeTier: 'read_only' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/routeTier/);
  });

  it('checks rescheduleFromTimeSlot', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'from-time',
      prompt:
        'Move Jujos appointment on June 10 from 16-17 to june 11th nearest free time',
      expect: { rescheduleFromTimeSlot: '16:00' },
    });
    expect(result.passed).toBe(true);
  });

  it('checks explicit-year nearest-free reschedule prompt', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'from-time-2027',
      prompt:
        'Move Jujos appointment on June 10 2027 from 16-17 to june 11 2027 nearest free time',
      expect: {
        rescheduleFromTimeSlot: '16:00',
        rescheduleTimeSlot: null,
        paramsPartial: {
          bookingFirstAvailable: true,
          fromDate: '10/06/2027',
          date: '11/06/2027',
        },
      },
    });
    expect(result.passed).toBe(true);
  });

  it('reports rescheduleTimeSlot mismatch when time not in prompt', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'time-miss',
      prompt: 'Move appointment to tomorrow',
      expect: { rescheduleTimeSlot: '09:00' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescheduleTimeSlot/);
  });

  it('reports rescheduleFromTimeSlot mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'from-miss',
      prompt: 'Move appointment to tomorrow at 9 AM',
      expect: { rescheduleFromTimeSlot: '16:00' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescheduleFromTimeSlot/);
  });

  it('passes when paramsPartial matches parsed params', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'params-ok',
      prompt: "Move Maria's appointment to tomorrow at 9 AM",
      expect: { paramsPartial: { timeSlot: '09:00' } },
    });
    expect(result.passed).toBe(true);
  });

  it('reports when rescue does not apply to prompt', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'no-rescue',
      prompt: 'Show appointments today',
      expect: { rescuedAction: 'clear_schedule' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescuedAction/);
  });

  it('passes when rescuedAction matches rescue', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-ok',
      prompt: 'Clear Gevorg schedule for tomorrow',
      expect: { rescuedAction: 'clear_schedule' },
    });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes when rescuedAction and paramsPartial match rescue output', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-params',
      prompt: 'Calculate total earnings for today',
      expect: {
        rescuedAction: 'summarize_bookings',
        paramsPartial: { bookingMetric: 'revenue' },
      },
    });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports rescuedAction when rescue omits action field', () => {
    jest.spyOn(AiIntentRescueService.prototype, 'rescue').mockReturnValueOnce({
      rescued: true,
    } as ReturnType<AiIntentRescueService['rescue']>);
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-no-action',
      prompt: 'anything',
      expect: { rescuedAction: 'clear_schedule' },
    });
    expect(result.errors[0]).toContain('got none');
    jest.restoreAllMocks();
  });

  it('reports rescuedAction when rescue returns different action', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-wrong',
      prompt: 'Clear Gevorg schedule for tomorrow',
      expect: { rescuedAction: 'payment_sweep' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescuedAction/);
  });

  it('passes disambiguation rescue with rescueFromAction and rescueReason', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-disambiguate',
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      expect: {
        rescueFromAction: 'create_booking',
        rescuedAction: 'create_booking',
        rescueReason: 'check_and_book_compound',
        paramsPartial: { bookingFirstAvailable: true, allProviders: true },
      },
    });
    expect(result.passed).toBe(true);
  });

  it('reports rescueReason mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-reason-miss',
      prompt: 'book the nearest slot for massage tomorrow evening',
      expect: {
        rescuedAction: 'book_nearest_slot',
        rescueReason: 'wrong_reason',
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescueReason/);
  });

  it('skips paramsPartial check when rescued params are absent', () => {
    jest.spyOn(AiIntentRescueService.prototype, 'rescue').mockReturnValueOnce({
      rescued: true,
      action: 'book_nearest_slot',
      rescueReason: 'nearest_slot',
    } as ReturnType<AiIntentRescueService['rescue']>);
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-no-params-object',
      prompt: 'book nearest slot',
      expect: {
        rescuedAction: 'book_nearest_slot',
        paramsPartial: { bookingFirstAvailable: true },
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(
      /paramsPartial: rescue returned no params/,
    );
    jest.restoreAllMocks();
  });

  it('passes catalog-notify rescue with notifyCustomers paramsPartial', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'catalog-notify-create-package',
      prompt:
        'Create Spa Day package with massage + facial 15% off and notify customers',
      expect: {
        rescuedAction: 'create_package',
        paramsPartial: { notifyCustomers: true },
      },
    });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports catalog-notify notifyCustomers paramsPartial mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'catalog-notify-mismatch',
      prompt:
        'Create Spa Day package with massage + facial 15% off and notify customers',
      expect: {
        rescuedAction: 'create_package',
        paramsPartial: { notifyCustomers: false },
      },
    });
    expect(result.passed).toBe(false);
    expect(
      result.errors.some((e) => e.includes('params.notifyCustomers')),
    ).toBe(true);
  });

  it('passes rescue with rescueReason and no paramsPartial', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-reason-only',
      prompt: 'book the nearest slot for massage tomorrow evening',
      expect: {
        rescuedAction: 'book_nearest_slot',
        rescueReason: 'nearest_slot',
      },
    });
    expect(result.passed).toBe(true);
  });

  it('reports rescueReason when rescue omits rescueReason field', () => {
    jest.spyOn(AiIntentRescueService.prototype, 'rescue').mockReturnValueOnce({
      rescued: true,
      action: 'book_nearest_slot',
    } as ReturnType<AiIntentRescueService['rescue']>);
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-reason-undefined',
      prompt: 'book the nearest slot for massage tomorrow evening',
      expect: {
        rescuedAction: 'book_nearest_slot',
        rescueReason: 'nearest_slot',
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescueReason.*none/);
    jest.restoreAllMocks();
  });

  it('reports rescueReason when rescue does not apply', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-reason-none',
      prompt: 'Show appointments today',
      expect: {
        rescuedAction: 'book_nearest_slot',
        rescueReason: 'nearest_slot',
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((error) => error.includes('rescueReason'))).toBe(
      true,
    );
  });

  it('reports paramsPartial mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'params',
      prompt: "Move Maria's appointment to tomorrow at 9 AM",
      expect: { paramsPartial: { timeSlot: '10:00' } },
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.startsWith('params.'))).toBe(true);
  });

  it('errors when action set without rescuedAction or requiresLlm', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'action',
      prompt: 'Book haircut',
      expect: { action: 'create_booking' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/requiresLlm/);
  });

  it('passes clinic ext classifier-without-rescue golden rows (ai-cmd-clinic-6-gap-2.3)', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'clinic-ext-classifier-upload',
      prompt: 'Upload lab result for order #abc123',
      surface: 'dashboard',
      expect: {
        action: 'upload_patient_result',
        accessTier: 'M',
        useClinicTestResultExtClassifierDetect: true,
        paramsPartial: { orderId: 'abc123' },
      },
    });
    expect(result.passed).toBe(true);
  });

  it('passes compound golden decomposition expectations', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-ok',
      prompt: 'Cancel package visit and notify waitlist for Anna',
      expect: {
        routeTier: 'compound',
        compoundSurface: 'dashboard',
        compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
        compoundSource: 'golden',
      },
    });
    expect(result.passed).toBe(true);
  });

  it('reports compoundMinSteps when decomposition returns no steps', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-min-steps-miss',
      prompt: 'List bookings today',
      expect: {
        compoundSurface: 'dashboard',
        compoundMinSteps: 2,
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/compoundMinSteps/);
  });

  it('reports compoundSteps mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-bad-steps',
      prompt: 'Cancel package visit and notify waitlist for Anna',
      expect: {
        compoundSurface: 'dashboard',
        compoundSteps: ['create_booking', 'list_bookings'],
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/compoundSteps/);
  });

  it('reports compoundExpectEmpty when decomposition succeeds', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-should-empty',
      prompt: 'Cancel package visit and notify waitlist for Anna',
      expect: {
        compoundSurface: 'dashboard',
        compoundExpectEmpty: true,
      },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/compoundExpectEmpty/);
  });

  it('reports compoundActionsContains and compoundStepParams mismatches', () => {
    const missingAction = evaluateDeterministicEvalCase({
      id: 'compound-missing-action',
      prompt: 'Book spa day package and apply promo code WELCOME',
      expect: {
        compoundSurface: 'customer',
        compoundActionsContains: ['not_a_real_intent'],
      },
    });
    expect(missingAction.errors[0]).toMatch(/compoundActionsContains/);

    const badParam = evaluateDeterministicEvalCase({
      id: 'compound-bad-param',
      prompt: 'Book spa day package and apply promo code WELCOME',
      expect: {
        compoundSurface: 'customer',
        compoundStepParams: [
          { stepIndex: 1, paramsPartial: { promoCode: 'WRONG' } },
        ],
      },
    });
    expect(badParam.errors[0]).toMatch(/compoundStepParams/);
  });

  it('defaults compound surface to dashboard when omitted', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-default-surface',
      prompt: 'Cancel package visit and notify waitlist for Anna',
      expect: {
        compoundMinSteps: 2,
        compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
      },
    });
    expect(result.passed).toBe(true);
  });

  it('reports compoundRecipeId mismatch when recipe id is absent', () => {
    const spy = jest.spyOn(
      decompositionUtil,
      'decomposeDeterministicForSurface',
    );
    spy.mockReturnValueOnce({
      surface: 'dashboard',
      source: 'deterministic',
      steps: [
        { action: 'cancel_package_visit', params: {}, reasoning: 'a' },
        { action: 'fill_slot_from_waitlist', params: {}, reasoning: 'b' },
      ],
    });
    const result = evaluateDeterministicEvalCase({
      id: 'compound-no-recipe-id',
      prompt: 'Cancel package visit and notify waitlist for Anna',
      expect: {
        compoundSurface: 'dashboard',
        compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
        compoundRecipeId: 'dashboard_operational_compound',
      },
    });
    expect(result.errors[0]).toContain('got none');
    spy.mockRestore();
  });

  it('accepts compoundStepParams entries without paramsPartial', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-step-no-params',
      prompt: 'Book spa day package and apply promo code WELCOME',
      expect: {
        compoundSurface: 'customer',
        compoundSteps: ['book_package', 'apply_promo_code_checkout'],
        compoundStepParams: [{ stepIndex: 0 }],
      },
    });
    expect(result.passed).toBe(true);
  });

  it('reports missing compoundStepParams step index', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-missing-step',
      prompt: 'Book spa day package and apply promo code WELCOME',
      expect: {
        compoundSurface: 'customer',
        compoundStepParams: [
          { stepIndex: 9, paramsPartial: { promoCode: 'WELCOME' } },
        ],
      },
    });
    expect(result.errors[0]).toMatch(
      /compoundStepParams: missing step at index 9/,
    );
  });

  it('reports compoundSource and compoundRecipeId mismatches', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'compound-wrong-source',
      prompt: 'Cancel package visit and notify waitlist for Anna',
      expect: {
        compoundSurface: 'dashboard',
        compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
        compoundSource: 'llm',
        compoundRecipeId: 'wrong_recipe',
      },
    });
    expect(result.errors.some((e) => e.includes('compoundSource'))).toBe(true);
    expect(result.errors.some((e) => e.includes('compoundRecipeId'))).toBe(
      true,
    );
  });

  it('uses top-anchor fallback for implication semantic eval cases (pipe-1.11.2)', () => {
    const sample = AI_COMMAND_EVAL_IMPLICATION_CASES.find((row) =>
      row.id.includes('en-hair-long-implied-booking'),
    );
    expect(sample).toBeDefined();
    const result = evaluateDeterministicEvalCase(sample!);
    expect(result.passed).toBe(true);
  });

  it('runDeterministicEvalSuite skips requiresLlm and counts failures', () => {
    const cases: AiCommandEvalCase[] = [
      {
        id: 'ok',
        prompt: 'Show appointments today',
        expect: { routeTier: 'read_only' },
      },
      {
        id: 'bad',
        prompt: 'Show appointments today',
        expect: { routeTier: 'compound' },
      },
      { id: 'llm', prompt: 'x', requiresLlm: true, expect: { action: 'x' } },
    ];
    const summary = runDeterministicEvalSuite(cases);
    expect(summary.results).toHaveLength(2);
    expect(summary.failed).toBe(1);
    expect(summary.passed).toBe(1);
  });
});
