import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage.js';
import type { PublicBusinessProfile } from '../lib/types.js';

const replace = vi.fn();
const getCustomerToken = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace, push: vi.fn() }),
  };
});

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: (...args: unknown[]) => getCustomerToken(...args),
}));

const salonProfile = {
  id: 'biz-1',
  name: 'Demo Salon',
  slug: 'demo-salon',
  timezone: 'UTC',
  locale: 'en',
  currency: 'USD',
  branding: { primaryColor: '#336699' },
  publicBookingEnabled: true,
  businessType: 'salon',
} as PublicBusinessProfile;

let tenantState = {
  slug: 'demo-salon',
  profile: salonProfile,
  loading: false,
  error: '',
};

vi.mock('../hooks/use-tenant-bootstrap.js', () => ({
  useTenantBootstrap: () => tenantState,
}));

vi.mock('../hooks/use-consumer-copy.js', () => ({
  useConsumerCopy: () => ({
    locale: 'en',
    copy: {
      signIn: 'Sign in',
      tabAccount: 'Account',
      loginAccountHeading: '{name} account',
      loginSubtitle: 'Sign in to save appointments...',
      guidePageBack: 'Back',
      postBookingSignInBusy: 'Signing in…',
      postBookingSignInGoogle: 'Continue with Google',
      postBookingSignInApple: 'Continue with Apple',
      loginGoogleNotConfigured: 'Google sign-in is not configured.',
      loginPhoneHint: 'Or use your phone',
      loginPhoneLabel: 'Phone',
      loginSendCode: 'Send code',
      loginOtpLabel: 'Code',
      loginVerify: 'Verify',
      loginDifferentNumber: 'Use a different number',
    },
  }),
}));

vi.mock('../hooks/use-consumer-one-tap-sign-in.js', () => ({
  useConsumerOneTapSignIn: () => ({
    busy: false,
    message: null,
    phone: '',
    setPhone: vi.fn(),
    otp: '',
    setOtp: vi.fn(),
    phoneStep: 'phone' as const,
    setPhoneStep: vi.fn(),
    setVerificationId: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
    sendPhoneCode: vi.fn(),
    verifyPhoneCode: vi.fn(),
    sanitizeSmsOtpCode: (v: string) => v,
  }),
}));

vi.mock('../services/google-auth.js', () => ({
  isGoogleSignInAvailable: () => true,
}));

vi.mock('../services/apple-auth.js', () => ({
  isAppleSignInAvailable: () => false,
}));

vi.mock('../services/phone-auth.js', () => ({
  isPhoneSignInAvailable: () => false,
}));

describe('LoginPage (e2e-bug.45)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    tenantState = {
      slug: 'demo-salon',
      profile: salonProfile,
      loading: false,
      error: '',
    };
    getCustomerToken.mockReset();
    getCustomerToken.mockReturnValue(null);
    replace.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render() {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/s/demo-salon/login']}>
          <Route path="/s/:slug/login" component={LoginPage} />
        </MemoryRouter>,
      );
    });
  }

  it('shows the sign-in form when signed out', () => {
    render();
    expect(container.textContent).toContain('Sign in to save appointments...');
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects authenticated customers to account instead of showing the form', () => {
    getCustomerToken.mockReturnValue('tok-already-signed-in');
    render();
    expect(replace).toHaveBeenCalledWith('/s/demo-salon/account');
    expect(container.textContent).not.toContain('Sign in to save appointments...');
  });
});
