import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderAiShell } from './ProviderAiShell';

const authState = vi.hoisted(() => ({
  business: { id: 'biz-1', membershipRole: 'staff' } as {
    id: string;
    membershipRole: string;
  } | null,
}));

vi.mock('../services/auth-store', () => ({
  useAuthStore: (selector: (s: { business: typeof authState.business }) => unknown) =>
    selector({ business: authState.business }),
}));

vi.mock('./ProviderAiAssistant', () => ({
  default: ({ mobileRoute }: { mobileRoute: string }) => (
    <div data-testid="provider-ai-assistant" data-route={mobileRoute} />
  ),
}));

describe('ProviderAiShell integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mountAt(path: string) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <Route path="/tabs/:tab">
            <ProviderAiShell>
              <div data-testid="tab-content" />
            </ProviderAiShell>
          </Route>
        </MemoryRouter>,
      );
    });
  }

  it('renders assistant with schedule route context', () => {
    mountAt('/tabs/schedule');
    const assistant = container.querySelector('[data-testid="provider-ai-assistant"]');
    expect(assistant).toBeTruthy();
    expect(assistant?.getAttribute('data-route')).toBe('schedule');
  });

  it('hides AI chrome when business is not loaded', () => {
    authState.business = null;
    mountAt('/tabs/today');
    expect(container.querySelector('[data-testid="provider-ai-assistant"]')).toBeNull();
    authState.business = { id: 'biz-1', membershipRole: 'staff' };
  });
});
