import { describe, expect, it, vi } from 'vitest';
import {
  formatBookingBlockHeadline,
  formatServicePrice,
} from './booking-types';

describe('booking-types currency (provider app)', () => {
  describe('formatServicePrice', () => {
    it('returns null for missing or invalid price', () => {
      expect(formatServicePrice(undefined)).toBeNull();
      expect(formatServicePrice(null)).toBeNull();
      expect(formatServicePrice('')).toBeNull();
      expect(formatServicePrice('bad')).toBeNull();
    });

    it('formats numeric and string prices', () => {
      expect(formatServicePrice(50, 'USD')).toContain('$');
      expect(formatServicePrice('75', 'EUR')).toMatch(/€|EUR/);
    });

    it('falls back to code suffix for invalid currency', () => {
      expect(formatServicePrice(10, 'NOTREAL')).toBe('10 NOTREAL');
    });

    it('defaults currency to USD when omitted', () => {
      expect(formatServicePrice(20)).toContain('$');
    });
  });

  describe('formatBookingBlockHeadline', () => {
    const base = {
      startTime: '2026-06-05T10:00:00.000Z',
      endTime: '2026-06-05T11:00:00.000Z',
      status: 'confirmed',
    };

    it('omits price when service is missing', () => {
      const headline = formatBookingBlockHeadline({ ...base, service: null });
      expect(headline).not.toMatch(/\$|€|֏/);
    });

    it('omits price when service has no price', () => {
      const headline = formatBookingBlockHeadline({
        ...base,
        service: { price: null, currency: 'USD' },
      });
      expect(headline).not.toContain('$');
    });

    it('uses translated status label when t is provided', () => {
      const t = vi.fn((key: string) => `tr:${key}`);
      formatBookingBlockHeadline(
        { ...base, service: { price: 30, currency: 'USD' }, businessCurrency: 'USD' },
        t,
      );
      expect(t).toHaveBeenCalledWith('bookings.statusConfirmed');
    });

    it('uses business currency when service currency is absent', () => {
      const headline = formatBookingBlockHeadline({
        ...base,
        service: { price: 5000, currency: null },
        businessCurrency: 'AMD',
      });
      expect(headline).toMatch(/֏|AMD/);
    });
  });
});
