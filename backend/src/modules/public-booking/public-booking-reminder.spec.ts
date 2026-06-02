import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicBookingService } from './public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { Business } from '../business/entities/business.entity.js';

describe('PublicBookingService appointment reminder profile', () => {
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
      notifications: {
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [24, 12, 6, 1],
        defaultCustomerReminderHours: 12,
      },
    },
  } as Business;

  it('exposes appointment reminder options on the public profile when enabled', () => {
    const profile = service.toPublicProfile(baseBusiness);
    expect(profile.appointmentReminders).toEqual({
      enabled: true,
      optionsHours: [24, 12, 6, 1],
      defaultHours: 12,
    });
  });

  it('omits appointment reminder options when customer choice is disabled', () => {
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        ...baseBusiness.settings,
        notifications: { allowCustomerReminderChoice: false },
      },
    } as Business);
    expect(profile.appointmentReminders).toBeUndefined();
  });

  it('builds booking reminder metadata and validates customer selection', () => {
    const resolve = (service as any).resolvePublicBookingReminderMetadata.bind(service);

    expect(
      resolve(baseBusiness, { name: 'Alex', reminderHoursBefore: 6 }),
    ).toEqual({ reminderHoursBefore: 6 });

    expect(
      resolve(baseBusiness, { name: 'Alex', reminderHoursBefore: null }),
    ).toEqual({ reminderHoursBefore: null });

    expect(() => resolve(baseBusiness, { name: 'Alex', reminderHoursBefore: 99 })).toThrow(
      BadRequestException,
    );

    const disabledBusiness = {
      ...baseBusiness,
      settings: {
        ...baseBusiness.settings,
        notifications: { allowCustomerReminderChoice: false },
      },
    } as Business;
    expect(resolve(disabledBusiness, { name: 'Alex', reminderHoursBefore: 6 })).toEqual({});
  });
});
