import { handlePrivacyExportLogic } from './ai-privacy-export.logic.js';
import { PRIVACY_EXPORT_PROMPTS } from './ai-privacy-export.fixtures.js';

describe('ai-privacy-export.logic (ai-cmd-customer-4.17.5)', () => {
  const deps = () => ({
    customerPrivacyService: {
      exportCustomerData: jest.fn(async () => ({ profile: { id: 'c1' } })),
    },
  });

  it('exports data for signed-in customer with navigate', async () => {
    const result = await handlePrivacyExportLogic(
      deps(),
      'biz-1',
      { sessionCustomerId: 'c1' },
      PRIVACY_EXPORT_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('privacy_export');
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'privacy', privacyAction: 'export' },
    });
  });

  it('requires sign-in with login navigate', async () => {
    const result = await handlePrivacyExportLogic(
      deps(),
      'biz-1',
      {},
      PRIVACY_EXPORT_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.navigate).toEqual({
      path: 'login',
      query: { reason: 'privacy_export' },
    });
  });
});
