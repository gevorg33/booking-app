import { ConfigService } from '@nestjs/config';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { encryptSecret } from '../../common/utils/secret.util.js';
import type { Business } from '../business/entities/business.entity.js';

describe('PublicBookingService growth profile fields', () => {
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };

  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({
      enabled: false,
      turnoverBufferMinutes: 5,
    })),
  };

  const scheduleTemplateRepo = {
    find: jest.fn(async () => []),
  };

  const service = createPublicBookingServiceHarness({
    stripeIntegrationService:
      stripeIntegrationService as unknown as StripeIntegrationService,
    configService: config as unknown as ConfigService,
    multiServiceBookingsService: multiServiceBookingsService,
    scheduleTemplateRepo,
  });

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

  it('omits growth fields when integrations disabled', () => {
    const profile = service.toPublicProfile(baseBusiness);
    expect(profile.support).toBeUndefined();
    expect(profile.metaBooking).toBeUndefined();
    expect(profile.messaging).toBeUndefined();
  });

  it('includes zendesk widget, meta booking, and messaging links when enabled', () => {
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        ...baseBusiness.settings,
        integrations: {
          zendesk: {
            enabled: true,
            widgetKey: 'widget-abc',
            widgetEnabledOnPublicBooking: true,
            apiTokenEnc: encryptSecret('token', 'key'),
            subdomain: 'salon',
          },
          distribution: {
            metaBooking: {
              enabled: true,
              bookingButtonLabel: 'Reserve',
              facebookPageUrl: 'https://facebook.com/salon',
              instagramUsername: 'salon',
            },
            messaging: {
              telegramEnabled: true,
              telegramBotUsername: 'bookbot',
            },
          },
        },
      },
    });

    expect(profile.support?.zendeskWidgetKey).toBe('widget-abc');
    expect(profile.metaBooking).toEqual({
      bookingUrl: 'https://app.test/book/salon',
      buttonLabel: 'Reserve',
      facebookPageUrl: 'https://facebook.com/salon',
      instagramUsername: 'salon',
    });
    expect(profile.messaging?.telegramUrl).toBe(
      'https://t.me/bookbot?start=book_salon',
    );
  });

  it('omits zendesk widget when public booking widget disabled', () => {
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        integrations: {
          zendesk: {
            enabled: true,
            widgetKey: 'widget-abc',
            widgetEnabledOnPublicBooking: false,
          },
        },
      },
    });
    expect(profile.support).toBeUndefined();
  });

  it('strips XSS mapEmbedHtml on toPublicProfile (e2e-bug.49)', () => {
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        ...baseBusiness.settings,
        location: {
          mapEmbedHtml:
            '<iframe src="https://www.google.com/maps/embed?pb=x" onload="alert(1)"></iframe>',
        },
      },
    });
    expect(profile.location?.mapEmbedHtml).toBeUndefined();
  });

  it('keeps sanitized Google Maps embed on toPublicProfile (e2e-bug.49)', () => {
    const safe =
      '<iframe src="https://www.google.com/maps/embed?pb=x" width="600" height="450"></iframe>';
    const profile = service.toPublicProfile({
      ...baseBusiness,
      settings: {
        ...baseBusiness.settings,
        location: { mapEmbedHtml: safe },
      },
    });
    expect(profile.location?.mapEmbedHtml).toBe(safe);
  });

  it('exposes openingHours from schedule templates on getProfile (e2e-bug.50)', async () => {
    const hoursService = createPublicBookingServiceHarness({
      stripeIntegrationService:
        stripeIntegrationService as unknown as StripeIntegrationService,
      configService: config as unknown as ConfigService,
      multiServiceBookingsService,
      businessService: {
        findBySlug: jest.fn(async () => baseBusiness),
      },
      scheduleTemplateRepo: {
        find: jest.fn(async () => [
          {
            isActive: true,
            isDeleted: false,
            periods: [
              {
                type: 'service_block',
                startTime: '09:00',
                endTime: '19:00',
                isActiveOnMonday: true,
                isActiveOnTuesday: true,
                isActiveOnWednesday: true,
                isActiveOnThursday: true,
                isActiveOnFriday: true,
              },
              {
                type: 'service_block',
                startTime: '10:00',
                endTime: '17:00',
                isActiveOnSaturday: true,
              },
            ],
          },
        ]),
      },
    });

    const profile = await hoursService.getProfile('salon');
    expect(profile.openingHours?.summaryLines).toEqual([
      'Mon–Fri 09:00–19:00',
      'Sat 10:00–17:00',
      'Sun Closed',
    ]);
  });
});
