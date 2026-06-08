import { CatalogAnnouncementService } from './catalog-announcement.service.js';

describe('CatalogAnnouncementService (catalog-notify-1.7)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    settings: {
      enabledLocales: ['en'],
      defaultLocale: 'en',
      currency: 'USD',
      notifications: { emailEnabled: true },
    },
  };

  const customers = [
    {
      id: 'cust-1',
      businessId: 'biz-1',
      name: 'Anna',
      email: 'anna@example.com',
      isActive: true,
      metadata: {
        preferredLocale: 'en',
        gdpr: { marketingOptIn: true },
        notifications: { pushNews: true },
      },
    },
    {
      id: 'cust-2',
      businessId: 'biz-1',
      name: 'Bob',
      email: 'bob@example.com',
      isActive: true,
      metadata: {
        gdpr: { marketingOptIn: false },
        notifications: { pushNews: true },
      },
    },
  ];

  const businessRepo = {
    findOne: jest.fn().mockResolvedValue(business),
  };
  const customerRepo = {
    find: jest.fn().mockResolvedValue(customers),
  };
  const logRepo = {
    create: jest.fn((entry) => entry),
    save: jest.fn(async (entry) => entry),
  };
  const emailService = {
    send: jest.fn().mockResolvedValue({ ok: true }),
  };
  const consumerPushDispatch = {
    sendTransactionalPush: jest.fn().mockResolvedValue({ ok: true, sentCount: 1 }),
  };
  const configService = {
    get: jest.fn().mockReturnValue('https://book.example'),
  };

  const service = new CatalogAnnouncementService(
    businessRepo as any,
    customerRepo as any,
    logRepo as any,
    emailService as any,
    consumerPushDispatch as any,
    configService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = {
      enabledLocales: ['en'],
      defaultLocale: 'en',
      currency: 'USD',
      notifications: { emailEnabled: true },
    };
    customerRepo.find.mockResolvedValue(customers);
  });

  it('sends email and push to opted-in customers only', async () => {
    const summary = await service.announcePackage(
      'biz-1',
      {
        id: 'pkg-1',
        name: 'Glow package',
        discountType: 'percent',
        discountValue: 15,
      } as any,
      {
        notifyCustomers: true,
        notificationTemplate: {
          en: {
            subject: 'New package: {{packageName}}',
            bodyText: 'Hi {{customerName}} — {{discount}} at {{businessName}}',
          },
        },
      },
    );

    expect(summary.emailed).toBe(1);
    expect(summary.pushed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'anna@example.com',
        subject: 'New package: Glow package',
      }),
    );
    expect(consumerPushDispatch.sendTransactionalPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pushType: 'catalog_announcement',
        customerId: 'cust-1',
      }),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'catalog_announcement' }),
    );
  });

  it('announces subscription plans with plan variables', async () => {
    await service.announceSubscriptionPlan(
      'biz-1',
      {
        id: 'plan-1',
        name: 'Nail club',
        discountType: 'fixed',
        discountValue: 20,
      } as any,
      {
        notifyCustomers: true,
        notificationTemplate: {
          en: {
            subject: '{{planName}}',
            bodyText: '{{customerName}} saves {{discount}}',
          },
        },
      },
    );

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Nail club' }),
    );
  });

  it('counts failed delivery when email and push fail', async () => {
    emailService.send.mockResolvedValueOnce({ ok: false, error: 'smtp down' });
    consumerPushDispatch.sendTransactionalPush.mockResolvedValueOnce({
      ok: false,
      reason: 'no tokens',
    });

    const summary = await service.announcePackage(
      'biz-1',
      {
        id: 'pkg-1',
        name: 'Glow package',
        discountType: 'percent',
        discountValue: 15,
      } as any,
      {
        notifyCustomers: true,
        notificationTemplate: {
          en: { subject: 'Hi', bodyText: 'Body' },
        },
      },
    );

    expect(summary.failed).toBe(2);
  });

  it('skips customers when no template exists for their locale', async () => {
    business.settings = {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      currency: 'USD',
      notifications: { emailEnabled: true },
    };
    customerRepo.find.mockResolvedValueOnce([
      {
        id: 'cust-hy',
        businessId: 'biz-1',
        name: 'Nune',
        email: 'nune@example.com',
        isActive: true,
        metadata: {
          preferredLocale: 'hy',
          gdpr: { marketingOptIn: true },
          notifications: { pushNews: true },
        },
      },
    ]);

    const summary = await service.announcePackage(
      'biz-1',
      {
        id: 'pkg-1',
        name: 'Glow package',
        discountType: 'percent',
        discountValue: 15,
      } as any,
      {
        notifyCustomers: true,
        notificationTemplate: {
          en: { subject: 'Hi', bodyText: 'Body' },
        },
      },
    );

    expect(summary.skipped).toBe(1);
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      service.announcePackage(
        'missing-biz',
        { id: 'pkg-1', name: 'Glow', discountType: 'percent', discountValue: 10 } as any,
        {
          notifyCustomers: true,
          notificationTemplate: {
            en: { subject: 'Hi', bodyText: 'Body' },
          },
        },
      ),
    ).rejects.toThrow('Business missing-biz not found');
  });
});
