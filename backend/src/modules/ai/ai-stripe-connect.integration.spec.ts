import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CONFIGURE_STRIPE_CONNECT_PROMPTS } from './ai-stripe-connect.fixtures.js';
import { handleConfigureStripeConnectLogic } from './ai-stripe-connect.logic.js';
import { rescueConfigureStripeConnectIntent } from './ai-stripe-connect.util.js';

describe('ai-stripe-connect integration (ai-cmd-ext-2.15)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONFIGURE_STRIPE_CONNECT_PROMPTS.slice(0, 4))(
    'rescues unknown prompt $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it('utility rescue matches intent rescue', () => {
    const prompt = 'Set up Stripe Connect';
    expect(rescueConfigureStripeConnectIntent(prompt, 'unknown')?.action).toBe(
      'configure_stripe_connect',
    );
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('configure_stripe_connect');
  });

  it('does not rescue explain stripe status to configure', () => {
    expect(
      rescueConfigureStripeConnectIntent('Is Stripe Connect ready?', 'unknown'),
    ).toBeNull();
  });

  it('handleConfigureStripeConnectLogic end-to-end', async () => {
    const result = await handleConfigureStripeConnectLogic(
      {
        stripeIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: false,
            chargesEnabled: false,
            detailsSubmitted: false,
            oauthAvailable: true,
          })),
          startConnect: jest.fn(async () => ({
            url: 'https://stripe.test/onboard',
          })),
        } as any,
      },
      'biz-1',
      {},
      'Open Stripe Connect onboarding',
    );
    expect(result.success).toBe(true);
    expect(result.details?.onboardingUrl).toBe('https://stripe.test/onboard');
  });
});
