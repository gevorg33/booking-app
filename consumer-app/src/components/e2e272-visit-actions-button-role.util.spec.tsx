/** @vitest-environment happy-dom */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type {
  PublicBusinessProfile,
  PublicMultiServiceVisitSummary,
  PublicPackageVisitSummary,
} from '../lib/types.js';
import { ConsumerMultiServiceVisitActions } from './ConsumerMultiServiceVisitActions.js';
import { ConsumerPackageVisitActions } from './ConsumerPackageVisitActions.js';
import {
  E2E272_NATIVE_CTA_SELECTOR,
  E2E272_SOURCE_FILES,
  E2E272_UNIT_CASES,
} from './e2e272-visit-actions-button-role.fixtures.js';

vi.mock('../lib/customer-auth.js', () => ({
  getCustomerToken: vi.fn(() => 'token'),
}));

vi.mock('../services/public-api.js', () => ({
  cancelCustomerPackageVisit: vi.fn(),
  cancelPackageVisitWithToken: vi.fn(),
  fetchPackageBlockSlots: vi.fn(async () => ({
    slots: [
      {
        startTime: '2026-08-20T14:00:00.000Z',
        employeeId: 'emp-1',
        employeeName: 'Alex',
      },
      {
        startTime: '2026-08-20T15:00:00.000Z',
        employeeId: 'emp-1',
        employeeName: 'Alex',
      },
    ],
  })),
  fetchPublicPackage: vi.fn(),
  rescheduleCustomerPackageVisit: vi.fn(),
  reschedulePackageVisitWithToken: vi.fn(),
  suggestPackageBlock: vi.fn(async () => ({
    dateKey: '2026-08-20',
    startTime: '2026-08-20T14:00:00.000Z',
    employeeId: 'emp-1',
    employeeName: 'Alex',
  })),
  cancelBookingWithToken: vi.fn(),
  cancelCustomerBooking: vi.fn(),
  getPublicMultiServiceBlockSlots: vi.fn(async () => ({
    date: '2026-08-20',
    serviceIds: ['svc-1', 'svc-2'],
    totalDurationMinutes: 120,
    slots: [
      {
        startTime: '2026-08-20T14:00:00.000Z',
        employeeId: 'emp-1',
        employeeName: 'Alex',
      },
      {
        startTime: '2026-08-20T15:00:00.000Z',
        employeeId: 'emp-1',
        employeeName: 'Alex',
      },
    ],
  })),
  rescheduleBookingWithToken: vi.fn(),
  rescheduleCustomerBooking: vi.fn(),
  suggestPublicMultiServiceBlock: vi.fn(async () => ({
    dateKey: '2026-08-20',
    startTime: '2026-08-20T14:00:00.000Z',
    employeeId: 'emp-1',
    employeeName: 'Alex',
  })),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
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
      startTime: '2026-08-01T10:00:00.000Z',
      endTime: '2026-08-01T11:00:00.000Z',
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

const multiVisit: PublicMultiServiceVisitSummary = {
  multiServiceGroupId: 'g1',
  schedulingMode: 'same_visit',
  label: 'Neck + Face',
  appointments: [
    {
      bookingId: 'b1',
      serviceId: 'svc-1',
      serviceName: 'Neck',
      startTime: '2026-08-01T10:00:00.000Z',
      endTime: '2026-08-01T11:00:00.000Z',
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
      startTime: '2026-08-01T11:00:00.000Z',
      endTime: '2026-08-01T12:00:00.000Z',
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

describe('e2e-bug.272 fixture registry', () => {
  it('documents every unit scenario id', () => {
    expect(E2E272_UNIT_CASES.map((c) => c.id)).toEqual([
      'package-cancel-reschedule-native',
      'package-slot-aria-pressed',
      'package-confirm-native',
      'package-no-ion-button-ctas',
      'multi-cancel-reschedule-native',
      'multi-slot-aria-pressed',
      'multi-confirm-native',
      'multi-no-ion-button-ctas',
      'source-package-actions-no-ion-button',
      'source-multi-actions-no-ion-button',
    ]);
  });
});

describe('e2e-bug.272 package / multi-service visit native CTAs', () => {
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

  it('package-cancel-reschedule-native + slot aria-pressed + confirm + no ion-button', async () => {
    act(() => {
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

    const topButtons = [...container.querySelectorAll(E2E272_NATIVE_CTA_SELECTOR)];
    const reschedule = topButtons.find((b) =>
      /reschedule package visit/i.test(b.textContent || ''),
    );
    const cancel = topButtons.find((b) => /cancel package visit/i.test(b.textContent || ''));
    expect(reschedule).not.toBeNull();
    expect(cancel).not.toBeNull();
    expect(reschedule?.classList.contains('consumer-action-button--small')).toBe(true);
    expect(cancel?.classList.contains('consumer-action-button--danger')).toBe(true);
    expect(container.querySelectorAll('ion-button').length).toBe(0);

    act(() => {
      reschedule?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(reschedule?.getAttribute('aria-expanded')).toBe('true');

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const slotButtons = [...container.querySelectorAll(E2E272_NATIVE_CTA_SELECTOR)].filter(
      (b) => b.getAttribute('aria-pressed') != null,
    );
    expect(slotButtons.length).toBeGreaterThanOrEqual(1);

    act(() => {
      slotButtons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(slotButtons[1]?.getAttribute('aria-pressed')).toBe('true');

    const confirm = [...container.querySelectorAll(E2E272_NATIVE_CTA_SELECTOR)].find((b) =>
      /confirm reschedule/i.test(b.textContent || ''),
    );
    expect(confirm).not.toBeNull();
    expect(confirm?.closest('ion-button')).toBeNull();
    expect(confirm?.classList.contains('consumer-action-button--block')).toBe(true);
  });

  it('multi-cancel-reschedule-native + slot aria-pressed + confirm + no ion-button', async () => {
    act(() => {
      root.render(
        <ConsumerMultiServiceVisitActions
          slug="demo"
          tenant={tenant}
          anchorBookingId="b1"
          visit={multiVisit}
          authed
          copy={CONSUMER_COPY_EN}
          onUpdated={() => undefined}
        />,
      );
    });

    const topButtons = [...container.querySelectorAll(E2E272_NATIVE_CTA_SELECTOR)];
    const reschedule = topButtons.find((b) =>
      /^reschedule visit$/i.test((b.textContent || '').trim()),
    );
    const cancel = topButtons.find((b) =>
      /^cancel visit$/i.test((b.textContent || '').trim()),
    );
    expect(reschedule).not.toBeNull();
    expect(cancel).not.toBeNull();
    expect(reschedule?.classList.contains('consumer-action-button--small')).toBe(true);
    expect(cancel?.classList.contains('consumer-action-button--danger')).toBe(true);
    expect(container.querySelectorAll('ion-button').length).toBe(0);

    act(() => {
      reschedule?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(reschedule?.getAttribute('aria-expanded')).toBe('true');

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const slotButtons = [...container.querySelectorAll(E2E272_NATIVE_CTA_SELECTOR)].filter(
      (b) => b.getAttribute('aria-pressed') != null,
    );
    expect(slotButtons.length).toBeGreaterThanOrEqual(1);

    act(() => {
      slotButtons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(slotButtons[0]?.getAttribute('aria-pressed')).toBe('true');

    const confirm = [...container.querySelectorAll(E2E272_NATIVE_CTA_SELECTOR)].find((b) =>
      /confirm reschedule/i.test(b.textContent || ''),
    );
    expect(confirm).not.toBeNull();
    expect(confirm?.closest('ion-button')).toBeNull();
    expect(confirm?.classList.contains('consumer-action-button--block')).toBe(true);
  });

  it('source-package-actions-no-ion-button + source-multi-actions-no-ion-button', () => {
    for (const file of E2E272_SOURCE_FILES) {
      const source = readFileSync(resolve(__dirname, file), 'utf8');
      expect(/\bIonButton\b/.test(source)).toBe(false);
      expect(/<IonButton\b/.test(source)).toBe(false);
    }
  });

  it.each(E2E272_UNIT_CASES.map((c) => [c.id, c.description] as const))(
    'fixture case registered: %s — %s',
    (id) => {
      expect(typeof id).toBe('string');
    },
  );
});
