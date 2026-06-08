import {
  buildEscalationHandoffResult,
  shouldOfferHumanHandoff,
} from './ai-escalation-handoff.util.js';
import { ESCALATION_HANDOFF_SCENARIOS } from './ai-escalation-handoff.fixtures.js';

describe('ai-escalation-handoff.util (acc-6.5)', () => {
  it.each(ESCALATION_HANDOFF_SCENARIOS)('$id handoff rules', (scenario) => {
    expect(
      shouldOfferHumanHandoff({
        prompt: 'cancel maybe',
        surface: scenario.surface,
        action: scenario.action,
        params: { _classificationNeedsClarify: true },
        sessionContext: {
          _clarifyContext: { clarifyRound: scenario.clarifyRound },
        },
        confidence: 0.4,
      }),
    ).toBe(scenario.expectHandoff);
  });

  it('buildEscalationHandoffResult exposes getHelp payload', () => {
    const result = buildEscalationHandoffResult({
      prompt: 'help',
      surface: 'dashboard',
      action: 'unknown',
      params: { _classificationNeedsClarify: true },
      sessionContext: { _clarifyContext: { clarifyRound: 2 } },
      confidence: 0.3,
    });
    expect(result?.details.getHelp).toBe(true);
    expect(result?.details.humanHandoff).toBe(true);
    expect(result?.details.escalationRoute).toBe('staff_owner');
  });

  it('customer handoff routes to support_ticket action', () => {
    const result = buildEscalationHandoffResult({
      prompt: 'help',
      surface: 'customer',
      action: 'unknown',
      params: { _classificationNeedsClarify: true },
      sessionContext: { _clarifyContext: { clarifyRound: 2 } },
      confidence: 0.3,
    });
    expect(result?.action).toBe('contact_support');
    expect(result?.details.escalationRoute).toBe('support_ticket');
  });
});
