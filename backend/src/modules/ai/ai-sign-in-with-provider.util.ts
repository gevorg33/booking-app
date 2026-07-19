export const SIGN_IN_WITH_PROVIDER_INTENTS = [
  'sign_in_with_google',
  'sign_in_with_apple',
  'sign_in_with_phone',
] as const;

export type SignInWithProviderIntent =
  (typeof SIGN_IN_WITH_PROVIDER_INTENTS)[number];

export type SignInProvider = 'google' | 'apple' | 'phone';

const PROVIDER_BY_ACTION: Record<SignInWithProviderIntent, SignInProvider> = {
  sign_in_with_google: 'google',
  sign_in_with_apple: 'apple',
  sign_in_with_phone: 'phone',
};

const PROVIDER_LABEL: Record<SignInProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  phone: 'phone number',
};

export function providerForSignInAction(
  action: SignInWithProviderIntent,
): SignInProvider {
  return PROVIDER_BY_ACTION[action];
}

/**
 * Navigate-only handoff — the AI cannot mint a real Firebase id token from a
 * chat message, so signing in always hands off to the native provider flow
 * on the client (ai-cmd-customer-6.5.2). No credentials are ever collected
 * or stored by the assistant.
 */
export function buildSignInWithProviderResult(
  provider: SignInProvider,
  alreadySignedIn: boolean,
): {
  summary: string;
  navigate: { path: string; query: Record<string, string> };
} {
  const label = PROVIDER_LABEL[provider];
  if (alreadySignedIn) {
    return {
      summary: `You're already signed in — no need to sign in with ${label} again.`,
      navigate: { path: 'account', query: {} },
    };
  }
  return {
    summary: `Opening ${label} sign-in — continue there to finish signing in securely.`,
    navigate: { path: 'login', query: { provider } },
  };
}

export const SIGN_IN_WITH_PROVIDER_CLASSIFIER_RULES = `- sign_in_with_google: MUTATE (handoff only) — hand off to native Google sign-in; the assistant never collects or stores credentials. Triggers: "Sign in with Google", "Log in using my Google account". NOT explain_why_sign_in (explains benefits, no handoff), NOT sign_in_with_apple|sign_in_with_phone (different provider).
- sign_in_with_apple: MUTATE (handoff only) — hand off to native Apple sign-in. Triggers: "Sign in with Apple", "Use Apple ID to log in". NOT explain_why_sign_in, NOT sign_in_with_google|sign_in_with_phone.
- sign_in_with_phone: MUTATE (handoff only) — hand off to native phone/OTP sign-in. Triggers: "Sign in with my phone number", "Log in with phone verification". NOT explain_why_sign_in, NOT sign_in_with_google|sign_in_with_apple.`;
