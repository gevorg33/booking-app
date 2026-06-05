import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerService } from '../customer/customer.service.js';
import { NotificationsService } from './notifications.service.js';
import { MarketingCustomerRegistrationListener } from './marketing-customer-registration.listener.js';
import { CUSTOMER_REGISTERED_EVENT } from './customer-registration.types.js';
import { mergeBusinessNotificationSettings } from './notification.types.js';
import { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import { AccountingExportService } from '../integrations/accounting/accounting-export.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

/**
 * Sprint 12.b — marketing alerts & subscription accounting (integration).
 */
describe('Sprint 12.b launch integration', () => {
  describe('customer.registered → marketing email', () => {
    const business = {
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: mergeBusinessNotificationSettings({
          emailEnabled: true,
          emailOnNewCustomerRegistration: true,
          marketingTeamEmails: ['growth@test.com', 'ops@test.com'],
        }),
      },
    };

    const customer = {
      id: 'cust-new',
      businessId: 'biz-1',
      isActive: true,
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: null,
    };

    const businessRepo = {
      findOne: jest.fn(async () => business),
      save: jest.fn(async (b: typeof business) => b),
    };
    const customerRepo = {
      findOne: jest.fn(async (opts: { where: { id: string } }) =>
        opts.where.id === customer.id ? customer : null,
      ),
      save: jest.fn(async (c: Record<string, unknown>) => ({
        id: 'cust-new',
        ...c,
      })),
      create: jest.fn((c: Record<string, unknown>) => c),
    };
    const bookingRepo = { find: jest.fn(), findOne: jest.fn() };
    const logRepo = { findOne: jest.fn(), save: jest.fn() };
    const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };

    const notificationsService = new NotificationsService(
      bookingRepo as any,
      businessRepo as any,
      customerRepo as any,
      logRepo as any,
      emailService as any,
      { send: jest.fn() } as any,
      { send: jest.fn() } as any,
      { resolveRuntimeConfig: jest.fn() } as any,
      {
        get: jest.fn((key: string) =>
          key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
        ),
      } as any,
    );

    const listener = new MarketingCustomerRegistrationListener(
      notificationsService,
    );
    const eventEmitter = new EventEmitter2();
    eventEmitter.on(CUSTOMER_REGISTERED_EVENT, (payload) =>
      listener.handleCustomerRegistered(payload),
    );

    const customerService = new CustomerService(
      customerRepo as any,
      bookingRepo as any,
      eventEmitter,
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('emits customer.registered on dashboard create and emails marketing team', async () => {
      await customerService.create('biz-1', {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        registrationSource: 'dashboard',
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(emailService.send).toHaveBeenCalledTimes(2);
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'growth@test.com',
          subject: expect.stringContaining('Alex Rivera'),
          text: expect.stringContaining('https://app.test/dashboard/customers'),
        }),
      );
    });

    it('persists marketing settings via updateBusinessSettings', async () => {
      const updated = await notificationsService.updateBusinessSettings(
        'biz-1',
        {
          emailOnNewCustomerRegistration: true,
          marketingTeamEmails: ['only@test.com'],
        },
      );
      expect(updated.marketingTeamEmails).toEqual(['only@test.com']);
      expect(updated.emailOnNewCustomerRegistration).toBe(true);
    });
  });

  describe('accounting export with subscription income', () => {
    const exportService = new AccountingExportService();
    const businessRepo = { findOne: jest.fn(), save: jest.fn() };
    const bookingRepo = { find: jest.fn() };
    const expenseRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };
    const commissionRepo = { find: jest.fn().mockResolvedValue([]) };
    const customerSubscriptionRepo = { find: jest.fn() };

    const accountingService = new AccountingIntegrationService(
      businessRepo as any,
      bookingRepo as any,
      expenseRepo as any,
      commissionRepo as any,
      customerSubscriptionRepo as any,
      exportService,
    );

    beforeEach(() => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          integrations: {
            accounting: {
              enabled: true,
              provider: 'csv',
              includeExpenses: false,
              includeCommissions: false,
            },
          },
        },
      });
      bookingRepo.find.mockResolvedValue([
        {
          id: 'book-1',
          startTime: new Date('2026-06-10T14:00:00Z'),
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          service: { name: 'Haircut', price: 45, currency: 'USD' },
          customer: { name: 'Jane' },
          employee: { name: 'Sam' },
        },
      ]);
      customerSubscriptionRepo.find.mockResolvedValue([
        {
          id: 'sub-1',
          createdAt: new Date('2026-06-05T10:00:00Z'),
          pricePaid: 180,
          currency: 'USD',
          plan: { name: '6 visits / 6 months' },
          customer: { name: 'Jane' },
        },
        {
          id: 'sub-zero',
          createdAt: new Date('2026-06-06T10:00:00Z'),
          pricePaid: 0,
          currency: 'USD',
          plan: null,
          customer: { name: 'Free' },
        },
      ]);
    });

    it('exports service and subscription income rows sorted by date', async () => {
      const result = await accountingService.generateExport(
        'biz-1',
        '2026-06-01',
        '2026-06-30',
      );

      expect(result.format).toBe('csv');
      expect(result.rowCount).toBe(2);
      expect(result.content).toContain('IncomeSubType');
      expect(result.content).toContain('subscription');
      expect(result.content).toContain('6 visits / 6 months');
      expect(result.content).toContain('service');
      expect(result.content).toContain('Haircut');
      const dataLines = result.content.split('\n').slice(1);
      expect(dataLines[0]).toContain('2026-06-05');
      expect(dataLines[1]).toContain('2026-06-10');
    });

    it('includes subscription label in QuickBooks export', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          integrations: {
            accounting: { enabled: true, provider: 'quickbooks' },
          },
        },
      });
      const result = await accountingService.generateExport(
        'biz-1',
        '2026-06-01',
        '2026-06-30',
      );
      expect(result.content).toContain('[subscription]');
    });
  });
});
