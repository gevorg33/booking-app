import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZendeskIntegrationService } from './zendesk-integration.service.js';
import { ZendeskApiClient } from './zendesk-api.client.js';
import { encryptSecret } from '../../../common/utils/secret.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import type { Customer } from '../../customer/entities/customer.entity.js';
import type { Booking } from '../../booking/entities/booking.entity.js';

const ENCRYPTION_KEY = 'test-zendesk-key';

describe('ZendeskIntegrationService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const bookingRepo = { findOne: jest.fn(), count: jest.fn() };
  const employeeRepo = { findOne: jest.fn() };
  const api = {
    verifyCredentials: jest.fn(),
    createTicket: jest.fn(),
    upsertUser: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'INTEGRATIONS_ENCRYPTION_KEY') return ENCRYPTION_KEY;
      if (key === 'FRONTEND_URL') return 'https://app.test';
      return undefined;
    }),
  };

  const service = new ZendeskIntegrationService(
    businessRepo as any,
    customerRepo as any,
    bookingRepo as any,
    employeeRepo as any,
    config as unknown as ConfigService,
    api as unknown as ZendeskApiClient,
  );

  const baseBusiness: Business = {
    id: 'biz-1',
    name: 'Test Salon',
    slug: 'test-salon',
    settings: {},
  } as Business;

  function businessWithZendesk(overrides: Record<string, unknown> = {}) {
    return {
      ...baseBusiness,
      settings: {
        integrations: {
          zendesk: {
            enabled: true,
            subdomain: 'testsalon',
            apiTokenEnc: encryptSecret('zendesk-token', ENCRYPTION_KEY),
            widgetKey: 'widget-key-123',
            widgetEnabledOnDashboard: true,
            widgetEnabledOnPublicBooking: true,
            syncCustomersEnabled: true,
            ...overrides,
          },
        },
      },
    } as Business;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.save.mockImplementation(async (b: Business) => b);
    api.verifyCredentials.mockResolvedValue(true);
    api.createTicket.mockResolvedValue({
      ticketId: 99,
      url: 'https://testsalon.zendesk.com/agent/tickets/99',
    });
    api.upsertUser.mockResolvedValue({
      userId: 5,
      url: 'https://testsalon.zendesk.com/agent/users/5',
      created: false,
    });
  });

  describe('getPublicSettings', () => {
    it('throws when business not found', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.getPublicSettings('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns unconfigured view when zendesk not set up', async () => {
      businessRepo.findOne.mockResolvedValue(baseBusiness);
      const view = await service.getPublicSettings('biz-1');
      expect(view.configured).toBe(false);
      expect(view.enabled).toBe(false);
      expect(view.hasApiToken).toBe(false);
    });

    it('returns configured view with masked token hint', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      const view = await service.getPublicSettings('biz-1');
      expect(view.configured).toBe(true);
      expect(view.enabled).toBe(true);
      expect(view.hasApiToken).toBe(true);
      expect(view.apiTokenHint).toMatch(/••••/);
      expect(view.widgetKey).toBe('widget-key-123');
    });

    it('omits token hint when decryption fails', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ apiTokenEnc: 'corrupt-token' }),
      );
      const view = await service.getPublicSettings('biz-1');
      expect(view.hasApiToken).toBe(true);
      expect(view.configured).toBe(false);
      expect(view.apiTokenHint).toBeUndefined();
    });

    it('defaults widgetEnabledOnDashboard to true in public view', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ widgetEnabledOnDashboard: undefined }),
      );
      const view = await service.getPublicSettings('biz-1');
      expect(view.widgetEnabledOnDashboard).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('clears credentials when clearCredentials is true', async () => {
      const business = businessWithZendesk();
      businessRepo.findOne.mockResolvedValue(business);
      const view = await service.updateSettings('biz-1', { clearCredentials: true });
      expect(businessRepo.save).toHaveBeenCalled();
      expect(view.configured).toBe(false);
    });

    it('saves settings and verifies credentials when enabling', async () => {
      businessRepo.findOne.mockResolvedValue({ ...baseBusiness, settings: {} });
      const view = await service.updateSettings('biz-1', {
        enabled: true,
        subdomain: 'NewSub',
        apiToken: 'fresh-token',
        widgetKey: 'wk',
        syncCustomersEnabled: true,
      });
      expect(api.verifyCredentials).toHaveBeenCalledWith({
        subdomain: 'newsub',
        apiToken: 'fresh-token',
      });
      expect(view.configured).toBe(true);
      expect(view.subdomain).toBe('newsub');
    });

    it('rejects invalid credentials on enable', async () => {
      businessRepo.findOne.mockResolvedValue({ ...baseBusiness, settings: {} });
      api.verifyCredentials.mockResolvedValue(false);
      await expect(
        service.updateSettings('biz-1', {
          enabled: true,
          subdomain: 'bad',
          apiToken: 'bad-token',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates widget flags and verifies when fully configured', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      const view = await service.updateSettings('biz-1', {
        widgetEnabledOnPublicBooking: false,
        defaultAssigneeEmail: 'agent@test.com',
      });
      expect(api.verifyCredentials).toHaveBeenCalled();
      expect(view.widgetEnabledOnPublicBooking).toBe(false);
      expect(view.defaultAssigneeEmail).toBe('agent@test.com');
    });

    it('throws when stored credentials cannot be decrypted on enable', async () => {
      businessRepo.findOne.mockResolvedValue({
        ...baseBusiness,
        settings: {
          integrations: {
            zendesk: {
              enabled: true,
              subdomain: 'bad',
              apiTokenEnc: 'not-valid-encrypted',
            },
          },
        },
      });
      await expect(
        service.updateSettings('biz-1', { widgetKey: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('skips credential verification when integration disabled', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ enabled: false }));
      await service.updateSettings('biz-1', { widgetKey: 'only-widget' });
      expect(api.verifyCredentials).not.toHaveBeenCalled();
    });

    it('throws when business not found on update', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.updateSettings('missing', { enabled: false })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('clears widget key when empty string provided', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ enabled: false }));
      const view = await service.updateSettings('biz-1', { widgetKey: '   ' });
      expect(view.widgetKey).toBeUndefined();
    });

    it('updates dashboard widget flag explicitly', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ enabled: false }));
      const view = await service.updateSettings('biz-1', { widgetEnabledOnDashboard: false });
      expect(view.widgetEnabledOnDashboard).toBe(false);
    });
  });

  describe('widget helpers', () => {
    it('getPublicWidgetConfig requires enabled widget on at least one surface', () => {
      expect(service.getPublicWidgetConfig(undefined)).toBeNull();
      expect(
        service.getPublicWidgetConfig({
          integrations: {
            zendesk: { enabled: true, widgetKey: 'k', widgetEnabledOnDashboard: false, widgetEnabledOnPublicBooking: false },
          },
        }),
      ).toBeNull();
      expect(
        service.getPublicWidgetConfig({
          integrations: { zendesk: { enabled: true, widgetKey: 'k', widgetEnabledOnPublicBooking: true } },
        }),
      ).toEqual({ widgetKey: 'k' });
    });

    it('getDashboardWidgetKey respects dashboard flag', () => {
      const settings = {
        integrations: {
          zendesk: {
            enabled: true,
            widgetKey: 'dash-key',
            widgetEnabledOnDashboard: false,
          },
        },
      };
      expect(service.getDashboardWidgetKey(settings)).toBeNull();
      expect(
        service.getDashboardWidgetKey({
          integrations: { zendesk: { enabled: true, widgetKey: 'dash-key' } },
        }),
      ).toBe('dash-key');
    });

    it('getPublicWidgetKey requires public booking flag', () => {
      const settings = {
        integrations: {
          zendesk: { enabled: true, widgetKey: 'pub', widgetEnabledOnPublicBooking: false },
        },
      };
      expect(service.getPublicWidgetKey(settings)).toBeNull();
      expect(
        service.getPublicWidgetKey({
          integrations: {
            zendesk: { enabled: true, widgetKey: 'pub', widgetEnabledOnPublicBooking: true },
          },
        }),
      ).toBe('pub');
    });
  });

  describe('createSupportTicket', () => {
    it('throws when zendesk not configured', async () => {
      businessRepo.findOne.mockResolvedValue(baseBusiness);
      await expect(
        service.createSupportTicket('biz-1', { subject: 'Hi', body: 'Help' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when requester email missing', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      await expect(
        service.createSupportTicket('biz-1', { subject: 'Hi', body: 'Help' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates ticket with customer and booking context', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      const customer = {
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+1555',
        tags: ['vip'],
      } as Customer;
      const booking = {
        id: 'book-1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        service: { name: 'Haircut' },
        employee: { name: 'Alex' },
        customer,
      } as Booking;

      customerRepo.findOne.mockResolvedValue(customer);
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.count.mockResolvedValue(3);

      const result = await service.createSupportTicket(
        'biz-1',
        {
          subject: 'Issue',
          body: 'Details',
          customerId: 'cust-1',
          bookingId: 'book-1',
        },
        'owner@test.com',
        'Owner',
      );

      expect(api.upsertUser).toHaveBeenCalled();
      expect(api.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ subdomain: 'testsalon' }),
        expect.objectContaining({
          subject: 'Issue',
          requesterEmail: 'jane@example.com',
          customFields: expect.objectContaining({
            'Customer ID': 'cust-1',
            'Booking ID': 'book-1',
          }),
        }),
      );
      expect(result.ticketId).toBe(99);
      expect(result.requesterEmail).toBe('jane@example.com');
    });

    it('creates ticket without syncing customer when sync disabled', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ syncCustomersEnabled: false }));
      customerRepo.findOne.mockResolvedValue({
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
      } as Customer);

      await service.createSupportTicket(
        'biz-1',
        { subject: 'Issue', body: 'Details', customerId: 'cust-1' },
        'owner@test.com',
      );

      expect(api.upsertUser).not.toHaveBeenCalled();
      expect(api.createTicket).toHaveBeenCalled();
    });

    it('throws when business missing for ticket creation', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createSupportTicket(
          'biz-1',
          { subject: 'Hi', body: 'Help', requesterEmail: 'a@b.com' },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falls back to actor email when no customer or booking email', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ syncCustomersEnabled: false }));
      const result = await service.createSupportTicket(
        'biz-1',
        { subject: 'Issue', body: 'Details' },
        'owner@test.com',
        'Owner Name',
      );
      expect(result.requesterEmail).toBe('owner@test.com');
      expect(api.createTicket).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ requesterEmail: 'owner@test.com', requesterName: 'Owner Name' }),
      );
    });

    it('uses booking customer email when dto email omitted', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ syncCustomersEnabled: false }));
      bookingRepo.findOne.mockResolvedValue({
        id: 'book-1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        service: { name: 'Cut' },
        employee: { name: 'Sam' },
        customer: { name: 'Pat', email: 'pat@example.com' },
      } as Booking);

      const result = await service.createSupportTicket('biz-1', {
        subject: 'Issue',
        body: 'Details',
        bookingId: 'book-1',
      });

      expect(result.requesterEmail).toBe('pat@example.com');
    });
  });

  describe('syncCustomerIfEnabled', () => {
    it('returns null when business missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      expect(await service.syncCustomerIfEnabled('biz-1', 'cust-1')).toBeNull();
    });

    it('returns null when zendesk disabled', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk({ enabled: false }));
      expect(await service.syncCustomerIfEnabled('biz-1', 'cust-1')).toBeNull();
    });

    it('returns null when sync disabled', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ syncCustomersEnabled: false }),
      );
      const result = await service.syncCustomerIfEnabled('biz-1', 'cust-1');
      expect(result).toBeNull();
    });

    it('returns null when customer has no email', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      customerRepo.findOne.mockResolvedValue({ id: 'cust-1', name: 'No Email' });
      const result = await service.syncCustomerIfEnabled('biz-1', 'cust-1');
      expect(result).toBeNull();
    });

    it('upserts zendesk user when sync enabled', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      customerRepo.findOne.mockResolvedValue({
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+1555',
        tags: [],
      });
      bookingRepo.count.mockResolvedValue(2);

      const result = await service.syncCustomerIfEnabled('biz-1', 'cust-1');
      expect(api.upsertUser).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'jane@example.com',
          externalId: 'cust-1',
          notes: expect.stringContaining('Appointments: 2'),
        }),
      );
      expect(result?.userId).toBe(5);
    });

    it('includes customer tags in zendesk notes', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      customerRepo.findOne.mockResolvedValue({
        id: 'cust-2',
        name: 'VIP',
        email: 'vip@example.com',
        tags: ['vip', 'regular'],
      });
      bookingRepo.count.mockResolvedValue(0);

      await service.syncCustomerIfEnabled('biz-1', 'cust-2');

      expect(api.upsertUser).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          notes: expect.stringContaining('Tags: vip, regular'),
        }),
      );
    });

    it('returns null when runtime config missing', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ apiTokenEnc: undefined, subdomain: 'x' }),
      );
      expect(await service.syncCustomerIfEnabled('biz-1', 'cust-1')).toBeNull();
    });
  });

  describe('createTicketFromReviewIfEnabled', () => {
    it('returns null when createTicketOnReview is disabled', async () => {
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      expect(
        await service.createTicketFromReviewIfEnabled('biz-1', { rating: 5, reviewId: 'rev-1' }),
      ).toBeNull();
    });

    it('returns null when rating exceeds max threshold', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ createTicketOnReview: true, reviewTicketMaxRating: 3 }),
      );
      expect(
        await service.createTicketFromReviewIfEnabled('biz-1', {
          rating: 5,
          reviewId: 'rev-1',
          customerName: 'Jane',
        }),
      ).toBeNull();
    });

    it('creates review ticket via createSupportTicket', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ createTicketOnReview: true }),
      );
      employeeRepo.findOne.mockResolvedValue({ id: 'emp-1', name: 'Alex' });
      customerRepo.findOne.mockResolvedValue({
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
      });
      api.createTicket.mockResolvedValue({
        ticketId: 77,
        url: 'https://testsalon.zendesk.com/agent/tickets/77',
      });

      const result = await service.createTicketFromReviewIfEnabled('biz-1', {
        reviewId: 'rev-1',
        rating: 2,
        comment: 'Long wait',
        customerName: 'Jane',
        employeeId: 'emp-1',
        customerId: 'cust-1',
        bookingId: 'book-1',
      });

      expect(result?.ticketId).toBe(77);
      expect(api.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ subdomain: 'testsalon' }),
        expect.objectContaining({
          subject: 'New review — 2★ from Jane',
          requesterEmail: 'jane@example.com',
          tags: expect.arrayContaining(['optischedule', 'review', 'low-rating']),
          body: expect.stringContaining('Provider: Alex'),
        }),
      );
    });

    it('uses noreply fallback email when customer has no email', async () => {
      businessRepo.findOne.mockResolvedValue(
        businessWithZendesk({ createTicketOnReview: true }),
      );
      employeeRepo.findOne.mockResolvedValue(null);
      customerRepo.findOne.mockResolvedValue({ id: 'cust-1', name: 'Guest' });
      bookingRepo.findOne.mockResolvedValue(null);
      api.createTicket.mockResolvedValue({ ticketId: 88, url: 'https://x.zendesk.com/t/88' });

      await service.createTicketFromReviewIfEnabled('biz-1', {
        reviewId: 'rev-2',
        rating: 4,
        customerId: 'cust-1',
        customerName: 'Guest',
      });

      expect(api.createTicket).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          requesterEmail: 'reviews+biz-1@noreply.optischedule.app',
          tags: expect.not.arrayContaining(['low-rating']),
        }),
      );
    });
  });

  describe('encryption key fallback', () => {
    it('uses JWT_SECRET when INTEGRATIONS_ENCRYPTION_KEY missing', async () => {
      const fallbackConfig = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_SECRET') return ENCRYPTION_KEY;
          if (key === 'FRONTEND_URL') return 'https://app.test';
          return undefined;
        }),
      };
      const fallbackService = new ZendeskIntegrationService(
        businessRepo as any,
        customerRepo as any,
        bookingRepo as any,
        employeeRepo as any,
        fallbackConfig as unknown as ConfigService,
        api as unknown as ZendeskApiClient,
      );
      businessRepo.findOne.mockResolvedValue(businessWithZendesk());
      const view = await fallbackService.getPublicSettings('biz-1');
      expect(view.configured).toBe(true);
    });
  });
});
