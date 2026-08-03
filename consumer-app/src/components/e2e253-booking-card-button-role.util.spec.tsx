/** @vitest-environment happy-dom */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicCustomerBookingItem } from '../lib/types.js';
import { BookingCard } from '../pages/AccountPage.js';
import { ConsumerBookingActions } from './ConsumerBookingActions.js';
import {
  E2E253_CSS_MARKERS,
  E2E253_NATIVE_CTA_SELECTOR,
  E2E253_UNIT_CASES,
} from './e2e253-booking-card-button-role.fixtures.js';

vi.mock('../services/public-api.js', () => ({
  cancelBookingWithToken: vi.fn(),
  cancelCustomerBooking: vi.fn(),
  fetchServiceDaySlots: vi.fn(async () => ({
    slots: [
      {
        startTime: '2026-08-20T14:00:00.000Z',
        endTime: '2026-08-20T14:30:00.000Z',
        employeeId: 'emp-1',
      },
      {
        startTime: '2026-08-20T15:00:00.000Z',
        endTime: '2026-08-20T15:30:00.000Z',
        employeeId: 'emp-1',
      },
    ],
  })),
  rescheduleBookingWithToken: vi.fn(),
  rescheduleCustomerBooking: vi.fn(),
  claimShareReward: vi.fn(),
  fetchMyBookings: vi.fn(),
  fetchMySubscriptions: vi.fn(),
  getPublicCustomerGiftCards: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonToast: () => [vi.fn()],
    IonDatetime: ({
      onIonChange,
    }: {
      onIonChange?: (e: { detail: { value: string } }) => void;
    }) => (
      <button
        type="button"
        data-testid="mock-datetime"
        onClick={() =>
          onIonChange?.({ detail: { value: '2026-08-20T00:00:00.000Z' } })
        }
      >
        pick-date
      </button>
    ),
  };
});

const baseBooking: PublicCustomerBookingItem = {
  id: 'bk-1',
  startTime: '2026-08-01T10:00:00.000Z',
  endTime: '2026-08-01T10:30:00.000Z',
  status: 'completed',
  paymentStatus: 'paid',
  serviceName: 'Swedish massage',
  employeeName: 'Alex',
  employeeId: 'emp-1',
  serviceId: 'svc-1',
  canCancel: false,
  canReschedule: false,
  canReview: true,
};

describe('e2e-bug.253 fixture registry', () => {
  it('documents every unit scenario id', () => {
    expect(E2E253_UNIT_CASES.map((c) => c.id)).toEqual([
      'booking-card-review-native',
      'booking-card-rebook-native',
      'booking-card-share-native',
      'booking-card-no-ion-button-ctas',
      'actions-cancel-reschedule-native',
      'actions-slot-aria-pressed',
      'actions-confirm-native',
      'css-small-marker-present',
    ]);
  });
});

describe('e2e-bug.253 booking-card / booking-actions native CTAs', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.setItem('consumer_token_demo', 'test-token');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it('booking-card-review/rebook/share-native + no ion-button hosts', () => {
    const onReview = vi.fn();
    const onRebook = vi.fn();
    act(() => {
      root.render(
        <BookingCard
          booking={baseBooking}
          slug="demo"
          businessName="Demo Salon"
          locale="en"
          copy={CONSUMER_COPY_EN}
          authed
          onUpdated={() => undefined}
          onRescheduled={() => undefined}
          onReview={onReview}
          onRebook={onRebook}
        />,
      );
    });

    const buttons = [...container.querySelectorAll(E2E253_NATIVE_CTA_SELECTOR)];
    const review = buttons.find((b) => /rate your visit/i.test(b.textContent || ''));
    const rebook = buttons.find((b) => /rebook/i.test(b.textContent || ''));
    const share = buttons.find((b) => /share booking/i.test(b.textContent || ''));

    expect(review).not.toBeNull();
    expect(rebook).not.toBeNull();
    expect(share).not.toBeNull();
    expect(review?.closest('ion-button')).toBeNull();
    expect(rebook?.closest('ion-button')).toBeNull();
    expect(share?.closest('ion-button')).toBeNull();
    expect(container.querySelectorAll('ion-button').length).toBe(0);

    act(() => {
      review?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      rebook?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onRebook).toHaveBeenCalledTimes(1);
  });

  it('actions-cancel-reschedule-native + slot aria-pressed + confirm native', async () => {
    const manageBooking: PublicCustomerBookingItem = {
      ...baseBooking,
      status: 'confirmed',
      canReview: false,
      canCancel: true,
      canReschedule: true,
    };

    act(() => {
      root.render(
        <ConsumerBookingActions
          booking={manageBooking}
          slug="demo"
          authed
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });

    const topButtons = [...container.querySelectorAll(E2E253_NATIVE_CTA_SELECTOR)];
    const reschedule = topButtons.find((b) =>
      /^reschedule$/i.test((b.textContent || '').trim()),
    );
    const cancel = topButtons.find((b) => /cancel appointment/i.test(b.textContent || ''));
    expect(reschedule).not.toBeNull();
    expect(cancel).not.toBeNull();
    expect(reschedule?.classList.contains('consumer-action-button--small')).toBe(true);
    expect(cancel?.classList.contains('consumer-action-button--danger')).toBe(true);
    expect(container.querySelectorAll('ion-button').length).toBe(0);

    act(() => {
      reschedule?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(reschedule?.getAttribute('aria-expanded')).toBe('true');

    const datetime = container.querySelector('[data-testid="mock-datetime"]');
    expect(datetime).not.toBeNull();
    await act(async () => {
      datetime?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const slotButtons = [...container.querySelectorAll(E2E253_NATIVE_CTA_SELECTOR)].filter(
      (b) => b.getAttribute('aria-pressed') != null,
    );
    expect(slotButtons.length).toBeGreaterThanOrEqual(1);

    act(() => {
      slotButtons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(slotButtons[0]?.getAttribute('aria-pressed')).toBe('true');

    const confirm = [...container.querySelectorAll(E2E253_NATIVE_CTA_SELECTOR)].find((b) =>
      /confirm reschedule/i.test(b.textContent || ''),
    );
    expect(confirm).not.toBeNull();
    expect(confirm?.closest('ion-button')).toBeNull();
    expect(confirm?.classList.contains('consumer-action-button--block')).toBe(true);
  });

  it('css-small-marker-present: variables.css keeps e2e-bug.253 rules', () => {
    const css = readFileSync(resolve(__dirname, '../theme/variables.css'), 'utf8');
    for (const marker of E2E253_CSS_MARKERS) {
      expect(css).toContain(marker);
    }
  });

  it.each(E2E253_UNIT_CASES.map((c) => [c.id, c.description] as const))(
    'fixture case registered: %s — %s',
    (id) => {
      expect(typeof id).toBe('string');
    },
  );
});
