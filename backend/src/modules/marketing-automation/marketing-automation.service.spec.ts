import { NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { MarketingAutomationService } from './marketing-automation.service.js';

describe('MarketingAutomationService', () => {
  const businessRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const customerRepo = { find: jest.fn() };
  const bookingRepo = { createQueryBuilder: jest.fn() };
  const logRepo = { count: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const emailService = { send: jest.fn() };
  const smsService = { send: jest.fn() };
  const configService = { get: jest.fn().mockReturnValue('http://localhost:3000') };

  const service = new MarketingAutomationService(
    businessRepo as any,
    customerRepo as any,
    bookingRepo as any,
    logRepo as any,
    emailService as any,
    smsService as any,
    configService as any,
  );

  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    settings: {
      marketingAutomation: { reEngagementEnabled: true },
      notifications: { emailEnabled: true, smsEnabled: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    businessRepo.findOne.mockResolvedValue(business);
    businessRepo.save.mockImplementation(async (b) => b);
    logRepo.create.mockImplementation((v) => v);
    logRepo.save.mockResolvedValue(undefined);
    logRepo.count.mockResolvedValue(2);
    emailService.send.mockResolvedValue({ ok: true });
    smsService.send.mockResolvedValue({ ok: true });
  });

  it('loads merged settings', async () => {
    await expect(service.getSettings('biz-1')).resolves.toMatchObject({
      reEngagementEnabled: true,
      inactiveDaysThreshold: 90,
    });
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getSettings('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates settings on business record', async () => {
    const next = await service.updateSettings('biz-1', {
      reEngagementEnabled: true,
      reEngagementPromoCode: 'WINBACK',
    });
    expect(next.reEngagementPromoCode).toBe('WINBACK');
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          marketingAutomation: expect.objectContaining({ reEngagementPromoCode: 'WINBACK' }),
        }),
      }),
    );
  });

  it('reads post-visit review toggle from settings', () => {
    expect(service.isPostVisitReviewEnabled({ marketingAutomation: { postVisitReviewEnabled: false } })).toBe(
      false,
    );
    expect(service.isPostVisitReviewEnabled(undefined)).toBe(true);
  });

  it('returns summary with eligible count', async () => {
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      { customerId: 'c1', name: 'Ann', email: 'a@x.com', phone: null, lastCompletedAt: null },
    ]);
    await expect(service.getSummary('biz-1')).resolves.toEqual({
      settings: expect.objectContaining({ reEngagementEnabled: true }),
      eligibleInactiveCustomers: 1,
      reEngagementSentLast30Days: 2,
    });
  });

  it('skips re-engagement when disabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { marketingAutomation: { reEngagementEnabled: false } },
    });
    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
  });

  it('finds inactive marketing-opted-in customers', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 120);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+15551234567',
        metadata: { gdpr: { marketingOptIn: true } },
      },
      {
        id: 'cust-2',
        businessId: 'biz-1',
        isActive: true,
        name: 'Bob',
        email: 'bob@example.com',
        metadata: { gdpr: { marketingOptIn: false } },
      },
    ]);

    const getRawOne = jest
      .fn()
      .mockResolvedValueOnce({ lastEnd: oldDate })
      .mockResolvedValueOnce({ lastEnd: oldDate });
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: getRawOne,
    });
    logRepo.findOne.mockResolvedValue(null);

    const candidates = await service.findReEngagementCandidates('biz-1');
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.customerId).toBe('cust-1');
    expect(getRawOne).toHaveBeenCalled();
  });

  it('excludes recently contacted customers', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 120);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
        name: 'Jane',
        email: 'jane@example.com',
        metadata: { gdpr: { marketingOptIn: true } },
      },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ lastEnd: oldDate }),
    });
    logRepo.findOne.mockResolvedValue({ sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });

    await expect(service.findReEngagementCandidates('biz-1')).resolves.toEqual([]);
  });

  it('excludes customers with a recent completed visit', async () => {
    const recentDate = new Date();

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
        name: 'Jane',
        email: 'jane@example.com',
        metadata: { gdpr: { marketingOptIn: true } },
      },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ lastEnd: recentDate }),
    });
    logRepo.findOne.mockResolvedValue(null);

    await expect(service.findReEngagementCandidates('biz-1')).resolves.toEqual([]);
  });

  it('sends re-engagement sms when enabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: false,
          reEngagementSmsEnabled: true,
        },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: '+15551234567',
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(1);
    expect(smsService.send).toHaveBeenCalledWith('+15551234567', expect.stringContaining('Demo Salon'));
  });

  it('logs failed email dispatch', async () => {
    emailService.send.mockResolvedValue({ ok: false, error: 'smtp down' });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error: 'smtp down' }),
    );
  });

  it('processes only active businesses from repository query', async () => {
    businessRepo.find.mockResolvedValue([{ id: 'biz-1', isActive: true }]);
    jest.spyOn(service, 'processBusinessReEngagement').mockResolvedValue(1);
    await expect(service.processAllBusinesses()).resolves.toBe(1);
    expect(businessRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
  });

  it('sends re-engagement email and logs success', async () => {
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    const sent = await service.processBusinessReEngagement('biz-1');
    expect(sent).toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com' }),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        customerId: 'cust-1',
        kind: 're_engagement',
        channel: 'email',
        status: 'sent',
      }),
    );
  });

  it('updates settings clearing promo code with null', async () => {
    const next = await service.updateSettings('biz-1', { reEngagementPromoCode: null });
    expect(next.reEngagementPromoCode).toBeNull();
  });

  it('returns zero when business is inactive during re-engagement processing', async () => {
    businessRepo.findOne.mockResolvedValue({ ...business, isActive: false });
    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
  });

  it('includes customer when prior re-engagement is outside cooldown window', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 120);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
        name: 'Jane',
        email: 'jane@example.com',
        metadata: { gdpr: { marketingOptIn: true } },
      },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ lastEnd: oldDate }),
    });
    logRepo.findOne.mockResolvedValue({ sentAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) });

    await expect(service.findReEngagementCandidates('biz-1')).resolves.toHaveLength(1);
  });

  it('skips customers who never completed a visit', async () => {
    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
        name: 'Jane',
        email: 'jane@example.com',
        metadata: { gdpr: { marketingOptIn: true } },
      },
    ]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ lastEnd: null }),
    });

    await expect(service.findReEngagementCandidates('biz-1')).resolves.toEqual([]);
  });

  it('appends promo code to re-engagement message body', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementPromoCode: 'WINBACK10',
        },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await service.processBusinessReEngagement('biz-1');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('WINBACK10'),
      }),
    );
  });

  it('skips email when business email notifications are disabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: true,
          reEngagementSmsEnabled: true,
        },
        notifications: { emailEnabled: false, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+15551234567',
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(1);
    expect(emailService.send).not.toHaveBeenCalled();
    expect(smsService.send).toHaveBeenCalled();
  });

  it('logs failed sms dispatch', async () => {
    smsService.send.mockResolvedValue({ ok: false, error: 'invalid number' });
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: false,
          reEngagementSmsEnabled: true,
        },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: '+15551234567',
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'sms', status: 'failed', error: 'invalid number' }),
    );
  });

  it('builds booking url without trailing slash on frontend base', async () => {
    configService.get.mockReturnValue('http://localhost:3000/');
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await service.processBusinessReEngagement('biz-1');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('http://localhost:3000/book/demo-salon'),
      }),
    );
  });

  it('returns false send result when customer has no contact channels enabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: false,
          reEngagementSmsEnabled: false,
        },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+15551234567',
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
    expect(emailService.send).not.toHaveBeenCalled();
    expect(smsService.send).not.toHaveBeenCalled();
  });

  it('reads post-visit review toggle when marketing settings are non-object', () => {
    expect(
      service.isPostVisitReviewEnabled({ marketingAutomation: 'invalid' as unknown as Record<string, unknown> }),
    ).toBe(true);
  });

  it('clears promo code when update receives null', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { marketingAutomation: { reEngagementPromoCode: 'KEEP' } },
    });
    const next = await service.updateSettings('biz-1', { reEngagementPromoCode: null });
    expect(next.reEngagementPromoCode).toBeNull();
  });

  it('returns zero when business record is missing during batch item processing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
  });

  it('sends both email and sms when both channels are enabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: true,
          reEngagementSmsEnabled: true,
        },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '+15551234567',
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(1);
    expect(emailService.send).toHaveBeenCalled();
    expect(smsService.send).toHaveBeenCalled();
    expect(logRepo.save).toHaveBeenCalledTimes(2);
  });

  it('uses default settings when finding candidates without explicit settings arg', async () => {
    customerRepo.find.mockResolvedValue([]);
    await expect(service.findReEngagementCandidates('biz-1')).resolves.toEqual([]);
    expect(customerRepo.find).toHaveBeenCalled();
  });

  it('sends only sms when candidate has phone but no email', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        marketingAutomation: {
          reEngagementEnabled: true,
          reEngagementEmailEnabled: true,
          reEngagementSmsEnabled: true,
        },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: null,
        phone: '+15551234567',
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(1);
    expect(emailService.send).not.toHaveBeenCalled();
    expect(smsService.send).toHaveBeenCalled();
  });

  it('excludes customer exactly on inactivity threshold boundary', async () => {
    const thresholdDays = 90;
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - thresholdDays);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
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
    logRepo.findOne.mockResolvedValue(null);

    await expect(service.findReEngagementCandidates('biz-1')).resolves.toEqual([]);
  });

  it('includes customer just past inactivity threshold boundary', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 91);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
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
    logRepo.findOne.mockResolvedValue(null);

    await expect(service.findReEngagementCandidates('biz-1')).resolves.toHaveLength(1);
  });

  it('preserves existing promo when update omits promo field', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { marketingAutomation: { reEngagementPromoCode: 'SAVE20' } },
    });
    const next = await service.updateSettings('biz-1', { reEngagementEnabled: true });
    expect(next.reEngagementPromoCode).toBe('SAVE20');
  });

  it('keeps existing promo when update receives blank string', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { marketingAutomation: { reEngagementPromoCode: 'OLD' } },
    });
    const next = await service.updateSettings('biz-1', { reEngagementPromoCode: '   ' });
    expect(next.reEngagementPromoCode).toBe('OLD');
  });

  it('replaces promo code when update provides a new trimmed value', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { marketingAutomation: { reEngagementPromoCode: 'OLD' } },
    });
    const next = await service.updateSettings('biz-1', { reEngagementPromoCode: '  NEWCODE  ' });
    expect(next.reEngagementPromoCode).toBe('NEWCODE');
  });

  it('finds candidates using custom inactivity settings', async () => {
    const lastEnd = new Date();
    lastEnd.setDate(lastEnd.getDate() - 45);

    customerRepo.find.mockResolvedValue([
      {
        id: 'cust-1',
        businessId: 'biz-1',
        isActive: true,
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
    logRepo.findOne.mockResolvedValue(null);

    const candidates = await service.findReEngagementCandidates('biz-1', {
      postVisitReviewEnabled: true,
      reEngagementEnabled: true,
      inactiveDaysThreshold: 30,
      reEngagementEmailEnabled: true,
      reEngagementSmsEnabled: false,
      minDaysBetweenReEngagement: 7,
      reEngagementPromoCode: null,
    });
    expect(candidates).toHaveLength(1);
  });

  it('processes business with undefined settings using defaults', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      slug: 'demo-salon',
      name: 'Demo Salon',
      isActive: true,
      settings: undefined,
    });
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([]);

    await expect(service.processBusinessReEngagement('biz-1')).resolves.toBe(0);
  });

  it('uses default frontend url when config is unset', async () => {
    configService.get.mockReturnValue(undefined);
    jest.spyOn(service, 'findReEngagementCandidates').mockResolvedValue([
      {
        customerId: 'cust-1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
        lastCompletedAt: new Date().toISOString(),
      },
    ]);

    await service.processBusinessReEngagement('biz-1');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('http://localhost:3000/book/demo-salon'),
      }),
    );
  });

  it('falls back to plain-text email content when html and subject are omitted', async () => {
    const ok = await (service as any).dispatchCustomerMessage(
      'biz-1',
      'cust-1',
      're_engagement',
      'email',
      'jane@example.com',
      () => ({ text: 'Plain body only' }),
    );

    expect(ok).toBe(true);
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'jane@example.com',
      subject: 'Message from your service provider',
      html: '<p>Plain body only</p>',
      text: 'Plain body only',
    });
  });

  it('processes all active businesses', async () => {
    businessRepo.find.mockResolvedValue([{ id: 'biz-1', isActive: true }]);
    jest.spyOn(service, 'processBusinessReEngagement').mockResolvedValue(3);
    await expect(service.processAllBusinesses()).resolves.toBe(3);
  });
});
