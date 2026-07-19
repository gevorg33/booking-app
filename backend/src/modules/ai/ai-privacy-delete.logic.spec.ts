import { handlePrivacyDeleteLogic } from './ai-privacy-delete.logic.js';
import { PRIVACY_DELETE_PROMPTS } from './ai-privacy-delete.fixtures.js';

describe('ai-privacy-delete.logic (ai-cmd-customer-4.17.5)', () => {
  const deps = () => ({
    customerPrivacyService: {
      deleteCustomerData: jest.fn(async () => undefined),
    },
  });

  it('deletes data for signed-in customer with navigate', async () => {
    const result = await handlePrivacyDeleteLogic(
      deps(),
      'biz-1',
      { sessionCustomerId: 'c1', confirm: true },
      PRIVACY_DELETE_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('privacy_delete');
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'privacy', privacyAction: 'delete' },
    });
  });

  it('previews without confirm and does not delete', async () => {
    const d = deps();
    const result = await handlePrivacyDeleteLogic(
      d,
      'biz-1',
      { sessionCustomerId: 'c1' },
      PRIVACY_DELETE_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.requiresConfirmation).toBe(true);
    expect(d.customerPrivacyService.deleteCustomerData).not.toHaveBeenCalled();
  });

  it('requires sign-in with login navigate', async () => {
    const result = await handlePrivacyDeleteLogic(
      deps(),
      'biz-1',
      {},
      PRIVACY_DELETE_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.details?.navigate).toEqual({
      path: 'login',
      query: { reason: 'privacy_delete' },
    });
  });
});
