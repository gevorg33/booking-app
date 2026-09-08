import { ConfigService } from '@nestjs/config';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { PublicBookingService } from './public-booking.service.js';

describe('Sprint 37 — public booking consent integration', () => {
  const business = {
    id: 'biz-1',
    settings: {
      privacy: {
        privacyPolicyVersion: '2.5',
        granularConsent: {
          requireAiProcessing: true,
          requireThirdPartyIntegrations: true,
        },
      },
    },
  };

  const businessService = {
    findOne: jest.fn(async () => business),
    findBySlug: jest.fn(),
  };

  const customerService = {
    findOrCreateByContact: jest.fn(async () => ({
      customer: { id: 'cust-1', name: 'Jane' },
      created: true,
    })),
    findOne: jest.fn(),
  };

  const multiServiceBookingsService = new MultiServiceBookingsService(
    { create: jest.fn(), save: jest.fn() } as never,
    { findOne: jest.fn(), save: jest.fn() } as never,
    { find: jest.fn() } as never,
  );

  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };

  const service = new PublicBookingService(
    businessService as never,
    {} as never,
    customerService as never,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes granular consent flags to customer findOrCreateByContact', async () => {
    await service.resolvePublicBookingCustomer('biz-1', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      privacyConsentAccepted: true,
      marketingOptIn: false,
      aiProcessingOptIn: true,
      thirdPartyIntegrationsOptIn: false,
    });

    expect(customerService.findOrCreateByContact).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        privacyConsentAccepted: true,
        marketingOptIn: false,
        aiProcessingOptIn: true,
        thirdPartyIntegrationsOptIn: false,
        registrationSource: 'web_booking',
      }),
      business.settings,
    );
  });

  it('passes business privacy settings for consent version on checkout', async () => {
    await service.resolvePublicBookingCustomer('biz-1', {
      name: 'Alex',
      email: 'alex@example.com',
      privacyConsentAccepted: true,
    });

    expect(businessService.findOne).toHaveBeenCalledWith('biz-1');
    expect(customerService.findOrCreateByContact).toHaveBeenCalledWith(
      'biz-1',
      expect.any(Object),
      expect.objectContaining({
        privacy: expect.objectContaining({
          privacyPolicyVersion: '2.5',
        }),
      }),
    );
  });
});
