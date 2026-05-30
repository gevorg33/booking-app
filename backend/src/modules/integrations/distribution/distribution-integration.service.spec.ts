import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DistributionIntegrationService } from './distribution-integration.service.js';
import type { Business } from '../../business/entities/business.entity.js';
import type { Service } from '../../service/entities/service.entity.js';

describe('DistributionIntegrationService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const serviceRepo = { find: jest.fn() };
  const config = {
    get: jest.fn((key: string) => (key === 'FRONTEND_URL' ? 'https://app.test' : undefined)),
  };

  const service = new DistributionIntegrationService(
    businessRepo as any,
    serviceRepo as any,
    config as unknown as ConfigService,
  );

  const baseBusiness: Business = {
    id: 'biz-1',
    name: 'Test Salon',
    slug: 'test-salon',
    settings: {},
  } as Business;

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.save.mockImplementation(async (b: Business) => b);
    serviceRepo.find.mockResolvedValue([]);
  });

  describe('getPublicSettings', () => {
    it('throws when business not found', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.getPublicSettings('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns defaults for empty distribution settings', async () => {
      businessRepo.findOne.mockResolvedValue(baseBusiness);
      const view = await service.getPublicSettings('biz-1');
      expect(view.googleReserve.enabled).toBe(false);
      expect(view.metaBooking.bookingUrl).toBe('https://app.test/book/test-salon');
      expect(view.metaBooking.bookingButtonLabel).toBe('Book online');
      expect(view.messaging.telegramUrl).toBeNull();
    });

    it('uses localhost frontend url when env unset', async () => {
      const localConfig = { get: jest.fn(() => undefined) };
      const localService = new DistributionIntegrationService(
        businessRepo as any,
        serviceRepo as any,
        localConfig as unknown as ConfigService,
      );
      businessRepo.findOne.mockResolvedValue(baseBusiness);
      const view = await localService.getPublicSettings('biz-1');
      expect(view.metaBooking.bookingUrl).toBe('http://localhost:3000/book/test-salon');
    });

    it('returns configured channels', async () => {
      businessRepo.findOne.mockResolvedValue({
        ...baseBusiness,
        settings: {
          integrations: {
            distribution: {
              googleReserve: { enabled: true, merchantId: 'gm-1' },
              metaBooking: {
                enabled: true,
                facebookPageUrl: 'https://facebook.com/salon',
                instagramUsername: 'salon',
                bookingButtonLabel: 'Reserve',
              },
              messaging: {
                telegramEnabled: true,
                telegramBotUsername: 'bookbot',
                whatsappBookingEnabled: true,
                whatsappBusinessPhone: '15551234567',
              },
            },
          },
        },
      } as Business);

      const view = await service.getPublicSettings('biz-1');
      expect(view.googleReserve.merchantId).toBe('gm-1');
      expect(view.metaBooking.bookingButtonLabel).toBe('Reserve');
      expect(view.messaging.telegramUrl).toContain('t.me/bookbot');
      expect(view.messaging.whatsappUrl).toContain('wa.me/15551234567');
    });
  });

  describe('updateSettings', () => {
    it('persists distribution settings', async () => {
      businessRepo.findOne.mockResolvedValue({ ...baseBusiness, settings: {} });
      const view = await service.updateSettings('biz-1', {
        googleReserveEnabled: true,
        googleMerchantId: ' merchant-99 ',
        metaBookingEnabled: true,
        facebookPageUrl: 'https://facebook.com/page',
        instagramUsername: '@salon',
        metaBookingButtonLabel: ' Book now ',
        telegramEnabled: true,
        telegramBotUsername: '@mybot',
        whatsappBookingEnabled: true,
        whatsappBusinessPhone: '+1-555-999-0000',
        whatsappBookingMessage: 'Hello',
        googlePartnerNotes: 'Partner note',
        facebookPageId: 'fb-123',
      });

      expect(businessRepo.save).toHaveBeenCalled();
      expect(view.googleReserve.enabled).toBe(true);
      expect(view.googleReserve.merchantId).toBe('merchant-99');
      expect(view.metaBooking.instagramUsername).toBe('salon');
      expect(view.metaBooking.bookingButtonLabel).toBe('Book now');
      expect(view.messaging.telegramBotUsername).toBe('mybot');
      expect(view.messaging.whatsappBusinessPhone).toBe('15559990000');
    });

    it('throws when business not found on update', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateSettings('biz-1', { telegramEnabled: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getGoogleReserveFeed', () => {
    it('throws when business not found', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.getGoogleReserveFeed('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('builds feed from active services', async () => {
      businessRepo.findOne.mockResolvedValue({
        ...baseBusiness,
        settings: {
          integrations: { distribution: { googleReserve: { merchantId: 'gm-42' } } },
        },
      });
      serviceRepo.find.mockResolvedValue([
        {
          id: 'svc-1',
          name: 'Cut',
          description: 'Haircut',
          durationMinutes: 30,
          price: 50,
          currency: 'USD',
        },
      ] as Service[]);

      const feed = await service.getGoogleReserveFeed('biz-1');
      expect(feed.businessName).toBe('Test Salon');
      expect(feed.merchantId).toBe('gm-42');
      expect(feed.bookingUrl).toBe('https://app.test/book/test-salon');
      expect(feed.services).toHaveLength(1);
      expect(feed.services[0].bookingUrl).toContain('serviceId=svc-1');
      expect(feed.instructions).toContain('Google Reserve');
    });

    it('builds feed with null service description', async () => {
      businessRepo.findOne.mockResolvedValue(baseBusiness);
      serviceRepo.find.mockResolvedValue([
        {
          id: 'svc-2',
          name: 'Trim',
          description: null,
          durationMinutes: 15,
          price: 25,
          currency: 'USD',
        },
      ] as Service[]);

      const feed = await service.getGoogleReserveFeed('biz-1');
      expect(feed.services[0].description).toBeNull();
    });
  });

  describe('public helpers', () => {
    it('getPublicMetaBooking returns null when disabled', () => {
      expect(service.getPublicMetaBooking(undefined, 'slug')).toBeNull();
      expect(
        service.getPublicMetaBooking(
          { integrations: { distribution: { metaBooking: { enabled: false } } } },
          'slug',
        ),
      ).toBeNull();
    });

    it('getPublicMetaBooking returns booking metadata when enabled', () => {
      const meta = service.getPublicMetaBooking(
        {
          integrations: {
            distribution: {
              metaBooking: {
                enabled: true,
                bookingButtonLabel: 'Book',
                facebookPageUrl: 'https://fb.com/x',
                instagramUsername: 'ig',
              },
            },
          },
        },
        'test-salon',
      );
      expect(meta?.bookingUrl).toBe('https://app.test/book/test-salon');
      expect(meta?.buttonLabel).toBe('Book');
    });

    it('getPublicMessagingLinks returns null when no channels enabled', () => {
      expect(service.getPublicMessagingLinks(baseBusiness)).toBeNull();
    });

    it('getPublicMessagingLinks returns links when telegram enabled', () => {
      const business = {
        ...baseBusiness,
        settings: {
          integrations: {
            distribution: {
              messaging: { telegramEnabled: true, telegramBotUsername: 'bot' },
            },
          },
        },
      } as Business;
      const links = service.getPublicMessagingLinks(business);
      expect(links?.telegramUrl).toContain('t.me/bot');
    });

    it('applies partial updates without touching unspecified fields', async () => {
      businessRepo.findOne.mockResolvedValue({
        ...baseBusiness,
        settings: {
          integrations: {
            distribution: {
              googleReserve: { enabled: false, merchantId: 'keep-me' },
              metaBooking: { enabled: false, bookingButtonLabel: 'Old label' },
            },
          },
        },
      } as Business);

      const view = await service.updateSettings('biz-1', {
        telegramEnabled: true,
        telegramBotUsername: 'bot',
      });

      expect(view.googleReserve.merchantId).toBe('keep-me');
      expect(view.metaBooking.bookingButtonLabel).toBe('Old label');
      expect(view.messaging.telegramUrl).toContain('t.me/bot');
    });

    it('clears optional string fields when empty string submitted', async () => {
      businessRepo.findOne.mockResolvedValue({
        ...baseBusiness,
        settings: {
          integrations: {
            distribution: {
              googleReserve: { partnerNotes: 'old note' },
              metaBooking: { facebookPageId: 'fb-old' },
            },
          },
        },
      } as Business);

      const view = await service.updateSettings('biz-1', {
        googlePartnerNotes: '   ',
        facebookPageId: '',
        whatsappBusinessPhone: 'abc',
      });

      expect(view.googleReserve.partnerNotes).toBeUndefined();
      expect(view.metaBooking.facebookPageId).toBeUndefined();
      expect(view.messaging.whatsappBusinessPhone).toBeUndefined();
    });

    it('returns feed with null merchant id when unset', async () => {
      businessRepo.findOne.mockResolvedValue(baseBusiness);
      const feed = await service.getGoogleReserveFeed('biz-1');
      expect(feed.merchantId).toBeNull();
    });

    it('getPublicMessagingLinks returns links when meta booking enabled', () => {
      const business = {
        ...baseBusiness,
        settings: {
          integrations: {
            distribution: {
              metaBooking: { enabled: true, facebookPageUrl: 'https://fb.com/x' },
            },
          },
        },
      } as Business;
      expect(service.getPublicMessagingLinks(business)?.facebookBookingUrl).toBe('https://fb.com/x');
    });

    it('getPublicMessagingLinks returns links when whatsapp enabled', () => {
      const business = {
        ...baseBusiness,
        settings: {
          integrations: {
            distribution: {
              messaging: {
                whatsappBookingEnabled: true,
                whatsappBusinessPhone: '15550001111',
              },
            },
          },
        },
      } as Business;
      expect(service.getPublicMessagingLinks(business)?.whatsappUrl).toContain('wa.me');
    });

    it('buildMessagingLinks delegates to shared helper', () => {
      const links = service.buildMessagingLinks(baseBusiness);
      expect(links.publicBookingUrl).toBe('https://app.test/book/test-salon');
    });
  });
});
