import { describe, expect, it } from 'vitest';
import { formatBookingBlockHeadline } from './booking-types';

describe('formatBookingBlockHeadline currency (provider app)', () => {
  it('shows AMD price when service currency missing and business default is AMD', () => {
    const headline = formatBookingBlockHeadline({
      startTime: '2026-06-05T10:00:00.000Z',
      endTime: '2026-06-05T11:00:00.000Z',
      status: 'confirmed',
      service: { price: 12000, currency: null },
      businessCurrency: 'AMD',
    });
    expect(headline).toMatch(/֏|AMD/);
  });

  it('keeps legacy USD on EUR-default business', () => {
    const headline = formatBookingBlockHeadline({
      startTime: '2026-06-05T10:00:00.000Z',
      endTime: '2026-06-05T11:00:00.000Z',
      status: 'confirmed',
      service: { price: 45, currency: 'USD' },
      businessCurrency: 'EUR',
    });
    expect(headline).toContain('$');
  });
});
