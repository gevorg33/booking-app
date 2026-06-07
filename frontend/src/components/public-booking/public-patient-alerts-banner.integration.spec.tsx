import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/i18n/I18nProvider';
import { PublicPatientAlertsBanner } from './public-patient-alerts-banner';

vi.mock('@/lib/public-api', () => ({
  getPublicCustomerClinicPatientAlerts: vi.fn(),
  dismissPublicCustomerClinicPatientAlert: vi.fn(),
}));

import {
  dismissPublicCustomerClinicPatientAlert,
  getPublicCustomerClinicPatientAlerts,
} from '@/lib/public-api';

const mockedGetAlerts = vi.mocked(getPublicCustomerClinicPatientAlerts);
const mockedDismiss = vi.mocked(dismissPublicCustomerClinicPatientAlert);

describe('PublicPatientAlertsBanner', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderBanner(
    props: Partial<React.ComponentProps<typeof PublicPatientAlertsBanner>> = {},
  ) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <QueryClientProvider client={client}>
            <PublicPatientAlertsBanner slug="city-clinic" {...props} />
          </QueryClientProvider>
        </I18nProvider>,
      );
    });
  }

  it('renders clinic alerts and dismisses via public customer API', async () => {
    mockedGetAlerts.mockResolvedValue({
      alerts: [
        {
          id: 'TestResultReleased:result-1',
          type: 'TestResultReleased',
          sourceId: 'result-1',
          bookingId: 'booking-1',
          title: 'New lab result',
          messages: [{ title: 'CBC is ready to view.' }],
          chartTab: 'results',
          createdAt: '2026-06-07T12:00:00.000Z',
          testName: 'CBC',
        },
      ],
      totalCount: 1,
    });
    mockedDismiss.mockResolvedValue({ dismissed: true, id: 'dismiss-1' });

    renderBanner();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC');
    expect(mockedGetAlerts).toHaveBeenCalledWith('city-clinic');

    const dismissButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Dismiss'),
    );
    await act(async () => {
      dismissButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockedDismiss).toHaveBeenCalledWith(
      'city-clinic',
      'TestResultReleased',
      'result-1',
    );
  });

  it('calls onViewAlert with account anchor for lab booking alerts', async () => {
    mockedGetAlerts.mockResolvedValue({
      alerts: [
        {
          id: 'LabBookingRequestPending:order-1',
          type: 'LabBookingRequestPending',
          sourceId: 'order-1',
          bookingId: null,
          title: 'Lab collection to book',
          messages: [{ title: 'Book collection' }],
          chartTab: 'orders',
          createdAt: '2026-06-07T12:00:00.000Z',
          orderDisplayNames: 'CBC',
          collectionServiceName: 'Lab blood draw',
        },
      ],
      totalCount: 1,
    });
    const onViewAlert = vi.fn();

    renderBanner({ onViewAlert });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const viewButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('View'),
    );
    await act(async () => {
      viewButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onViewAlert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LabBookingRequestPending' }),
      'my-lab-requests',
    );
  });
});
