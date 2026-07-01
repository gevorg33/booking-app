import { handleFixCheckoutValidationErrorLogic } from './ai-fix-checkout-validation-error.logic.js';
import { FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS } from './ai-fix-checkout-validation-error.fixtures.js';

describe('ai-fix-checkout-validation-error.logic (ai-cmd-customer-4.2.7)', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: {
        privacy: {
          granularConsent: {
            requireAiProcessing: false,
            requireThirdPartyIntegrations: false,
          },
        },
      },
    })),
  };

  const deps = { businessRepo };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(
    FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.slice(0, 4).map(
      (row) => [row.id, row] as const,
    ),
  )('returns troubleshooting summary for $id', async (_id, row) => {
    const result = await handleFixCheckoutValidationErrorLogic(
      deps,
      'biz-1',
      { aspect: row.aspect },
      row.prompt,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('fix_checkout_validation_error');
    expect(result.details?.aspect).toBe(row.aspect);
    expect(result.details?.fieldHints).toEqual(
      expect.objectContaining({ action: 'explain_guest_checkout_fields' }),
    );
    expect(result.details?.navigate).toEqual(
      expect.objectContaining({ path: 'checkout' }),
    );
    expect(String(result.summary)).toMatch(
      /checkout|email|phone|name|contact|consent/i,
    );
  });

  it('returns clarify when prompt is not recognized', async () => {
    const result = await handleFixCheckoutValidationErrorLogic(
      deps,
      'biz-1',
      {},
      'hello world',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns failure when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleFixCheckoutValidationErrorLogic(
      deps,
      'biz-1',
      {},
      FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
  });
});
