import {
  commandResultToPublicAssistantResult,
  publicAssistantResultToCommandResult,
} from './customer-ai-command.util.js';
import { mergeGuideMultiTurnSessionIntoContext } from './ai-product-guide-multiturn.util.js';
import { sanitizeSessionContextForClient } from './ai-command-client-sanitize.util.js';
import {
  E2E91_DIRTY_SESSION_CONTEXT,
  E2E91_LEAKED_SESSION_KEYS,
} from './ai-e2e91-session-context-leak.fixtures.js';

describe('e2e-bug.91 public sessionContext must not leak orchestration internals', () => {
  it('sanitizeSessionContextForClient drops all leaked keys', () => {
    const safe = sanitizeSessionContextForClient({
      ...E2E91_DIRTY_SESSION_CONTEXT,
    });
    expect(safe).toEqual({
      serviceName: 'Massage',
      guideFlowId: 'public-booking-flow',
      guideStepIndex: 0,
      completedSteps: [0],
    });
    for (const key of E2E91_LEAKED_SESSION_KEYS) {
      expect(safe?.[key]).toBeUndefined();
    }
  });

  it('commandResultToPublicAssistantResult strips leaked keys from sessionContext', () => {
    const mapped = commandResultToPublicAssistantResult({
      success: true,
      action: 'booking_help',
      summary: 'How booking works',
      details: {
        sessionContext: { ...E2E91_DIRTY_SESSION_CONTEXT },
      },
      guide: {
        summary: 'How booking works',
        steps: [{ title: 'Pick a service', body: 'Browse services first.' }],
      },
    });

    expect(mapped.sessionContext).toEqual({
      serviceName: 'Massage',
      guideFlowId: 'public-booking-flow',
      guideStepIndex: '0',
      completedSteps: '[0]',
    });
    for (const key of E2E91_LEAKED_SESSION_KEYS) {
      expect(mapped.sessionContext?.[key]).toBeUndefined();
    }
  });

  it('publicAssistantResultToCommandResult prefers clean top-level sessionContext', () => {
    const command = publicAssistantResultToCommandResult({
      success: true,
      action: 'booking_help',
      summary: 'How booking works',
      sessionContext: {
        serviceName: 'Massage',
        employeeName: null,
      },
      details: {
        sessionContext: { ...E2E91_DIRTY_SESSION_CONTEXT },
        guideRoute: 'checkout',
      },
    });

    expect(command.details?.sessionContext).toEqual({
      serviceName: 'Massage',
      employeeName: null,
    });
    for (const key of E2E91_LEAKED_SESSION_KEYS) {
      expect(
        (command.details?.sessionContext as Record<string, unknown>)?.[key],
      ).toBeUndefined();
    }
    expect(command.details?.guideRoute).toBe('checkout');
  });

  it('guide multiturn merge strips underscore orchestration keys', () => {
    const merged = mergeGuideMultiTurnSessionIntoContext(
      { ...E2E91_DIRTY_SESSION_CONTEXT },
      {
        guideFlowId: 'public-booking-flow',
        guideStepIndex: 1,
        completedSteps: [0],
      },
    );
    expect(merged.guideFlowId).toBe('public-booking-flow');
    expect(merged.guideStepIndex).toBe(1);
    expect(merged.serviceName).toBe('Massage');
    for (const key of E2E91_LEAKED_SESSION_KEYS) {
      expect(merged[key]).toBeUndefined();
    }
  });
});
