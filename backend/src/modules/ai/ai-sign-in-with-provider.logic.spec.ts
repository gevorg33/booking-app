import { handleSignInWithProviderLogic } from './ai-sign-in-with-provider.logic.js';

describe('ai-sign-in-with-provider.logic', () => {
  it.each([
    ['sign_in_with_google', 'google'],
    ['sign_in_with_apple', 'apple'],
    ['sign_in_with_phone', 'phone'],
  ] as const)(
    '%s hands off to the native %s sign-in flow',
    async (action, provider) => {
      const result = await handleSignInWithProviderLogic(action, 'biz-1', {});
      expect(result.success).toBe(true);
      expect(result.action).toBe(action);
      expect(result.details?.provider).toBe(provider);
      expect(result.details?.navigate).toEqual({
        path: 'login',
        query: { provider },
      });
    },
  );

  it('never fabricates or stores credentials — details carry no token/password fields', async () => {
    const result = await handleSignInWithProviderLogic(
      'sign_in_with_google',
      'biz-1',
      { idToken: 'should-be-ignored', password: 'should-be-ignored' },
    );
    expect(result.details?.idToken).toBeUndefined();
    expect(result.details?.password).toBeUndefined();
  });

  it('redirects to account instead of login when already signed in', async () => {
    const result = await handleSignInWithProviderLogic(
      'sign_in_with_apple',
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.details?.alreadySignedIn).toBe(true);
    expect(result.details?.navigate).toEqual({ path: 'account', query: {} });
  });
});
