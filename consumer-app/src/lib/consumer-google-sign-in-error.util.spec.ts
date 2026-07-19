import { describe, expect, it } from 'vitest';
import {
  isConsumerGoogleSignInCancelled,
  readFirebaseAuthErrorCode,
  resolveConsumerGoogleSignInErrorMessage,
} from './consumer-google-sign-in-error.util.js';

const copy = {
  loginGoogleNotConfigured: 'Google sign-in is not configured.',
  loginGooglePopupBlocked: 'Please allow pop-ups and try again.',
  loginGoogleCancelled: 'Sign-in was cancelled.',
  loginGoogleFailed: 'Could not sign in. Please try again.',
};

describe('consumer-google-sign-in-error (e2e-bug.44)', () => {
  it.each([
    {
      id: 'popup-blocked',
      error: Object.assign(new Error('Firebase: Error (auth/popup-blocked).'), {
        code: 'auth/popup-blocked',
      }),
      expected: copy.loginGooglePopupBlocked,
    },
    {
      id: 'popup-closed-by-user',
      error: Object.assign(new Error('Firebase: Error (auth/popup-closed-by-user).'), {
        code: 'auth/popup-closed-by-user',
      }),
      expected: copy.loginGoogleCancelled,
    },
    {
      id: 'cancelled-popup-request',
      error: Object.assign(new Error('Firebase: Error (auth/cancelled-popup-request).'), {
        code: 'auth/cancelled-popup-request',
      }),
      expected: copy.loginGoogleCancelled,
    },
    {
      id: 'native-cancelled-message',
      error: new Error('Google sign-in was cancelled'),
      expected: copy.loginGoogleCancelled,
    },
    {
      id: 'not-configured',
      error: new Error('Google sign-in is not configured in this build'),
      expected: copy.loginGoogleNotConfigured,
    },
    {
      id: 'unknown-firebase-code',
      error: Object.assign(new Error('Firebase: Error (auth/network-request-failed).'), {
        code: 'auth/network-request-failed',
      }),
      expected: copy.loginGoogleFailed,
    },
    {
      id: 'non-error',
      error: 'boom',
      expected: copy.loginGoogleFailed,
    },
  ])('$id: maps to friendly copy (never raw Firebase message)', ({ error, expected }) => {
    const message = resolveConsumerGoogleSignInErrorMessage(error, copy);
    expect(message).toBe(expected);
    expect(message).not.toMatch(/Firebase:/i);
    expect(message).not.toMatch(/auth\//);
  });

  it('reads Firebase auth error codes', () => {
    expect(
      readFirebaseAuthErrorCode(
        Object.assign(new Error('x'), { code: 'auth/popup-blocked' }),
      ),
    ).toBe('auth/popup-blocked');
    expect(readFirebaseAuthErrorCode(new Error('x'))).toBeNull();
  });

  it('detects cancelled sign-in', () => {
    expect(
      isConsumerGoogleSignInCancelled(
        Object.assign(new Error('x'), { code: 'auth/popup-closed-by-user' }),
      ),
    ).toBe(true);
    expect(isConsumerGoogleSignInCancelled(new Error('network'))).toBe(false);
  });
});
