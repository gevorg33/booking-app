import { handleConfigureStripeConnectLogic } from './ai-stripe-connect.logic.js';
import { CONFIGURE_STRIPE_CONNECT_PROMPTS } from './ai-stripe-connect.fixtures.js';

function buildDeps(overrides: Record<string, unknown> = {}) {
  return {
    stripeIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        configured: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        oauthAvailable: true,
        connectCountry: 'AM',
      })),
      startConnect: jest.fn(async () => ({
        url: 'https://connect.stripe.com/oauth/authorize',
      })),
    },
    ...overrides,
  } as any;
}

describe('ai-stripe-connect.logic', () => {
  it.each(CONFIGURE_STRIPE_CONNECT_PROMPTS.slice(0, 3))(
    'returns billing deep link for fixture $id',
    async ({ prompt }) => {
      const result = await handleConfigureStripeConnectLogic(
        buildDeps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_stripe_connect');
      expect(result.details?.navigate).toEqual({
        path: '/dashboard/billing',
        label: 'Open Billing',
      });
      expect(Array.isArray(result.details?.steps)).toBe(true);
    },
  );

  it('starts onboarding when requested', async () => {
    const deps = buildDeps();
    const result = await handleConfigureStripeConnectLogic(
      deps,
      'biz-1',
      {},
      'Start Stripe onboarding now',
    );
    expect(result.success).toBe(true);
    expect(deps.stripeIntegrationService.startConnect).toHaveBeenCalled();
    expect(result.details?.onboardingUrl).toContain('stripe.com');
  });

  it('reports already connected when charges are enabled', async () => {
    const result = await handleConfigureStripeConnectLogic(
      buildDeps({
        stripeIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: true,
            chargesEnabled: true,
            detailsSubmitted: true,
            connectAccountId: 'acct_test',
          })),
          startConnect: jest.fn(),
        },
      }),
      'biz-1',
      {},
      'Connect Stripe for client payments',
    );
    expect(result.success).toBe(true);
    expect(result.details?.alreadyConnected).toBe(true);
  });

  it('fails when onboarding cannot start', async () => {
    const result = await handleConfigureStripeConnectLogic(
      buildDeps({
        stripeIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: false,
            chargesEnabled: false,
            detailsSubmitted: false,
          })),
          startConnect: jest.fn(async () => {
            throw new Error('Stripe Connect is not available on your plan');
          }),
        },
      }),
      'biz-1',
      {},
      'Start Stripe onboarding now',
    );
    expect(result.success).toBe(false);
  });
});
