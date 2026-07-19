/** e2e-bug.44 — never surface raw Firebase SDK strings to customers. */

export type ConsumerGoogleSignInErrorCopy = {
  loginGoogleNotConfigured: string;
  loginGooglePopupBlocked: string;
  loginGoogleCancelled: string;
  loginGoogleFailed: string;
};

const GOOGLE_SIGN_IN_CANCELLED_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

export function readFirebaseAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && code.trim() ? code.trim() : null;
}

export function isConsumerGoogleSignInCancelled(error: unknown): boolean {
  const code = readFirebaseAuthErrorCode(error);
  if (code && GOOGLE_SIGN_IN_CANCELLED_CODES.has(code)) return true;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('sign-in was cancelled') || message.includes('sign in was cancelled');
  }
  return false;
}

export function resolveConsumerGoogleSignInErrorMessage(
  error: unknown,
  copy: ConsumerGoogleSignInErrorCopy,
): string {
  const code = readFirebaseAuthErrorCode(error);
  if (code === 'auth/popup-blocked') return copy.loginGooglePopupBlocked;
  if (code && GOOGLE_SIGN_IN_CANCELLED_CODES.has(code)) return copy.loginGoogleCancelled;
  if (isConsumerGoogleSignInCancelled(error)) return copy.loginGoogleCancelled;

  if (error instanceof Error) {
    const message = error.message.trim();
    if (/not configured/i.test(message)) return copy.loginGoogleNotConfigured;
  }

  return copy.loginGoogleFailed;
}
