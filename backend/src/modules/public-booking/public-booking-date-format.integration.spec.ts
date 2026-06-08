import { ConfigService } from '@nestjs/config';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { PublicBookingService } from './public-booking.service.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  readBusinessDateFormatSettings,
} from '../../common/utils/date-format.util.js';
import type { Business } from '../business/entities/business.entity.js';

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
  );
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  ({
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
  }) as Business;

describe('Sprint 34 — public booking date format integration', () => {
  const publicBookingService = buildPublicBookingService();
  const instant = '2026-06-04T13:30:00.000Z';

  it.each([
    {
      settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      formattedDate: '04/06/2026',
      timePattern: /13:30/,
    },
    {
      settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '24h' },
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '24h',
      formattedDate: '06/04/2026',
      timePattern: /13:30/,
    },
    {
      settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      formattedDate: '2026-06-04',
      timePattern: /13:30/,
    },
    {
      settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      formattedDate: '06/04/2026',
      timePattern: /1:30\s*PM/i,
    },
    {
      settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '12h' },
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      formattedDate: '04/06/2026',
      timePattern: /1:30\s*PM/i,
    },
    {
      settings: {},
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      formattedDate: '04/06/2026',
      timePattern: /13:30/,
    },
    {
      settings: { dateFormat: 'invalid', timeFormat: 'invalid' },
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      formattedDate: '04/06/2026',
      timePattern: /13:30/,
    },
  ])(
    'profile + formatting pipeline for $dateFormat / $timeFormat',
    ({ settings, dateFormat, timeFormat, formattedDate, timePattern }) => {
      const profile = publicBookingService.toPublicProfile(
        baseBusiness(settings),
      );
      expect(profile.dateFormat).toBe(dateFormat);
      expect(profile.timeFormat).toBe(timeFormat);

      const displayOpts = readBusinessDateFormatSettings(settings);
      expect(formatDateDisplay('2026-06-04', 'en', displayOpts)).toBe(
        formattedDate,
      );
      expect(formatTimeDisplay(instant, displayOpts)).toMatch(timePattern);
    },
  );

  it('keeps locale formatting when business options are not passed', () => {
    expect(formatDateDisplay('2026-06-04', 'en')).toMatch(/04/);
    expect(formatTimeDisplay('2026-06-04T13:30:00.000Z')).toBe('13:30');
  });
});
