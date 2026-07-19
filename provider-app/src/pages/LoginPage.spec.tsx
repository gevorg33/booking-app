import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const replace = vi.fn();
const authState = vi.hoisted(() => ({
  hydrated: true,
  isAuthenticated: false,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace, push: vi.fn() }),
  };
});

vi.mock('../lib/use-auth-hydrated', () => ({
  useAuthStoreHydrated: () => authState.hydrated,
}));

vi.mock('../services/auth-store', () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean; setAuth: () => void }) => unknown) =>
    selector({
      isAuthenticated: authState.isAuthenticated,
      setAuth: vi.fn(),
    }),
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../services/google-auth', () => ({
  isGoogleSignInAvailable: () => false,
  getGoogleIdToken: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
  unwrap: (v: unknown) => v,
}));

describe('LoginPage (e2e-bug.64)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    authState.hydrated = true;
    authState.isAuthenticated = false;
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
        <MemoryRouter initialEntries={['/login']}>
          <Route path="/login" component={LoginPage} />
        </MemoryRouter>,
      );
    });
  }

  it('shows the sign-in form when signed out', () => {
    render();
    expect(container.textContent).toContain('provider.signInPageSubtitle');
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects authenticated users to /tabs/today instead of showing the form', () => {
    authState.isAuthenticated = true;
    render();
    expect(replace).toHaveBeenCalledWith('/tabs/today');
    expect(container.textContent).not.toContain('provider.signInPageSubtitle');
  });

  it('waits for auth hydration before rendering the form', () => {
    authState.hydrated = false;
    render();
    expect(container.textContent).not.toContain('provider.signInPageSubtitle');
    expect(replace).not.toHaveBeenCalled();
  });
});
