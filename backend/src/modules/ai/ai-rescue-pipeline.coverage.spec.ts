import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  GOLDEN_COMPOUND_PATTERNS,
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';
import { decomposePaymentsCompoundPrompt } from './ai-payments.util.js';
import { decomposeGiftCardPaymentsCompoundPrompt } from './ai-gift-card-payments-hints.util.js';
import { decomposeDashboardPackageMultiServiceCompoundPrompt } from './ai-package-multi-service-hints.util.js';
import {
  COMPOUND_ENRICHMENT_SCENARIOS,
  COMPOUND_RESCUE_SCENARIOS,
  GOLDEN_COMPOUND_PROMPT_BY_ID,
} from './ai-rescue-pipeline.fixtures.js';

describe('ai rescue pipeline coverage (ai-cmd-h4.2)', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: 'e1', name: 'Anna Kim' },
    { id: 'e2', name: 'Gevorg Gasparyan' },
  ];
  const customers = [
    { id: 'c1', name: 'Maria Lopez' },
    { id: 'c2', name: 'James' },
  ];

  describe('compound rescue paths', () => {
    it.each(COMPOUND_RESCUE_SCENARIOS)(
      'rescues $id to $expectedAction',
      ({ prompt, action, expectedAction, rescueReason }) => {
        const result = rescue.rescue({
          prompt,
          action,
          params: {},
          employees,
          customers,
        });
        expect(result?.action).toBe(expectedAction);
        expect(result?.rescued).toBe(true);
        if (result?.rescueReason) {
          expect(result.rescueReason).toBe(rescueReason);
        }
      },
    );
  });

  describe('compound decomposition golden patterns', () => {
    it.each(GOLDEN_COMPOUND_PATTERNS.map((pattern) => [pattern.id, pattern]))(
      'matches golden pattern %s',
      (_id, pattern) => {
        const prompt = GOLDEN_COMPOUND_PROMPT_BY_ID[pattern.id];
        expect(prompt).toBeDefined();
        expect(pattern.matches(prompt)).toBe(true);
        const result = decomposeDeterministicForSurface(pattern.surface, prompt);
        expect(result?.source).toBe('golden');
        expect(result?.recipeId).toBe(pattern.recipeId);
        expect(result?.steps.length).toBeGreaterThanOrEqual(2);
      },
    );
  });

  describe('compound decomposition util families', () => {
    it('decomposes check-and-book via payments util', () => {
      const prompt = GOLDEN_COMPOUND_PROMPT_BY_ID.dashboard_check_and_book_nearest;
      const steps = decomposePaymentsCompoundPrompt(prompt);
      expect(steps.map((s) => s.action)).toEqual(
        expect.arrayContaining([
          'check_providers_for_service',
          'book_nearest_slot',
        ]),
      );
      const golden = matchGoldenCompoundPattern('dashboard', prompt);
      expect(golden?.recipeId).toBe('dashboard_payments_compound');
    });

    it('decomposes package checkout via dashboard util', () => {
      const prompt = GOLDEN_COMPOUND_PROMPT_BY_ID.dashboard_package_line_checkout;
      const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
        prompt,
        employees,
        customers,
      );
      expect(steps.map((s) => s.action)).toEqual([
        'check_package_line_availability',
        'create_package_booking',
      ]);
    });

    it('decomposes multi-service cart checkout via dashboard util', () => {
      const prompt =
        GOLDEN_COMPOUND_PROMPT_BY_ID.dashboard_multi_service_cart_checkout;
      const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
        prompt,
        employees,
        customers,
      );
      expect(steps.map((s) => s.action)).toEqual([
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ]);
    });

    it('decomposes gift-card checkout via gift-card util', () => {
      const prompt =
        GOLDEN_COMPOUND_PROMPT_BY_ID.customer_gift_card_checkout_compound;
      const steps = decomposeGiftCardPaymentsCompoundPrompt(prompt);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps[0]?.action).toBe('book_nearest_slot');
    });
  });

  describe('compound enrichment and param propagation', () => {
    it.each(COMPOUND_ENRICHMENT_SCENARIOS)(
      'enriches bookingFirstAvailable for $id',
      ({ prompt, action }) => {
        const params: Record<string, unknown> = {};
        enrichBookingTimeHintsFromPrompt(action, params, prompt);
        expect(params.bookingFirstAvailable).toBe(true);
        expect(params.timeSlot).toBeUndefined();
      },
    );

    it('propagates giftCardCode across gift-card checkout steps', () => {
      const prompt =
        GOLDEN_COMPOUND_PROMPT_BY_ID.customer_gift_card_checkout_compound;
      const steps = decomposeGiftCardPaymentsCompoundPrompt(prompt).map(
        (step) => ({ action: step.action, params: step.params }),
      );
      const propagated = propagateCompoundStepParamsAcrossSteps(steps);
      const applyStep = propagated.find(
        (step) => step.action === 'apply_gift_card_code',
      );
      expect(applyStep?.params.giftCardCode).toBe('GCM-ABCD1234');
    });

    it('enriches shared gift card code for checkout compound prompt', () => {
      const prompt =
        GOLDEN_COMPOUND_PROMPT_BY_ID.customer_gift_card_checkout_compound;
      const params = enrichParamsWithSharedEntities({}, prompt);
      expect(params.giftCardCode).toBe('GCM-ABCD1234');
    });

    it('extracts package params from decomposed package checkout steps', () => {
      const prompt = GOLDEN_COMPOUND_PROMPT_BY_ID.dashboard_package_line_checkout;
      const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
        prompt,
        employees,
        customers,
      );
      expect(steps[0]?.params.packageName).toBe('Spa Day');
      expect(steps[1]?.params.customerName).toBe('James');
    });
  });
});
