/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicBusinessProfile, PublicPackageVisitSummary } from '../lib/types.js';
import * as publicApi from '../services/public-api.js';
import { ConsumerPackageVisitActions } from './ConsumerPackageVisitActions.js';

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: vi.fn(() => 'token'),
}));

const tenant = {
  id: 'biz-1',
  name: 'Demo',
  slug: 'demo',
  timezone: 'UTC',
  locale: 'en',
  currency: 'USD',
  branding: {},
  publicBookingEnabled: true,
  businessType: 'salon',
} as PublicBusinessProfile;

const packageVisit: PublicPackageVisitSummary = {
  packagePurchaseId: 'pp-1',
  packageId: 'pkg-1',
  packageName: 'Massage Package',
  appointments: [
    {
      bookingId: 'b1',
      serviceId: 'svc-1',
      serviceName: 'Massage',
      startTime: '2026-07-28T09:00:00.000Z',
      endTime: '2026-07-28T10:00:00.000Z',
      employeeId: 'emp-1',
      employeeName: 'Alex',
      status: 'confirmed',
      canCancel: true,
      canReschedule: true,
      rescheduleCount: 0,
      maxReschedules: 3,
    },
  ],
  canCancelAll: true,
  canRescheduleAll: true,
  policyMessage: null,
  allowProviderChangeOnReschedule: true,
};

function durationCapError() {
  const err = new Error('Request failed with status code 400') as Error & {
    response?: { data?: { message?: string } };
  };
  err.response = {
    data: {
      message: 'Total visit duration (365 min) exceeds the 180 minute limit',
    },
  };
  return err;
}

describe('ConsumerPackageVisitActions (e2e-bug.36)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.spyOn(publicApi, 'suggestPackageBlock').mockReset();
    vi.spyOn(publicApi, 'fetchPackageBlockSlots').mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  async function openReschedulePicker() {
    await act(async () => {
      root.render(
        <ConsumerPackageVisitActions
          slug="demo"
          tenant={tenant}
          anchorBookingId="b1"
          packageVisit={packageVisit}
          manageToken="tok"
          authed={false}
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });

    const rescheduleBtn = Array.from(
      container.querySelectorAll('button.consumer-action-button'),
    ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.reschedulePackageVisit));
    expect(rescheduleBtn).toBeTruthy();
    await act(async () => {
      rescheduleBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
  }

  it.each([
    {
      id: 'e2e-bug.36-suggest-duration-cap',
      setup: () => {
        vi.spyOn(publicApi, 'suggestPackageBlock').mockRejectedValue(durationCapError());
        vi.spyOn(publicApi, 'fetchPackageBlockSlots').mockResolvedValue({ slots: [] });
      },
      expectFetchSlots: false,
    },
    {
      id: 'e2e-bug.36-block-slots-duration-cap',
      setup: () => {
        vi.spyOn(publicApi, 'suggestPackageBlock').mockResolvedValue({
          dateKey: '2026-07-20',
          startTime: '2026-07-20T09:00:00.000Z',
          employeeId: 'emp-1',
          employeeName: 'Alex',
        });
        vi.spyOn(publicApi, 'fetchPackageBlockSlots').mockRejectedValue(durationCapError());
      },
      expectFetchSlots: true,
    },
  ])(
    '$id: shows packageCannotSchedule instead of silent empty picker',
    async ({ setup, expectFetchSlots }) => {
      setup();
      await openReschedulePicker();

      await vi.waitFor(() => {
        expect(container.textContent).toContain(CONSUMER_COPY_EN.packageCannotSchedule);
      });
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.textContent).toBe(CONSUMER_COPY_EN.packageCannotSchedule);
      expect(container.textContent).not.toContain('Request failed with status code 400');
      if (!expectFetchSlots) {
        expect(publicApi.fetchPackageBlockSlots).not.toHaveBeenCalled();
      }
    },
  );
});

