import { MarketingAutomationService } from './marketing-automation.service.js';
import { DEFAULT_MARKETING_AUTOMATION_SETTINGS } from './marketing-automation.types.js';
import { buildActivationConciergeEventRows } from '../../common/utils/n99-activation-concierge.fixtures.js';

describe('MarketingAutomationService activation concierge (n99-3.5)', () => {
  const businessRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const customerRepo = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const bookingRepo = {
    createQueryBuilder: jest.fn(),
    exists: jest.fn(),
    findOne: jest.fn(),
  };
  const logRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const appEventRepo = { find: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
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
        activationConciergeEnabled: true,
        activationConciergeEmailEnabled: true,
        activationConciergePushEnabled: true,
      },
      notifications: { emailEnabled: true },
    },
  };

  const eventRows = buildActivationConciergeEventRows({
    anonId: 'anon-1',
    installAt: '2026-06-08T00:00:00.000Z',
    serviceId: 'svc-1',
    date: '2026-06-10',
    slot: '2026-06-10T14:00:00.000Z',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-09T02:00:00.000Z'));
    logRepo.create.mockImplementation((value) => value);
    logRepo.save.mockResolvedValue(undefined);
    logRepo.find.mockResolvedValue([]);
    serviceRepo.findOne.mockResolvedValue({ name: 'Haircut' });
    appEventRepo.find.mockResolvedValue(
      eventRows.map((row, index) => ({
        id: `evt-${index}`,
        businessId: 'biz-1',
        anonId: row.anonId,
        event: row.event,
        platform: row.platform,
        appSurface: row.appSurface,
        locale: row.locale,
        tenantSlug: row.tenantSlug,
        props: row.props,
        createdAt: row.createdAt,
      })),
    );
    customerRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        metadata: {
          appAnalyticsAnonId: 'anon-1',
          notifications: { pushReminders: true },
        },
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('finds qualified unactivated installs due for 24h concierge', async () => {
    const candidates = await service.findActivationConciergeCandidates('biz-1', {
      ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
      activationConciergeEnabled: true,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      anonId: 'anon-1',
      customerId: 'cust-1',
      milestone: '24h',
      resume: { serviceId: 'svc-1' },
    });
  });

  it('sends activation concierge email and push with resume link', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    jest.spyOn(service, 'findActivationConciergeCandidates').mockResolvedValue([
      {
        anonId: 'anon-1',
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        customerMetadata: {
          appAnalyticsAnonId: 'anon-1',
          notifications: { pushReminders: true },
        },
        milestone: '24h',
        resume: {
          serviceId: 'svc-1',
          date: '2026-06-10',
          slot: '2026-06-10T14:00:00.000Z',
        },
      },
    ]);

    const sent = await service.processBusinessActivationConcierge('biz-1');
    expect(sent).toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        text: expect.stringContaining('resume=1'),
      }),
    );
    expect(consumerPushDispatch.sendTransactionalPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pushType: 'activation_concierge',
        url: expect.stringContaining('resume=1'),
      }),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'activation_concierge',
        recipient: '24h',
      }),
    );
  });

  it('returns zero when activation concierge is disabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        marketingAutomation: { activationConciergeEnabled: false },
      },
    });

    await expect(service.processBusinessActivationConcierge('biz-1')).resolves.toBe(0);
  });

  it('processes all active businesses for activation concierge', async () => {
    businessRepo.find.mockResolvedValue([business, { ...business, id: 'biz-2' }]);
    jest
      .spyOn(service, 'processBusinessActivationConcierge')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    await expect(service.processAllActivationConciergeNudges()).resolves.toBe(1);
  });
});
