import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LabToBookPage from './LabToBookPage.js';
import type { PublicBusinessProfile } from '../lib/types.js';

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: vi.fn(() => 'token'),
  getStoredCustomerProfile: vi.fn(() => ({ name: 'Jane Doe' })),
}));

import { getCustomerToken } from '../lib/customer-auth.js';

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

describe('LabToBookPage integration', () => {
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

  it('renders pending lab booking requests for signed-in customers', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <LabToBookPage slug="city-clinic" profile={profile} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC');
    expect(container.textContent).toContain('Book collection');
    expect(document.getElementById('my-lab-requests')).not.toBeNull();
  });

  it('prompts sign-in when customer is not authenticated', async () => {
    vi.mocked(getCustomerToken).mockReturnValueOnce(null as unknown as string);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <LabToBookPage slug="city-clinic" profile={profile} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain('Sign in to view pending lab collection requests');
  });
});
