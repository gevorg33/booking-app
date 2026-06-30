import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS } from './ai-checkout-defaults.fixtures.js';
import { handleConfigureCheckoutDefaultsLogic } from './ai-checkout-defaults.logic.js';
import { rescueConfigureCheckoutDefaultsIntent } from './ai-checkout-defaults.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';

describe('ai-checkout-defaults integration (ai-cmd-ext-2.16)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS.slice(0, 4))(
    'rescues unknown prompt $id via payments rescue',
    ({ prompt, expectedAction }) => {
      expect(rescuePaymentsIntent(prompt, 'unknown')?.action).toBe(expectedAction);
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
    const prompt =
      'Set checkout defaults: allow cash at venue and 50% prepayment for new services';
    expect(rescueConfigureCheckoutDefaultsIntent(prompt, 'unknown')?.action).toBe(
      'configure_checkout_defaults',
    );
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('configure_checkout_defaults');
  });

  it('does not rescue existing catalog scope to checkout defaults', () => {
    expect(
      rescueConfigureCheckoutDefaultsIntent(
        'Accept online payment for all services with 50% prepayment',
        'unknown',
      ),
    ).toBeNull();
  });

  it('handleConfigureCheckoutDefaultsLogic end-to-end', async () => {
    const business = { id: 'biz-1', settings: {} };
    const result = await handleConfigureCheckoutDefaultsLogic(
      {
        businessRepo: {
          findOne: jest.fn(async () => business),
          save: jest.fn(async (value: typeof business) => {
            Object.assign(business, value);
            return value;
          }),
        } as any,
      },
      'biz-1',
      {},
      'Default new services to no online payment',
    );
    expect(result.success).toBe(true);
    expect((business.settings as any).publicBooking.defaultServicePrepaymentMode).toBe(
      'none',
    );
  });
});
