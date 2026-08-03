/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicBusinessProfile, PublicMultiServiceVisitSummary } from '../lib/types.js';
import * as publicApi from '../services/public-api.js';
import { ConsumerMultiServiceVisitActions } from './ConsumerMultiServiceVisitActions.js';

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

const visit: PublicMultiServiceVisitSummary = {
  multiServiceGroupId: 'g1',
  schedulingMode: 'same_visit',
  label: 'Neck + Face',
  appointments: [
    {
      bookingId: 'b1',
      serviceId: 'svc-1',
      serviceName: 'Neck',
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
    {
      bookingId: 'b2',
      serviceId: 'svc-2',
      serviceName: 'Face',
      startTime: '2026-07-28T10:00:00.000Z',
      endTime: '2026-07-28T11:00:00.000Z',
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

describe('ConsumerMultiServiceVisitActions (e2e-bug.34)', () => {
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

  it.each([
    {
      id: 'e2e-bug.34-cancel-cascades-via-anchor',
      run: async () => {
        const cancelSpy = vi
          .spyOn(publicApi, 'cancelCustomerBooking')
          .mockResolvedValue({ booking: { id: 'b1', status: 'cancelled' } });
        const onUpdated = vi.fn();
        await act(async () => {
          root.render(
            <ConsumerMultiServiceVisitActions
              slug="demo"
              tenant={tenant}
              anchorBookingId="b1"
              visit={visit}
              authed
              copy={CONSUMER_COPY_EN}
              onUpdated={onUpdated}
            />,
          );
        });
        const cancelBtn = Array.from(
          container.querySelectorAll('button.consumer-action-button'),
        ).find((el) =>
          (el.textContent ?? '').includes(CONSUMER_COPY_EN.cancelMultiServiceVisit),
        );
        expect(cancelBtn).toBeTruthy();
        await act(async () => {
          cancelBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
        });
        await vi.waitFor(() => {
          expect(cancelSpy).toHaveBeenCalledWith('demo', 'b1');
          expect(onUpdated).toHaveBeenCalled();
        });
        expect(window.confirm).toHaveBeenCalledWith(
          CONSUMER_COPY_EN.cancelMultiServiceVisitConfirm,
        );
      },
    },
    {
      id: 'e2e-bug.34-reschedule-uses-block-slots-and-anchor',
      run: async () => {
        vi.spyOn(publicApi, 'suggestPublicMultiServiceBlock').mockResolvedValue({
          employeeId: 'emp-1',
          employeeName: 'Alex',
          dateKey: '2026-08-01',
          startTime: '2026-08-01T09:00:00.000Z',
        });
        vi.spyOn(publicApi, 'getPublicMultiServiceBlockSlots').mockResolvedValue({
          date: '2026-08-01',
          serviceIds: ['svc-1', 'svc-2'],
          totalDurationMinutes: 120,
          slots: [
            {
              startTime: '2026-08-01T09:00:00.000Z',
              employeeId: 'emp-1',
              employeeName: 'Alex',
            },
          ],
        });
        const rescheduleSpy = vi.spyOn(publicApi, 'rescheduleCustomerBooking').mockResolvedValue({
          booking: { id: 'b1', startTime: '2026-08-01T09:00:00.000Z' },
          previousStartTime: '2026-07-28T09:00:00.000Z',
        });
        const onRescheduled = vi.fn();
        await act(async () => {
          root.render(
            <ConsumerMultiServiceVisitActions
              slug="demo"
              tenant={tenant}
              anchorBookingId="b1"
              visit={visit}
              authed
              copy={CONSUMER_COPY_EN}
              onUpdated={() => undefined}
              onRescheduled={onRescheduled}
            />,
          );
        });
        const rescheduleBtn = Array.from(
          container.querySelectorAll('button.consumer-action-button'),
        ).find((el) =>
          (el.textContent ?? '').includes(CONSUMER_COPY_EN.rescheduleMultiServiceVisit),
        );
        expect(rescheduleBtn).toBeTruthy();
        await act(async () => {
          rescheduleBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
        });
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 40));
        });
        const confirmBtn = Array.from(
          container.querySelectorAll('button.consumer-action-button'),
        ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.confirmReschedule));
        expect(confirmBtn).toBeTruthy();
        await act(async () => {
          confirmBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
        });
        await vi.waitFor(() => {
          expect(rescheduleSpy).toHaveBeenCalledWith('demo', 'b1', {
            startTime: '2026-08-01T09:00:00.000Z',
            employeeId: 'emp-1',
          });
          expect(onRescheduled).toHaveBeenCalledWith(
            '2026-07-28T09:00:00.000Z',
            '2026-08-01T09:00:00.000Z',
          );
        });
      },
    },
  ])('$id', async ({ run }) => {
    await run();
  });
});

describe('ConsumerMultiServiceVisitActions empty-slots reschedule panel (e2e-bug.313)', () => {
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
    vi.restoreAllMocks();
  });

  function findConfirmButton() {
    return Array.from(container.querySelectorAll('button.consumer-action-button')).find((el) =>
      (el.textContent ?? '').includes(CONSUMER_COPY_EN.confirmReschedule),
    );
  }

  it('hides Confirm and shows the no-slots message when the suggested day has zero slots', async () => {
    vi.spyOn(publicApi, 'suggestPublicMultiServiceBlock').mockRejectedValue(
      new Error('No available block found for the selected services'),
    );
    vi.spyOn(publicApi, 'getPublicMultiServiceBlockSlots').mockResolvedValue({
      date: '',
      serviceIds: ['svc-1', 'svc-2'],
      totalDurationMinutes: 0,
      slots: [],
    });

    await act(async () => {
      root.render(
        <ConsumerMultiServiceVisitActions
          slug="demo"
          tenant={tenant}
          anchorBookingId="b1"
          visit={visit}
          authed
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });
    const rescheduleBtn = Array.from(
      container.querySelectorAll('button.consumer-action-button'),
    ).find((el) => (el.textContent ?? '').includes(CONSUMER_COPY_EN.rescheduleMultiServiceVisit));
    expect(rescheduleBtn).toBeTruthy();
    await act(async () => {
      rescheduleBtn!.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain(CONSUMER_COPY_EN.noSlotsThisDay);
    });
    expect(findConfirmButton()).toBeUndefined();
  });
});
