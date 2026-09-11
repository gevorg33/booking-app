import type { Business } from '../business/entities/business.entity.js';
import { handleNotifyWhenResultsReadyLogic } from './ai-notify-when-results-ready.logic.js';
import {
  NOTIFY_WHEN_RESULTS_READY_PROMPTS,
  NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS,
} from './ai-notify-when-results-ready.fixtures.js';
import { rescueNotifyWhenResultsReadyIntent } from './ai-notify-when-results-ready.util.js';
import type { NotifyWhenResultsReadyLogicDeps } from './ai-notify-when-results-ready.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

const clinicBusiness = makeBusiness({
  id: 'biz-1',
  timezone: 'UTC',
  settings: { businessType: 'clinic' },
});

function buildDeps(overrides: Partial<NotifyWhenResultsReadyLogicDeps> = {}) {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(clinicBusiness),
    },
    ...overrides,
  } satisfies NotifyWhenResultsReadyLogicDeps;
}

describe('ai-notify-when-results-ready.logic (ai-cmd-customer-4.14.7)', () => {
  it.each(
    NOTIFY_WHEN_RESULTS_READY_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles notify_when_results_ready for $0', async (_id, prompt) => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('notify_when_results_ready');
    expect(result.details?.readOnlyExplain).toBe(true);
    expect(result.details?.resultReadyNotificationFaq).toBe(true);
    expect(result.summary).toContain('read-only');
    expect(result.details?.navigate?.path).toBeTruthy();
  });

  it('works without sign-in for general FAQ', async () => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps(),
      'biz-1',
      {},
      'How do I get notified when results are ready?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.customerId).toBeNull();
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps(),
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('e2e-bug.198 succeeds when step _prompt is notify under book+notify full prompt', async () => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps(),
      'biz-1',
      {
        aspect: 'subscribe_explain',
        _prompt: 'notify me when results are ready',
      },
      'Book lipid panel and notify me when results are ready',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('notify_when_results_ready');
    expect(result.details?.clarify).not.toBe(true);
  });

  it('e2e-bug.198 honors seeded aspect when full prompt alone would clarify', async () => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps(),
      'biz-1',
      { aspect: 'subscribe_explain' },
      'Book lipid panel and notify me when results are ready',
    );
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('subscribe_explain');
  });

  it('rejects non-clinic businesses', async () => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps({
        businessRepo: {
          findOne: jest.fn().mockResolvedValue({
            ...clinicBusiness,
            settings: { businessType: 'salon' },
          }),
        },
      }),
      'biz-1',
      {},
      'Text me when results are ready',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('handles missing business', async () => {
    const result = await handleNotifyWhenResultsReadyLogic(
      buildDeps({
        businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
      }),
      'biz-1',
      {},
      'Text me when results are ready',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });

  it.each(NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS)(
    'rescue fixture $id maps to notify_when_results_ready',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueNotifyWhenResultsReadyIntent(prompt, misclassifiedAction)?.action,
      ).toBe('notify_when_results_ready');
    },
  );
});
