import { describe, expect, it } from 'vitest';
import {
  loadPendingPackageCheckoutByPackage,
  loadPendingPackageCheckoutPayment,
  packageLinesMatch,
  requiresPackageOnlinePayment,
  resolvePackageAmountDue,
  savePendingPackageCheckoutPayment,
  showPackageCashOption,
} from './package-checkout-payment.util.js';

const lines = [
  { serviceId: 'svc-a', employeeId: 'emp-1', startTime: '2026-06-08T10:00:00.000Z' },
  { serviceId: 'svc-b', employeeId: 'emp-1', startTime: '2026-06-08T11:00:00.000Z' },
];

describe('package-checkout-payment.util', () => {
  it('resolves amount due from quote', () => {
    expect(resolvePackageAmountDue({ amountDue: 99 } as never, 120)).toBe(99);
    expect(resolvePackageAmountDue(null, 120)).toBe(120);
  });

  it('matches package lines by service and start time', () => {
    expect(packageLinesMatch(lines, [...lines])).toBe(true);
    expect(
      packageLinesMatch(lines, [
        { serviceId: 'svc-a', employeeId: 'emp-2', startTime: '2026-06-08T10:00:00.000Z' },
        lines[1],
      ]),
    ).toBe(true);
    expect(
      packageLinesMatch(lines, [
        { serviceId: 'svc-a', employeeId: 'emp-1', startTime: '2026-06-08T09:00:00.000Z' },
        lines[1],
      ]),
    ).toBe(false);
  });

  it('shows cash when tenant accepts cash and payment is due', () => {
    expect(
      showPackageCashOption({ acceptCashPayments: true, onlinePaymentsEnabled: true }, 50),
    ).toBe(true);
    expect(
      showPackageCashOption({ acceptCashPayments: false, onlinePaymentsEnabled: true }, 50),
    ).toBe(false);
  });

  it('requires online payment unless cash is selected', () => {
    expect(requiresPackageOnlinePayment({ onlinePaymentsEnabled: true }, 50, 'online')).toBe(true);
    expect(requiresPackageOnlinePayment({ onlinePaymentsEnabled: true }, 50, 'cash')).toBe(false);
    expect(requiresPackageOnlinePayment({ onlinePaymentsEnabled: true }, 0, 'online')).toBe(false);
  });

  it('persists and loads pending package checkout by slug, package, and lines', () => {
    savePendingPackageCheckoutPayment({
      slug: 'Salon-A',
      sessionId: 'sess-pkg',
      packageId: 'pkg-1',
      lines,
    });
    expect(loadPendingPackageCheckoutPayment('salon-a', 'pkg-2', lines)).toBeNull();
    expect(loadPendingPackageCheckoutPayment('salon-a', 'pkg-1', lines)?.sessionId).toBe(
      'sess-pkg',
    );
    expect(loadPendingPackageCheckoutByPackage('salon-a', 'pkg-1')?.lines).toEqual(lines);
  });
});
