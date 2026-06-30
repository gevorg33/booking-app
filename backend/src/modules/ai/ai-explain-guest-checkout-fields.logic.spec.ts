import { handleExplainGuestCheckoutFieldsLogic } from './ai-explain-guest-checkout-fields.logic.js';
import { EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS } from './ai-explain-guest-checkout-fields.fixtures.js';

describe('ai-explain-guest-checkout-fields.logic', () => {
  const businessRepo = { findOne: jest.fn() };

  const deps = { businessRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        privacy: {
          cookieBanner: { enabled: false },
          granularConsent: {
            requireAiProcessing: true,
            requireThirdPartyIntegrations: false,
          },
        },
      },
    });
  });

  it('explains email field', async () => {
    const result = await handleExplainGuestCheckoutFieldsLogic(
      deps,
      'biz-1',
      {},
      'Why do you need my email at checkout?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_guest_checkout_fields');
    expect(result.summary).toContain('email');
    expect(result.summary).toContain('phone');
  });

  it('explains guest vs account checkout', async () => {
    const result = await handleExplainGuestCheckoutFieldsLogic(
      deps,
      'biz-1',
      {},
      'Can I book without an account?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('guest');
  });

  it('tailors consent copy from business privacy settings', async () => {
    const result = await handleExplainGuestCheckoutFieldsLogic(
      deps,
      'biz-1',
      {},
      'Why is there a privacy consent checkbox before I confirm?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('AI-processing consent');
    expect(result.details).toMatchObject({
      requireAiProcessingConsent: true,
    });
  });

  it.each(EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS)(
    'executes fixture $id',
    async ({ prompt, aspect }) => {
      const result = await handleExplainGuestCheckoutFieldsLogic(
        deps,
        'biz-1',
        { aspect },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_guest_checkout_fields');
      expect(result.summary?.length).toBeGreaterThan(20);
    },
  );

  it('returns clarify when prompt does not match', async () => {
    const result = await handleExplainGuestCheckoutFieldsLogic(
      deps,
      'biz-1',
      {},
      'Walk me through booking step by step',
    );

    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
  });

  it('fails when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    const result = await handleExplainGuestCheckoutFieldsLogic(
      deps,
      'biz-1',
      {},
      'Why do you need my email at checkout?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });
});
