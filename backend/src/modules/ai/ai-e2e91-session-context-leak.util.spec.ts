import {
  commandResultToPublicAssistantResult,
  publicAssistantResultToCommandResult,
} from './customer-ai-command.util.js';
import { mergeGuideMultiTurnSessionIntoContext } from './ai-product-guide-multiturn.util.js';
import {
  sanitizeCommandResultForClient,
  sanitizeSessionContextForClient,
} from './ai-command-client-sanitize.util.js';
import {
  E2E91_DIRTY_SESSION_CONTEXT,
  E2E91_LEAKED_SESSION_KEYS,
  E2E91_LIVE_LEAK_PROMPTS,
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

  it('sanitizeCommandResultForClient strips dirty details.sessionContext', () => {
    const sanitized = sanitizeCommandResultForClient({
      success: true,
      action: 'guide_user_flow',
      summary: 'Step 1',
      details: {
        sessionContext: { ...E2E91_DIRTY_SESSION_CONTEXT },
        pipelineTrace: [{ stage: 'classify' }],
        _capabilityHints: 'should also drop from details root',
      },
    });
    const session = sanitized.details?.sessionContext as
      | Record<string, unknown>
      | undefined;
    expect(session?.serviceName).toBe('Massage');
    for (const key of E2E91_LEAKED_SESSION_KEYS) {
      expect(session?.[key]).toBeUndefined();
    }
    expect(sanitized.details?.pipelineTrace).toBeUndefined();
    expect(
      (sanitized.details as Record<string, unknown>)?._capabilityHints,
    ).toBeUndefined();
  });

  it('live prompt fixture covers original booking_help + guide_user_flow triggers', () => {
    expect(E2E91_LIVE_LEAK_PROMPTS.length).toBeGreaterThanOrEqual(6);
    expect(E2E91_LIVE_LEAK_PROMPTS.some((p) => /book/i.test(p.prompt))).toBe(
      true,
    );
    expect(
      E2E91_LIVE_LEAK_PROMPTS.some((p) => /gift card shipment/i.test(p.prompt)),
    ).toBe(true);
    expect(
      E2E91_LIVE_LEAK_PROMPTS.some((p) => /left off/i.test(p.prompt)),
    ).toBe(true);
  });

  it('fixture includes _entityMemoryAliases serialization leak key', () => {
    expect(E2E91_LEAKED_SESSION_KEYS).toContain('_entityMemoryAliases');
    expect(
      sanitizeSessionContextForClient({
        ...E2E91_DIRTY_SESSION_CONTEXT,
      })?._entityMemoryAliases,
    ).toBeUndefined();
  });
});
