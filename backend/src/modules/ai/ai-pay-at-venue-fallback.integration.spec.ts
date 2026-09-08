import { validateCommand } from './command-completion.validator.js';
import { handlePayAtVenueFallbackLogic } from './ai-pay-at-venue-fallback.logic.js';
import {
  PAY_AT_VENUE_FALLBACK_PROMPTS,
  PAY_AT_VENUE_FALLBACK_RESCUE_SCENARIOS,
} from './ai-pay-at-venue-fallback.fixtures.js';
import { rescuePayAtVenueFallbackIntent } from './ai-pay-at-venue-fallback.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai pay at venue fallback integration (ai-cmd-customer-4.18.2)', () => {
  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const deps = { businessRepo, serviceRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        publicBooking: { acceptCashPayments: true },
        integrations: { stripe: { connectAccountId: 'acct_test' } },
      },
    });
    serviceRepo.findOne.mockResolvedValue(null);
  });

  it.each(PAY_AT_VENUE_FALLBACK_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand(makeResolvedCommand({
      action: 'pay_at_venue_fallback',
      params: {},
      enrichedParams: {},
      entities: { employees: [], services: [] },
      reasoning: 'test',
      prompt,
    }));
    expect(validation.issues).toEqual([]);
  });

  it.each(PAY_AT_VENUE_FALLBACK_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescuePayAtVenueFallbackIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler for skip online payment', async () => {
    const result = await handlePayAtVenueFallbackLogic(
      deps,
      'biz-1',
      {},
      'Skip online payment',
    );
    expect(result.action).toBe('pay_at_venue_fallback');
    expect(result.success).toBe(true);
    expect(result.details?.paymentMethod).toBe('cash');
  });
});
