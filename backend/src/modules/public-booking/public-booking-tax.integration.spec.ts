import { ConfigService } from '@nestjs/config';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { PublicBookingService } from './public-booking.service.js';
import {
  formatInclusiveTaxBadge,
  readBusinessTaxSettings,
  toPublicBusinessTaxSettings,
} from '../../common/utils/business-tax.util.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

function buildPublicBookingService(): PublicBookingService {
  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };
  const multiServiceBookingsService = new MultiServiceBookingsService(
    { create: jest.fn(), save: jest.fn() } as never,
    { findOne: jest.fn(), save: jest.fn() } as never,
    { find: jest.fn() } as never,
  );
  return new PublicBookingService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      isConnectReady: jest.fn().mockReturnValue(false),
    } as unknown as StripeIntegrationService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    multiServiceBookingsService,
    {} as never,
    {} as never,
    config as unknown as ConfigService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  
    // e2e-bug: PublicBookingService gained four repositories;
    // `undefined as never` keeps the runtime identical to omitting them.
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never);
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
      ...settings,
    },
  });

describe('Sprint 36 — public booking tax integration', () => {
  const publicBookingService = buildPublicBookingService();

  it.each([
    {
      id: 'exclusive-vat-20',
      settings: {
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: 'AM-123',
        },
      },
      publicTax: { enabled: true, name: 'VAT', rate: 20, model: 'exclusive' },
      badge: null,
    },
    {
      id: 'inclusive-gst-5',
      settings: {
        tax: {
          enabled: true,
          name: 'GST',
          rate: 5,
          model: 'inclusive',
        },
      },
      publicTax: { enabled: true, name: 'GST', rate: 5, model: 'inclusive' },
      badge: 'incl. 5% GST',
    },
    {
      id: 'inclusive-decimal-rate',
      settings: {
        tax: {
          enabled: true,
          name: 'Sales Tax',
          rate: 7.5,
          model: 'inclusive',
        },
      },
      publicTax: {
        enabled: true,
        name: 'Sales Tax',
        rate: 7.5,
        model: 'inclusive',
      },
      badge: 'incl. 7.5% Sales Tax',
    },
    {
      id: 'disabled-tax',
      settings: { tax: { enabled: false, rate: 20, model: 'exclusive' } },
      publicTax: undefined,
      badge: null,
    },
    {
      id: 'zero-rate',
      settings: { tax: { enabled: true, rate: 0, model: 'exclusive' } },
      publicTax: undefined,
      badge: null,
    },
    {
      id: 'invalid-model-fallback',
      settings: {
        tax: { enabled: true, name: 'VAT', rate: 10, model: 'invalid' },
      },
      publicTax: { enabled: true, name: 'VAT', rate: 10, model: 'exclusive' },
      badge: null,
    },
    {
      id: 'missing-tax-block',
      settings: {},
      publicTax: undefined,
      badge: null,
    },
    {
      id: 'stacked-gst-pst-inclusive',
      settings: {
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'inclusive',
          rules: [
            { id: 'gst', name: 'GST', rate: 5 },
            { id: 'pst', name: 'PST', rate: 8 },
          ],
        },
      },
      publicTax: {
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'inclusive',
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      },
      badge: 'incl. 13% GST + PST',
    },
    {
      id: 'stacked-gst-pst-exclusive',
      settings: {
        tax: {
          enabled: true,
          name: 'Tax',
          rate: 13,
          model: 'exclusive',
          rules: [
            { id: 'gst', name: 'GST', rate: 5 },
            { id: 'pst', name: 'PST', rate: 8 },
          ],
        },
      },
      publicTax: {
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'exclusive',
        rules: [
          { name: 'GST', rate: 5 },
          { name: 'PST', rate: 8 },
        ],
      },
      badge: null,
    },
  ])('profile + display pipeline for $id', ({ settings, publicTax, badge }) => {
    const profile = publicBookingService.toPublicProfile(
      baseBusiness(settings),
    );

    if (publicTax) {
      expect(profile.tax).toEqual(publicTax);
    } else {
      expect(profile.tax).toBeUndefined();
    }

    const stored = readBusinessTaxSettings(settings);
    const exposed = toPublicBusinessTaxSettings(stored);
    if (publicTax) {
      expect(exposed).toEqual(publicTax);
      if (badge) {
        expect(formatInclusiveTaxBadge(exposed!)).toBe(badge);
      }
    } else {
      expect(exposed).toBeUndefined();
    }
  });

  it('does not expose tax registration number on public profile (v1)', () => {
    const profile = publicBookingService.toPublicProfile(
      baseBusiness({
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          taxNumber: 'SECRET-123',
        },
      }),
    );
    expect(profile.tax).toEqual({
      enabled: true,
      name: 'VAT',
      rate: 20,
      model: 'exclusive',
    });
    expect(profile.tax).not.toHaveProperty('taxNumber');
  });
});
