import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AcceptInvitePage from './AcceptInvitePage.js';

const replace = vi.fn();
const setAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace, push: vi.fn() }),
  };
});

vi.mock('../services/auth-store', () => ({
  useAuthStore: (selector: (s: { setAuth: typeof setAuth }) => unknown) =>
    selector({ setAuth }),
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('../services/api', () => ({
  default: { get: (...args: unknown[]) => apiGet(...args), post: (...args: unknown[]) => apiPost(...args) },
  unwrap: (v: unknown) => (v as { data: unknown }).data,
}));

const inviteInfo = {
  email: 'new@biz.com',
  businessName: 'GevGas Salon',
  role: 'contributor',
  employeeName: 'New Employee',
  isAppAccess: true,
  hasExistingAccount: false,
  defaultPhoneCountryCode: '+1',
};

const authResult = {
  user: { id: 'user-1', email: 'new@biz.com', firstName: 'New', lastName: 'Employee' },
  business: { id: 'biz-1', name: 'GevGas Salon', slug: 'gevgas-salon', membershipRole: 'contributor' },
  employee: { id: 'emp-1', name: 'New Employee' },
  businesses: [],
  token: 'signed.jwt.token',
  requiresBusinessSelection: false,
};

describe('AcceptInvitePage (e2e-bug.172)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    replace.mockReset();
    setAuth.mockReset();
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockResolvedValue({ data: { data: inviteInfo } });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function renderAndLoad() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/accept-invite?token=tok-abc']}>
          <Route path="/accept-invite" component={AcceptInvitePage} />
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  function fillPassword(value: string) {
    const input = container.querySelector('ion-input[type="password"]');
    expect(input).toBeTruthy();
    act(() => {
      input!.dispatchEvent(
        new CustomEvent('ionInput', { detail: { value }, bubbles: true }),
      );
    });
  }

  function clickSubmit() {
    const buttons = Array.from(container.querySelectorAll('ion-button'));
    const submitBtn = buttons.find((el) => (el.textContent ?? '').includes('provider.inviteCompleteSetup'));
    expect(submitBtn).toBeTruthy();
    return act(async () => {
      submitBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('establishes the real session directly (setAuth + navigate to /tabs/today), not a redirect to /login', async () => {
    apiPost.mockResolvedValue({ data: { data: authResult } });
    await renderAndLoad();
    fillPassword('supersecret1');
    await clickSubmit();

    expect(apiPost).toHaveBeenCalledWith(
      '/invitations/tok-abc/accept',
      expect.objectContaining({ firstName: 'New', lastName: 'Employee', password: 'supersecret1' }),
    );
    expect(setAuth).toHaveBeenCalledWith(
      authResult.user,
      authResult.business,
      'signed.jwt.token',
      { businesses: [], employee: authResult.employee },
    );
    // The actual bug: this must NOT be '/login' — that's what silently
    // handed control back to whatever session was already on the device.
    expect(replace).toHaveBeenCalledWith('/tabs/today');
    expect(replace).not.toHaveBeenCalledWith('/login');
  });

  it('shows an error and does not establish a session when the backend omits a token', async () => {
    apiPost.mockResolvedValue({
      data: { data: { ...authResult, token: null } },
    });
    await renderAndLoad();
    fillPassword('supersecret1');
    await clickSubmit();

    expect(setAuth).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalledWith('/tabs/today');
    expect(container.textContent).toContain('provider.inviteSetupFailed');
  });

  it('shows an access-denied message and does not establish a session when the account cannot access the provider app', async () => {
    apiPost.mockResolvedValue({
      data: {
        data: { ...authResult, employee: null, business: { ...authResult.business, membershipRole: 'staff-without-employee' } },
      },
    });
    await renderAndLoad();
    fillPassword('supersecret1');
    await clickSubmit();

    expect(setAuth).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalledWith('/tabs/today');
    expect(container.textContent).toContain('provider.accessDenied');
  });
});
