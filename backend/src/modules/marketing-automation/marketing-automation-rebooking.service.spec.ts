import { MarketingAutomationService } from './marketing-automation.service.js';
import { DEFAULT_MARKETING_AUTOMATION_SETTINGS } from './marketing-automation.types.js';

describe('MarketingAutomationService rebooking nudges (adopt-4.4)', () => {
  const businessRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const customerRepo = { find: jest.fn() };
  const bookingRepo = {
    createQueryBuilder: jest.fn(),
    exists: jest.fn(),
    findOne: jest.fn(),
  };
  const logRepo = {
    count: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const appEventRepo = { find: jest.fn().mockResolvedValue([]) };
  const serviceRepo = { findOne: jest.fn().mockResolvedValue(null) };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const smsService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };
  const consumerPushDispatch = {
    sendTransactionalPush: jest.fn().mockResolvedValue({ ok: true, sentCount: 1 }),
  };
  const loyaltyService = {
    adjust: jest.fn().mockResolvedValue({ pointsBalance: 0 }),
  };
  const customerRebookingCadenceService = {
    computeLearnedCadenceDays: jest.fn().mockResolvedValue(null),
  };

  const service = new MarketingAutomationService(
    businessRepo as any,
    customerRepo as any,
    bookingRepo as any,
    logRepo as any,
    appEventRepo as any,
    serviceRepo as any,
    emailService as any,
    smsService as any,
    configService as any,
    consumerPushDispatch as any,
    loyaltyService as any,
    customerRebookingCadenceService as any,
  );

  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    settings: {
      locale: 'en',
      marketingAutomation: {
        rebookingNudgeEnabled: true,
        defaultRebookingCadenceDays: 28,
        rebookingNudgeEmailEnabled: true,
        rebookingNudgePushEnabled: true,
      },
      notifications: { emailEnabled: true, smsEnabled: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    logRepo.create.mockImplementation((value) => value);
    logRepo.save.mockResolvedValue(undefined);
    logRepo.findOne.mockResolvedValue(null);
    bookingRepo.exists.mockResolvedValue(false);
    bookingRepo.findOne.mockResolvedValue(null);
    customerRebookingCadenceService.computeLearnedCadenceDays.mockResolvedValue(null);
    configService.get.mockReturnValue('http://localhost:3000');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('finds customers due for a service cadence rebooking nudge', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 28);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: '+15551234567',
          customerMetadata: {
            gdpr: { marketingOptIn: true },
            notifications: { pushReminders: true },
          },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });

    const candidates = await service.findRebookingNudgeCandidates('biz-1', {
      ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
      rebookingNudgeEnabled: true,
      defaultRebookingCadenceDays: 28,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      customerId: 'cust-1',
      serviceId: 'svc-1',
      serviceName: 'Haircut',
      cadenceDays: 28,
    });
  });

  it('uses persisted learned cadence from customer metadata without recomputing', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 21);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: {
            gdpr: { marketingOptIn: true },
            learnedRebookingCadenceByService: { 'svc-1': 21 },
          },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-last',
      startTime: new Date('2026-05-01T14:00:00.000Z'),
      employeeId: 'emp-1',
    });

    const candidates = await service.findRebookingNudgeCandidates('biz-1', {
      ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
      rebookingNudgeEnabled: true,
      defaultRebookingCadenceDays: 28,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.cadenceDays).toBe(21);
    expect(
      customerRebookingCadenceService.computeLearnedCadenceDays,
    ).not.toHaveBeenCalled();
  });

  it('uses learned customer cadence instead of service default when history exists', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 21);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: { gdpr: { marketingOptIn: true } },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });
    customerRebookingCadenceService.computeLearnedCadenceDays.mockResolvedValue(21);
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-last',
      startTime: new Date('2026-05-01T14:00:00.000Z'),
      employeeId: 'emp-1',
    });

    const candidates = await service.findRebookingNudgeCandidates('biz-1', {
      ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
      rebookingNudgeEnabled: true,
      defaultRebookingCadenceDays: 28,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.cadenceDays).toBe(21);
    expect(candidates[0]).toMatchObject({
      lastBookingId: 'bk-last',
      employeeId: 'emp-1',
    });
  });

  it('skips customers with an upcoming booking for the same service', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 28);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: { gdpr: { marketingOptIn: true } },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: {},
          lastEnd,
        },
      ]),
    });
    bookingRepo.exists.mockResolvedValue(true);

    await expect(
      service.findRebookingNudgeCandidates('biz-1', {
        ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
        rebookingNudgeEnabled: true,
      }),
    ).resolves.toEqual([]);
  });

  it('sends rebooking nudge email and push', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+15551234567',
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushReminders: true },
        },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    const sent = await service.processBusinessRebookingNudges('biz-1');
    expect(sent).toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        subject: expect.stringContaining('Haircut'),
      }),
    );
    expect(consumerPushDispatch.sendTransactionalPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pushType: 'rebooking_nudge',
        serviceId: 'svc-1',
      }),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'rebooking_nudge', serviceId: 'svc-1' }),
    );
  });

  it('includes one-tap rebook params in push deep link when last booking is known', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          rebookingNudgeEnabled: true,
          rebookingNudgeEmailEnabled: false,
          rebookingNudgePushEnabled: true,
        },
      },
    });
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushOffers: true },
        },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 21,
        lastCompletedAt: new Date('2026-05-01T15:00:00.000Z').toISOString(),
        lastBookingId: 'bk-last',
        lastStartTime: '2026-05-01T14:00:00.000Z',
        employeeId: 'emp-1',
      },
    ]);

    await service.processBusinessRebookingNudges('biz-1');

    expect(consumerPushDispatch.sendTransactionalPush).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('rebook=1'),
      }),
    );
    expect(consumerPushDispatch.sendTransactionalPush).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('slot=2026-05-01T14%3A00%3A00.000Z'),
      }),
    );
  });

  it('returns zero when rebooking nudges are disabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: { rebookingNudgeEnabled: false },
      },
    });
    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(
      0,
    );
  });

  it('returns zero when business is inactive', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      isActive: false,
    });
    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(
      0,
    );
  });

  it('skips customers who are not marketing opted in', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 28);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: { gdpr: { marketingOptIn: false } },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });

    await expect(
      service.findRebookingNudgeCandidates('biz-1', {
        ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
        rebookingNudgeEnabled: true,
      }),
    ).resolves.toEqual([]);
  });

  it('skips customers not yet due for rebooking', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 7);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: { gdpr: { marketingOptIn: true } },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });

    await expect(
      service.findRebookingNudgeCandidates('biz-1', {
        ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
        rebookingNudgeEnabled: true,
      }),
    ).resolves.toEqual([]);
  });

  it('still nudges when last rebooking send is outside cooldown window', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 28);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: { gdpr: { marketingOptIn: true } },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });
    logRepo.findOne.mockResolvedValue({
      sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    });

    await expect(
      service.findRebookingNudgeCandidates('biz-1', {
        ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
        rebookingNudgeEnabled: true,
        minDaysBetweenRebookingNudges: 14,
      }),
    ).resolves.toHaveLength(1);
  });

  it('excludes customers recently sent a rebooking nudge for the same service', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 28);

    bookingRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          customerId: 'cust-1',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: null,
          customerMetadata: { gdpr: { marketingOptIn: true } },
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          serviceMetadata: { rebookingCadenceDays: 28 },
          lastEnd,
        },
      ]),
    });
    logRepo.findOne.mockResolvedValue({
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    await expect(
      service.findRebookingNudgeCandidates('biz-1', {
        ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
        rebookingNudgeEnabled: true,
        minDaysBetweenRebookingNudges: 14,
      }),
    ).resolves.toEqual([]);
  });

  it('sends rebooking nudge sms when enabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          rebookingNudgeEnabled: true,
          rebookingNudgeEmailEnabled: false,
          rebookingNudgeSmsEnabled: true,
          rebookingNudgePushEnabled: false,
        },
      },
    });
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: '+15551234567',
        customerMetadata: { gdpr: { marketingOptIn: true } },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(1);
    expect(smsService.send).toHaveBeenCalled();
  });

  it('skips push when customer disabled push offers (adopt-4.8)', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushOffers: false },
        },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(1);
    expect(consumerPushDispatch.sendTransactionalPush).not.toHaveBeenCalled();
  });

  it('logs failed push dispatch', async () => {
    consumerPushDispatch.sendTransactionalPush.mockResolvedValue({
      ok: false,
      reason: 'firebase_not_configured',
    });
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          rebookingNudgeEnabled: true,
          rebookingNudgeEmailEnabled: false,
          rebookingNudgePushEnabled: true,
        },
      },
    });
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushReminders: true },
        },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(0);
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'push', status: 'failed' }),
    );
  });

  it('logs skipped push dispatch without counting as sent', async () => {
    consumerPushDispatch.sendTransactionalPush.mockResolvedValue({
      ok: false,
      skipped: true,
      reason: 'no_device_tokens',
    });
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          rebookingNudgeEnabled: true,
          rebookingNudgeEmailEnabled: false,
          rebookingNudgePushEnabled: true,
        },
      },
    });
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushReminders: true },
        },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(0);
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'push', status: 'skipped' }),
    );
  });

  it('includes rebooking promo code in email body', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          rebookingNudgeEnabled: true,
          rebookingNudgeEmailEnabled: true,
          rebookingNudgePushEnabled: false,
          rebookingNudgePromoCode: 'REBOOK15',
        },
      },
    });
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        customerMetadata: { gdpr: { marketingOptIn: true } },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessRebookingNudges('biz-1')).resolves.toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('REBOOK15'),
      }),
    );
  });

  it('builds booking url from config fallback when FRONTEND_URL is unset', async () => {
    configService.get.mockReturnValue(undefined);
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          rebookingNudgeEnabled: true,
          rebookingNudgeEmailEnabled: true,
          rebookingNudgePushEnabled: false,
        },
      },
    });
    jest.spyOn(service, 'findRebookingNudgeCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        customerMetadata: { gdpr: { marketingOptIn: true } },
        serviceId: 'svc-1',
        serviceName: 'Haircut',
        cadenceDays: 28,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await service.processBusinessRebookingNudges('biz-1');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          'http://localhost:3000/book/demo-salon?serviceId=svc-1',
        ),
      }),
    );
  });

  it('processes all active businesses for rebooking nudges', async () => {
    businessRepo.find.mockResolvedValue([{ id: 'biz-1', isActive: true }]);
    jest.spyOn(service, 'processBusinessRebookingNudges').mockResolvedValue(2);
    await expect(service.processAllRebookingNudges()).resolves.toBe(2);
  });
});
