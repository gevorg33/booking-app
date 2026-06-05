import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';
import { resolveStaffMetric } from './ai-intent-heuristics.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  ALL_DASHBOARD_OPS_SCENARIOS,
  CATALOG_COUNTED_SCENARIOS,
  CUSTOMER_BOOKING_CONTEXT_SCENARIOS,
  DASHBOARD_OPS_MISCLASSIFICATION_SCENARIOS,
  DASHBOARD_OPS_NEGATIVE_SCENARIOS,
  PROVIDER_REVENUE_SCENARIOS,
  UPCOMING_APPOINTMENTS_SCENARIOS,
} from './ai-dashboard-ops.fixtures.js';
import {
  extractCustomerBookingContextFromPrompt,
  extractSingleProviderNameFromPrompt,
  extractUpcomingAppointmentScope,
  isCustomerBookingContextPrompt,
  isSingleProviderRevenuePrompt,
  isUpcomingAppointmentsPrompt,
} from './ai-dashboard-ops.util.js';
import {
  isBulkCreateCatalogPrompt,
  parseBulkCatalogWithCountFromPrompt,
} from './ai-catalog.util.js';
import {
  isTotalEarningsPrompt,
  isTopStaffRevenuePrompt,
} from './dashboard-revenue-analytics.util.js';