describe('ConsumerPackageVisitActions cancel refund notice (e2e-bug.186)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  async function clickCancel() {
    await act(async () => {
      root.render(
        <ConsumerPackageVisitActions
          slug="demo"
          tenant={tenant}
          anchorBookingId="b1"
          packageVisit={packageVisit}
          manageToken="tok"
          authed={false}
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });
    const cancelBtn = Array.from(
      container.querySelectorAll('button.consumer-action-button'),
    ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.cancelPackageVisit));
    expect(cancelBtn).toBeTruthy();
    await act(async () => {
      cancelBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }

  it('shows the refunded notice when the backend reports refundStatus: refunded', async () => {
    vi.spyOn(publicApi, 'cancelPackageVisitWithToken').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
      refundStatus: 'refunded',
    });
    await clickCancel();
    expect(container.textContent).toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
  });

  it('shows the refund-failed notice when the backend reports refundStatus: failed', async () => {
    vi.spyOn(publicApi, 'cancelPackageVisitWithToken').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
      refundStatus: 'failed',
    });
    await clickCancel();
    expect(container.textContent).toContain(CONSUMER_COPY_EN.cancelBookingRefundFailed);
  });

  it('shows no refund notice when refundStatus is absent (e.g. cash / already refunded)', async () => {
    vi.spyOn(publicApi, 'cancelPackageVisitWithToken').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
    });
    await clickCancel();
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefundFailed);
  });

  it('shows no refund notice for refundStatus: already_refunded (matches plain-booking design)', async () => {
    vi.spyOn(publicApi, 'cancelPackageVisitWithToken').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
      refundStatus: 'already_refunded',
    });
    await clickCancel();
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefundFailed);
  });

  it('shows no refund notice for refundStatus: skipped (matches plain-booking design)', async () => {
    vi.spyOn(publicApi, 'cancelPackageVisitWithToken').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
      refundStatus: 'skipped',
    });
    await clickCancel();
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefundFailed);
  });

  it('surfaces the refunded notice on the signed-in account path too, not just the guest-token path', async () => {
    vi.spyOn(publicApi, 'cancelCustomerPackageVisit').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
      refundStatus: 'refunded',
    });
    await act(async () => {
      root.render(
        <ConsumerPackageVisitActions
          slug="demo"
          tenant={tenant}
          anchorBookingId="b1"
          packageVisit={packageVisit}
          authed
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });
    const cancelBtn = Array.from(
      container.querySelectorAll('button.consumer-action-button'),
    ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.cancelPackageVisit));
    expect(cancelBtn).toBeTruthy();
    await act(async () => {
      cancelBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(publicApi.cancelCustomerPackageVisit).toHaveBeenCalledWith('demo', 'b1');
    expect(container.textContent).toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
  });

  it('surfaces the refund-failed notice on the signed-in account path too', async () => {
    vi.spyOn(publicApi, 'cancelCustomerPackageVisit').mockResolvedValue({
      bookings: [{ id: 'b1', status: 'cancelled' }],
      refundStatus: 'failed',
    });
    await act(async () => {
      root.render(
        <ConsumerPackageVisitActions
          slug="demo"
          tenant={tenant}
          anchorBookingId="b1"
          packageVisit={packageVisit}
          authed
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });
    const cancelBtn = Array.from(
      container.querySelectorAll('button.consumer-action-button'),
    ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.cancelPackageVisit));
    await act(async () => {
      cancelBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(container.textContent).toContain(CONSUMER_COPY_EN.cancelBookingRefundFailed);
  });

  it('clears a prior refund notice if the network call itself fails on a later attempt', async () => {
    const spy = vi
      .spyOn(publicApi, 'cancelPackageVisitWithToken')
      .mockResolvedValueOnce({
        bookings: [{ id: 'b1', status: 'cancelled' }],
        refundStatus: 'refunded',
      })
      .mockRejectedValueOnce(new Error('network down'));
    await clickCancel();
    expect(container.textContent).toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
    await clickCancel();
    expect(container.textContent).not.toContain(CONSUMER_COPY_EN.cancelBookingRefunded);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
