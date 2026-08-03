import { describe, expect, it } from 'vitest';
import type { PublicService } from './public-api';
import {
  resolveServicePrepaymentBadge,
  shouldShowServicePrepaymentBadge,
} from './service-prepayment-badge.util';

const labels = {
  deposit: 'Deposit {amount}',
  payOnline: 'Pay online',
  payOnlineAmount: 'Pay online {amount}',
};

function svc(
  partial: Partial<PublicService> & Pick<PublicService, 'id' | 'name'>,
): PublicService {
  return {
    durationMinutes: 60,
    bufferMinutes: 0,
    price: 100,
    currency: 'USD',
    prepaymentMode: 'none',
    onlinePaymentEnabled: false,
    depositAmount: null,
    ...partial,
  };
}

describe('service-prepayment-badge.util (e2e-bug.209)', () => {
  it.each([
    {
      id: 'none-offline',
      service: svc({ id: '1', name: 'A' }),
      expected: false,
    },
    {
      id: 'none-online-flag-only',
      service: svc({
        id: '2',
        name: 'A',
        onlinePaymentEnabled: true,
        prepaymentMode: 'none',
      }),
      expected: false,
    },
    {
      id: 'full',
      service: svc({
        id: '3',
        name: 'A',
        onlinePaymentEnabled: true,
        prepaymentMode: 'full',
      }),
      expected: true,
    },
    {
      id: 'deposit',
      service: svc({
        id: '4',
        name: 'A',
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        depositAmount: 25,
      }),
      expected: true,
    },
    {
      id: 'deposit-amount-without-mode',
      service: svc({
        id: '5',
        name: 'A',
        onlinePaymentEnabled: true,
        prepaymentMode: 'none',
        depositAmount: 10,
      }),
      expected: true,
    },
    {
      id: 'deposit-offline',
      service: svc({
        id: '6',
        name: 'A',
        onlinePaymentEnabled: false,
        prepaymentMode: 'deposit',
        depositAmount: 25,
      }),
      expected: false,
    },
  ])('shouldShowServicePrepaymentBadge: $id', ({ service, expected }) => {
    expect(shouldShowServicePrepaymentBadge(service)).toBe(expected);
  });

  it('resolve: full prepay uses full price', () => {
    const badge = resolveServicePrepaymentBadge(
      svc({
        id: 'f',
        name: 'Full',
        onlinePaymentEnabled: true,
        prepaymentMode: 'full',
        price: 80,
      }),
      labels,
    );
    expect(badge?.kind).toBe('full');
    expect(badge?.amount).toBe(80);
    expect(badge?.label).toMatch(/Pay online/);
    expect(badge?.label).toMatch(/80/);
  });

  it('resolve: deposit uses fixed depositAmount', () => {
    const badge = resolveServicePrepaymentBadge(
      svc({
        id: 'd',
        name: 'Dep',
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        depositAmount: 25,
        price: 100,
      }),
      labels,
    );
    expect(badge?.kind).toBe('deposit');
    expect(badge?.amount).toBe(25);
    expect(badge?.label).toMatch(/Deposit/);
    expect(badge?.label).toMatch(/25/);
  });

  it('resolve: deposit without amount defaults to 50%', () => {
    const badge = resolveServicePrepaymentBadge(
      svc({
        id: 'd50',
        name: 'Dep',
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        depositAmount: null,
        price: 100,
      }),
      labels,
    );
    expect(badge?.kind).toBe('deposit');
    expect(badge?.amount).toBe(50);
    expect(badge?.label).toMatch(/Deposit/);
    expect(badge?.label).toMatch(/50/);
  });

  it('resolve: depositAmount capped at price', () => {
    const badge = resolveServicePrepaymentBadge(
      svc({
        id: 'cap',
        name: 'Cap',
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        depositAmount: 999,
        price: 40,
      }),
      labels,
    );
    expect(badge?.amount).toBe(40);
    expect(badge?.label).toMatch(/40/);
  });

  it('resolve: returns null when online payments disabled', () => {
    expect(
      resolveServicePrepaymentBadge(
        svc({
          id: 'off',
          name: 'Off',
          onlinePaymentEnabled: false,
          prepaymentMode: 'full',
        }),
        labels,
      ),
    ).toBeNull();
  });

  it('resolve: business currency override for formatting', () => {
    const badge = resolveServicePrepaymentBadge(
      svc({
        id: 'eur',
        name: 'Eur',
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        depositAmount: 20,
        price: 100,
        currency: '',
      }),
      labels,
      'EUR',
    );
    expect(badge?.label).toMatch(/Deposit/);
    expect(badge?.label).toMatch(/20/);
  });
});
