import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import { ConsumerPatientAlertsBanner } from './ConsumerPatientAlertsBanner.js';

vi.mock('../services/public-api.js', () => ({
  fetchMyClinicPatientAlerts: vi.fn(),
  dismissMyClinicPatientAlert: vi.fn(),
}));

import {
  dismissMyClinicPatientAlert,
  fetchMyClinicPatientAlerts,
} from '../services/public-api.js';

const mockedFetch = vi.mocked(fetchMyClinicPatientAlerts);
const mockedDismiss = vi.mocked(dismissMyClinicPatientAlert);

describe('ConsumerPatientAlertsBanner', () => {
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
    props: Partial<React.ComponentProps<typeof ConsumerPatientAlertsBanner>> = {},
  ) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <ConsumerPatientAlertsBanner slug="city-clinic" copy={CONSUMER_COPY_EN} {...props} />
        </QueryClientProvider>,
      );
    });
  }

  it('renders alerts and dismisses via public customer API', async () => {
    mockedFetch.mockResolvedValue({
      data: {
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
      },
    });
    mockedDismiss.mockResolvedValue({ dismissed: true, id: 'dismiss-1' });

    renderBanner();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('CBC is ready to view.');

    const dismissButton = Array.from(container.querySelectorAll('ion-button')).find((button) =>
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

  it('navigates to the lab booking tab when View is tapped', async () => {
    mockedFetch.mockResolvedValue({
      data: {
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
      },
    });
    const onNavigate = vi.fn();

    renderBanner({ onNavigate });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const viewButton = Array.from(container.querySelectorAll('ion-button')).find((button) =>
      button.textContent?.includes('View'),
    );
    await act(async () => {
      viewButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onNavigate).toHaveBeenCalledWith('/lab-to-book', 'my-lab-requests');
  });

  it('navigates to intake section for incomplete intake alerts', async () => {
    mockedFetch.mockResolvedValue({
      data: {
        alerts: [
          {
            id: 'IntakeIncomplete:booking-1',
            type: 'IntakeIncomplete',
            sourceId: 'booking-1',
            bookingId: 'booking-1',
            title: 'Intake incomplete',
            messages: [{ title: 'Finish intake' }],
            chartTab: 'intake',
            createdAt: '2026-06-07T12:00:00.000Z',
            questionnaireTitle: 'Pre-visit form',
          },
        ],
        totalCount: 1,
      },
    });
    const onNavigate = vi.fn();

    renderBanner({ onNavigate });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const viewButton = Array.from(container.querySelectorAll('ion-button')).find((button) =>
      button.textContent?.includes('View'),
    );
    await act(async () => {
      viewButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onNavigate).toHaveBeenCalledWith('/account', 'my-intake');
  });

  it('uses fallback copy when released result has no test name', async () => {
    mockedFetch.mockResolvedValue({
      data: {
        alerts: [
          {
            id: 'TestResultReleased:result-2',
            type: 'TestResultReleased',
            sourceId: 'result-2',
            bookingId: 'booking-1',
            title: 'New lab result',
            messages: [{ title: 'Ready' }],
            chartTab: 'results',
            createdAt: '2026-06-07T12:00:00.000Z',
            testName: null,
          },
        ],
        totalCount: 1,
      },
    });

    renderBanner();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Lab result is ready to view.');
  });

  it('uses fallback copy for lab booking alerts without service names', async () => {
    mockedFetch.mockResolvedValue({
      data: {
        alerts: [
          {
            id: 'LabBookingRequestPending:order-2',
            type: 'LabBookingRequestPending',
            sourceId: 'order-2',
            bookingId: null,
            title: 'Lab collection to book',
            messages: [{ title: 'Book collection' }],
            chartTab: 'orders',
            createdAt: '2026-06-07T12:00:00.000Z',
            orderDisplayNames: null,
            collectionServiceName: null,
          },
        ],
        totalCount: 1,
      },
    });

    renderBanner();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain('Lab order');
  });
});
