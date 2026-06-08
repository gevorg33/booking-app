import {
  buildHighRiskConfirmClarifyResult,
  buildHighRiskConfirmSummary,
  estimateHighRiskImpact,
  isHighRiskConfirmAction,
  isHighRiskExecutionConfirmed,
} from './ai-high-risk-confirm-clarify.util.js';
import { HIGH_RISK_CONFIRM_SCENARIOS } from './ai-high-risk-confirm-clarify.fixtures.js';
import { buildHighRiskConfirmClarify } from './ai-smart-clarify.util.js';

describe('ai-high-risk-confirm-clarify.util (acc-4.6)', () => {
  it.each(HIGH_RISK_CONFIRM_SCENARIOS)('$id high-risk confirm', (scenario) => {
    const clarify = buildHighRiskConfirmClarifyResult({
      prompt: 'cancel all bookings tomorrow',
      action: scenario.action,
      params: scenario.params,
      sessionContext: scenario.sessionContext,
    });

    if (!scenario.expectClarify) {
      expect(clarify).toBeNull();
      return;
    }

    expect(clarify).not.toBeNull();
    expect(clarify?.details.requiresExecutionConfirmation).toBe(
      scenario.expectRequiresConfirmation ?? true,
    );
    expect(clarify?.details.clarifyKind).toBe('high_risk_confirm');

    if (scenario.expectSummaryIncludes) {
      const summary = clarify!.summary.toLowerCase();
      for (const fragment of scenario.expectSummaryIncludes) {
        expect(summary).toContain(fragment.toLowerCase());
      }
    }
  });

  it('buildHighRiskConfirmSummary formats cancel + notify copy', () => {
    expect(
      buildHighRiskConfirmSummary(
        estimateHighRiskImpact('cancel_bookings', {
          bookingIds: Array.from({ length: 12 }, () => 'bk'),
          notifyCustomers: true,
        }),
      ),
    ).toBe('This cancels 12 bookings and notifies 12 customers — proceed?');
  });

  it('isHighRiskConfirmAction covers bulk destructive intents', () => {
    expect(isHighRiskConfirmAction('cancel_bookings')).toBe(true);
    expect(isHighRiskConfirmAction('list_bookings')).toBe(false);
  });

  it('isHighRiskExecutionConfirmed respects session confirmed flag', () => {
    expect(isHighRiskExecutionConfirmed({ confirmed: true })).toBe(true);
    expect(isHighRiskExecutionConfirmed({ confirmed: false })).toBe(false);
  });

  it('buildHighRiskConfirmClarify attaches smart clarify metadata', () => {
    const clarify = buildHighRiskConfirmClarify({
      prompt: 'cancel tomorrow',
      surface: 'dashboard',
      action: 'cancel_bookings',
      params: {
        bookingIds: ['a', 'b'],
        notifyCustomers: true,
      },
    });
    expect(clarify?.details.clarifyKind).toBe('high_risk_confirm');
    expect(clarify?.summary).toContain('2 bookings');
  });
});
