import { ConfigService } from '@nestjs/config';
import { PublicBookingService } from './public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { encryptSecret } from '../../common/utils/secret.util.js';
import type { Business } from '../business/entities/business.entity.js';

describe('PublicBookingService growth profile fields', () => {
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
  const config = {
    get: jest.fn((key: string) => (key === 'FRONTEND_URL' ? 'https://app.test' : undefined)),
  };

  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({
      enabled: false,
      turnoverBufferMinutes: 5,
    })),
  };

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
    multiServiceBookingsService as any,
    {} as any,
    config as unknown as ConfigService,
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
    expect(profile.messaging?.telegramUrl).toBe('https://t.me/bookbot?start=book_salon');
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
});
