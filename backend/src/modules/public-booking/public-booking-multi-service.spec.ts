import { ConfigService } from '@nestjs/config';
import { PublicBookingService } from './public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { Business } from '../business/entities/business.entity.js';

describe('PublicBookingService multi-service profile', () => {
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
  const config = {
    get: jest.fn((key: string) => (key === 'FRONTEND_URL' ? 'https://app.test' : undefined)),
  };
  const multiServiceBookingsService = new MultiServiceBookingsService(
    { create: jest.fn(), save: jest.fn() } as any,
    { findOne: jest.fn(), save: jest.fn() } as any,
    { find: jest.fn() } as any,
  );

  const service = new PublicBookingService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    stripeIntegrationService as unknown as StripeIntegrationService,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    multiServiceBookingsService,
    {} as any,
    config as unknown as ConfigService,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  const baseBusiness: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'America/New_York',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
    },
  } as Business;

  it('omits multiService when feature is disabled', () => {
    const profile = service.toPublicProfile(baseBusiness);
    expect(profile.multiService).toBeUndefined();
  });

  it('exposes incompatible pair settings when multi-service is enabled', () => {
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        ...baseBusiness.settings,
        publicBooking: {
          enabled: true,
          multiService: {
            enabled: true,
            maxServiceCount: 4,
            maxDurationMinutes: 240,
            turnoverBufferMinutes: 8,
            schedulingMode: 'per_service',
            incompatiblePairMode: 'category',
            incompatiblePairs: [['svc-a', 'svc-b']],
            incompatibleCategoryPairs: [['cat-hair', 'cat-spa']],
          },
        },
      },
    });

    expect(profile.multiService).toEqual({
      enabled: true,
      maxServiceCount: 4,
      maxDurationMinutes: 240,
      turnoverBufferMinutes: 8,
      schedulingMode: 'per_service',
      incompatiblePairMode: 'category',
      incompatiblePairs: [['svc-a', 'svc-b']],
      incompatibleCategoryPairs: [['cat-hair', 'cat-spa']],
    });
  });

  it('defaults incompatible pair mode to service when not configured', () => {
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        publicBooking: {
          multiService: {
            enabled: true,
            incompatiblePairs: [['x', 'y']],
          },
        },
      },
    });

    expect(profile.multiService?.incompatiblePairMode).toBe('service');
    expect(profile.multiService?.incompatiblePairs).toEqual([['x', 'y']]);
    expect(profile.multiService?.incompatibleCategoryPairs).toEqual([]);
  });
});
