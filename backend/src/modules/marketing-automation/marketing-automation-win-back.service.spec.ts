import { MarketingAutomationService } from './marketing-automation.service.js';
import { DEFAULT_MARKETING_AUTOMATION_SETTINGS } from './marketing-automation.types.js';

describe('MarketingAutomationService win-back (adopt-4.5)', () => {
  const businessRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const customerRepo = { find: jest.fn() };
  const bookingRepo = {
    createQueryBuilder: jest.fn(),
    exists: jest.fn(),
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
    adjust: jest.fn().mockResolvedValue({ pointsBalance: 10 }),
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
        reEngagementEnabled: true,
        reEngagementEmailEnabled: true,
        reEngagementPushEnabled: true,
        reEngagementPromoCode: 'WINBACK10',
        reEngagementLoyaltyBonusPoints: 5,
      },
      notifications: { emailEnabled: true, smsEnabled: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    logRepo.create.mockImplementation((value) => value);
    logRepo.save.mockResolvedValue(undefined);
    logRepo.findOne.mockResolvedValue(null);
    bookingRepo.exists.mockResolvedValue(false);
    configService.get.mockReturnValue('http://localhost:3000');
    emailService.send.mockResolvedValue({ ok: true });
    smsService.send.mockResolvedValue({ ok: true });
    consumerPushDispatch.sendTransactionalPush.mockResolvedValue({
      ok: true,
      sentCount: 1,
    });
  });

  it('finds lapsed customers with no upcoming booking', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 120);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+15551234567',
        metadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushReminders: true },
        },
      },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ lastEnd }),
    });

    const candidates = await service.findReEngagementCandidates('biz-1', {
      ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
      reEngagementEnabled: true,
      inactiveDaysThreshold: 90,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      customerId: 'cust-1',
      email: 'jane@example.com',
    });
  });

  it('skips customers with an upcoming booking', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 120);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        metadata: { gdpr: { marketingOptIn: true } },
      },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ lastEnd }),
    });
    bookingRepo.exists.mockResolvedValue(true);

    await expect(
      service.findReEngagementCandidates('biz-1', {
        ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
        reEngagementEnabled: true,
      }),
    ).resolves.toEqual([]);
  });

  it('sends win-back email, push, and credits loyalty bonus', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushReminders: true },
        },
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        text: expect.stringContaining('WINBACK10'),
      }),
    );
    expect(consumerPushDispatch.sendTransactionalPush).toHaveBeenCalledWith(
      expect.objectContaining({ pushType: 'win_back' }),
    );
    expect(loyaltyService.adjust).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      5,
      'Win-back campaign bonus',
    );
  });

  it('does not credit loyalty when all channels fail', async () => {
    emailService.send.mockResolvedValue({ ok: false, error: 'smtp down' });
    consumerPushDispatch.sendTransactionalPush.mockResolvedValue({
      ok: false,
      reason: 'firebase_not_configured',
    });
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: true,
          reEngagementPushEnabled: true,
          reEngagementLoyaltyBonusPoints: 5,
        },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushReminders: true },
        },
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
    expect(loyaltyService.adjust).not.toHaveBeenCalled();
  });

  it('skips push when customer disabled push reminders', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        customerMetadata: {
          gdpr: { marketingOptIn: true },
          notifications: { pushOffers: false },
        },
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(1);
    expect(consumerPushDispatch.sendTransactionalPush).not.toHaveBeenCalled();
    expect(loyaltyService.adjust).toHaveBeenCalled();
  });
});