describe('dashboard ops AI integration', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Maria Lopez' },
    { id: 'e3', name: 'Mary Torgomyan' },
  ];

  describe('intent rescue — catalog counted bulk', () => {
    it.each(CATALOG_COUNTED_SCENARIOS.map((s) => [s.id, s]))(
      'rescues %s',
      (_id, scenario) => {
        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: 'unknown',
          params: {},
          employees,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        expect(result?.rescueReason).toBe(scenario.rescueReason);
        expect(isBulkCreateCatalogPrompt(scenario.prompt)).toBe(true);
        expect(
          parseBulkCatalogWithCountFromPrompt(scenario.prompt)?.services.length,
        ).toBeGreaterThan(0);
      },
    );
  });

  describe('intent rescue — customer booking context', () => {
    it.each(CUSTOMER_BOOKING_CONTEXT_SCENARIOS.map((s) => [s.id, s]))(
      'rescues %s',
      (_id, scenario) => {
        expect(isCustomerBookingContextPrompt(scenario.prompt)).toBe(true);
        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: 'unknown',
          params: {},
          employees,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        expect(result?.rescueReason).toBe(scenario.rescueReason);
        if (scenario.paramsPartial) {
          for (const [key, value] of Object.entries(scenario.paramsPartial)) {
            expect(result?.params[key]).toEqual(value);
          }
        }
        scenario.paramsAssert?.(result?.params ?? {});
        const extracted = extractCustomerBookingContextFromPrompt(
          scenario.prompt,
        );
        if (result?.params.customerName) {
          expect(extracted.customerName).toBe(result.params.customerName);
        }
      },
    );
  });

  describe('intent rescue — provider revenue', () => {
    it.each(PROVIDER_REVENUE_SCENARIOS.map((s) => [s.id, s]))(
      'rescues %s',
      (_id, scenario) => {
        expect(isSingleProviderRevenuePrompt(scenario.prompt)).toBe(true);
        expect(isTotalEarningsPrompt(scenario.prompt)).toBe(false);
        expect(isTopStaffRevenuePrompt(scenario.prompt)).toBe(false);
        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: 'unknown',
          params: {},
          employees,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        expect(result?.rescueReason).toBe(scenario.rescueReason);
        if (scenario.paramsPartial) {
          for (const [key, value] of Object.entries(scenario.paramsPartial)) {
            expect(result?.params[key]).toEqual(value);
          }
        }
        scenario.paramsAssert?.(result?.params ?? {});
        expect(resolveStaffMetric(result?.params ?? {}, scenario.prompt)).toBe(
          'most_revenue',
        );
      },
    );
  });

  describe('intent rescue — upcoming appointments', () => {
    it.each(UPCOMING_APPOINTMENTS_SCENARIOS.map((s) => [s.id, s]))(
      'rescues %s',
      (_id, scenario) => {
        expect(isUpcomingAppointmentsPrompt(scenario.prompt)).toBe(true);
        const scope = extractUpcomingAppointmentScope(scenario.prompt);
        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: 'unknown',
          params: {},
          employees,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        expect(result?.rescueReason).toBe(scenario.rescueReason);
        expect(result?.params.upcomingOnly).toBe(true);
        if (scenario.paramsPartial?.allProviders) {
          expect(result?.params.allProviders).toBe(true);
          expect(scope.allProviders).toBe(true);
        }
        if (scenario.paramsPartial) {
          for (const [key, value] of Object.entries(scenario.paramsPartial)) {
            expect(result?.params[key]).toEqual(value);
          }
        }
        scenario.paramsAssert?.(result?.params ?? {});
      },
    );
  });

  describe('period parsing for dashboard ops prompts', () => {
    it.each([
      ['last week', 'Summarize Gevorg revenue last week'],
      ['last month', 'Show revenue for Maria Lopez last month'],
      ['today', 'Show service provider revenue today'],
      ['this month', 'Summarize specialist earnings this month'],
    ] as const)('resolves %s from prompt', (periodHint, prompt) => {
      const range = resolveDateRange({}, prompt, 'UTC');
      expect(range).not.toBeNull();
      if (periodHint === 'today') {
        expect(range!.start).toBe(range!.end);
      }
    });
  });

  describe('negative scenarios — distinct analytics and cart intents', () => {
    it('routes total earnings to summarize_bookings', () => {
      const result = rescue.rescue({
        prompt: 'Calculate total earnings for today',
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.action).toBe('summarize_bookings');
      expect(result?.rescueReason).toBe('total_earnings');
    });

    it('routes top-N specialist ranking to summarize_staff', () => {
      const result = rescue.rescue({
        prompt: 'Top 3 specialists by revenue last week',
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.action).toBe('summarize_staff');
      expect(result?.rescueReason).toBe('top_staff_revenue');
    });

    it.each(
      DASHBOARD_OPS_NEGATIVE_SCENARIOS.filter(
        (s) => !['total-earnings', 'top-specialists'].includes(s.id),
      ).map((s) => [s.id, s]),
    )('does not use dashboard ops rescue for %s', (_id, scenario) => {
      const result = rescue.rescue({
        prompt: scenario.prompt,
        action: 'unknown',
        params: {},
        employees,
      });
      expect([
        'customer_booking_context',
        'single_provider_revenue',
        'upcoming_appointments',
      ]).not.toContain(result?.rescueReason);
    });
  });

  describe('misclassification recovery', () => {
    it.each(DASHBOARD_OPS_MISCLASSIFICATION_SCENARIOS.map((s) => [s.id, s]))(
      'reroutes %s',
      (_id, scenario) => {
        const result = rescue.rescue({
          prompt: scenario.prompt,
          action: scenario.wrongAction,
          params: {},
          employees,
        });
        expect(result?.rescued).toBe(true);
        expect(result?.action).toBe(scenario.expectedAction);
        expect(result?.rescueReason).toBe(scenario.rescueReason);
      },
    );
  });

  describe('provider name extraction consistency', () => {
    it.each(
      PROVIDER_REVENUE_SCENARIOS.filter(
        (s) => s.paramsPartial?.employeeName,
      ).map((s) => [s.id, s]),
    )('extracts provider from %s', (_id, scenario) => {
      const expected = scenario.paramsPartial?.employeeName as string;
      expect(extractSingleProviderNameFromPrompt(scenario.prompt)).toBe(
        expected,
      );
    });
  });

  describe('eval golden cases', () => {
    it.each(ALL_DASHBOARD_OPS_SCENARIOS.map((s) => [s.id, s]))(
      'passes eval %s',
      (_id, scenario) => {
        const result = evaluateDeterministicEvalCase({
          id: `ops-${scenario.id}`,
          prompt: scenario.prompt,
          expect: {
            rescuedAction: scenario.expectedAction,
            ...(scenario.paramsPartial
              ? { paramsPartial: scenario.paramsPartial }
              : {}),
          },
        });
        expect(result.passed).toBe(true);
      },
    );
  });
});
