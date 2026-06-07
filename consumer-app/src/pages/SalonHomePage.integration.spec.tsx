import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SalonHomePage from './SalonHomePage.js';
import type { PublicBusinessProfile } from '../lib/types.js';

const push = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ push }),
  };
});

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: vi.fn(() => 'token'),
}));

vi.mock('../hooks/use-consumer-locale.js', () => ({
  useConsumerLocale: () => ({
    locale: 'en',
    setConsumerLocale: vi.fn(),
    enabledLocales: ['en'],
    localeLabels: { en: 'English' },
  }),
}));

vi.mock('../services/public-api.js', () => ({
  fetchMyClinicLabBookingRequests: vi.fn(async () => [
    {
      orderId: 'order-1',
      token: 'tok-1',
      collectionServiceId: 'svc-1',
      collectionServiceName: 'Lab blood draw',
      displayNames: 'CBC',
      pushedAt: '2026-06-07T12:00:00.000Z',
    },
  ]),
  fetchMyClinicPatientAlerts: vi.fn(async () => ({ data: { alerts: [], totalCount: 0 } })),
}));

const profile = {
  name: 'City Clinic',
  businessType: 'clinic',
  branding: {},
} as PublicBusinessProfile;

describe('SalonHomePage integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    push.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows lab-to-book home shortcut with pending count for clinic tenants', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <SalonHomePage slug="city-clinic" profile={profile} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(container.textContent).toContain('Lab collection to book');
    expect(container.textContent).toContain('1');

    const shortcut = Array.from(container.querySelectorAll('ion-button')).find((button) =>
      button.textContent?.includes('Lab collection to book'),
    );
    await act(async () => {
      shortcut?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(push).toHaveBeenCalledWith('/s/city-clinic/lab-to-book');
  });
});
