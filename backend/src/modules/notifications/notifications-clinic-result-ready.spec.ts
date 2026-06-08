import { NotificationsService } from './notifications.service.js';
import { t } from '../../common/i18n/messages.js';

describe('NotificationsService.sendClinicResultReady', () => {
  const bookingRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const logRepo = {
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const resultRepo = { findOne: jest.fn() };
  const emailService = {
    send: jest.fn(async () => ({ ok: true })),
    isConfigured: true,
  };
  const smsService = {
    send: jest.fn(async () => ({ ok: true })),
    isConfigured: true,
  };
  const whatsappService = {
    sendBookingMessage: jest.fn(async () => ({ ok: true })),
  };
  const whatsappIntegrationService = {
    resolveRuntimeConfig: jest.fn(() => ({
      source: 'platform',
      templateReminder: 'appointment_reminder',
      templateLanguage: 'en',
      reminderBodyParamCount: 4,
    })),
  };
  const consumerPushDispatch = {
    sendResultReady: jest.fn(async () => ({
      ok: false,
      skipped: true,
      reason: 'consumer_push_tokens_not_available',
    })),
    sendTransactionalPush: jest.fn().mockResolvedValue({ ok: false }),
  };
  const configService = { get: jest.fn(() => 'https://app.test') };

  const service = new NotificationsService(
    bookingRepo as any,
    businessRepo as any,
    customerRepo as any,
    logRepo as any,
    resultRepo as any,
    emailService as any,
    smsService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    configService as any,
    consumerPushDispatch as any,
  );

  const baseResult = {
    id: 'result-1',
    status: 'Released',
    businessId: 'biz-1',
    bookingId: 'booking-1',
    releasedAt: new Date('2026-06-07T14:30:00.000Z'),
    customer: {
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'patient@example.com',
      phone: '+15551234567',
      metadata: {
        notifications: {
          emailReminders: true,
          smsReminders: true,
          whatsappReminders: true,
          pushReminders: true,
        },
      },
    },
    order: { displayNames: 'CBC' },
    testType: null,
    business: {
      id: 'biz-1',
      name: 'City Clinic',
      slug: 'city-clinic',
      settings: {
        businessType: 'clinic',
        locale: 'en',
        notifications: {
          emailEnabled: true,
          smsEnabled: true,
          whatsappEnabled: true,
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    logRepo.findOne.mockResolvedValue(null);
    resultRepo.findOne.mockResolvedValue(baseResult);
    bookingRepo.findOne.mockResolvedValue({
      id: 'booking-1',
      businessId: 'biz-1',
      status: 'completed',
      startTime: new Date('2026-06-01T10:00:00.000Z'),
      endTime: new Date('2026-06-01T10:30:00.000Z'),
      customer: {
        name: 'Jane Doe',
        email: 'patient@example.com',
        metadata: {},
      },
      service: { name: 'CBC' },
      employee: { name: 'Dr Smith' },
      business: {
        id: 'biz-1',
        name: 'City Clinic',
        slug: 'city-clinic',
        settings: { businessType: 'clinic', locale: 'en' },
      },
    });
  });

  it('sends result-ready email for released clinic results', async () => {
    const summary = await service.sendClinicResultReady('result-1');

    expect(summary.delivered).toContain('email');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'patient@example.com',
        subject: expect.stringContaining('City Clinic'),
        text: expect.stringContaining(
          'https://app.test/book/city-clinic/account?section=results',
        ),
      }),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'result_ready',
        channel: 'email',
        bookingId: 'booking-1',
      }),
    );
  });

  it('sends localized SMS with deep-link CTA', async () => {
    await service.sendClinicResultReady('result-1');

    const accountLine = t('en', 'email.clinicResultReadyAccountLink', {
      url: 'https://app.test/book/city-clinic/account?section=results',
    });
    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining(accountLine),
    );
    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining('City Clinic'),
    );
    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining('CBC'),
    );
  });

  it('skips when result is not released', async () => {
    resultRepo.findOne.mockResolvedValue({
      id: 'result-1',
      status: 'Reviewed',
      business: { settings: { businessType: 'clinic' } },
      customer: { email: 'patient@example.com' },
    });

    const summary = await service.sendClinicResultReady('result-1');

    expect(summary.delivered).toEqual([]);
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('uses Armenian notification copy when business locale is hy', async () => {
    resultRepo.findOne.mockResolvedValue({
      ...baseResult,
      business: {
        ...baseResult.business,
        name: 'Yerevan Clinic',
        settings: {
          businessType: 'clinic',
          locale: 'hy',
          notifications: {
            emailEnabled: true,
            smsEnabled: true,
            whatsappEnabled: true,
          },
        },
      },
    });

    await service.sendClinicResultReady('result-1');

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: t('hy', 'email.clinicResultReadySubject', {
          businessName: 'Yerevan Clinic',
        }),
      }),
    );
    expect(whatsappService.sendBookingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderLabel: expect.stringContaining('Արդյունքները պատրաստ են'),
      }),
      expect.any(Object),
    );
  });

  it('uses Russian SMS copy when business locale is ru', async () => {
    resultRepo.findOne.mockResolvedValue({
      ...baseResult,
      business: {
        ...baseResult.business,
        name: 'Moscow Clinic',
        settings: {
          businessType: 'clinic',
          locale: 'ru',
          notifications: {
            emailEnabled: true,
            smsEnabled: true,
            whatsappEnabled: true,
          },
        },
      },
    });

    await service.sendClinicResultReady('result-1');

    const accountLine = t('ru', 'email.clinicResultReadyAccountLink', {
      url: 'https://app.test/book/city-clinic/account?section=results',
    });
    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining(accountLine),
    );
    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining('Moscow Clinic'),
    );
  });

  it('queues consumer push payload with result-ready deep link and localized copy', async () => {
    await service.sendClinicResultReady('result-1');

    expect(consumerPushDispatch.sendResultReady).toHaveBeenCalledWith(
      expect.objectContaining({
        pushType: 'result_ready',
        url: 'optischedule://book/city-clinic/results',
        resultId: 'result-1',
        title: t('en', 'email.clinicResultReadyPushTitle', {
          businessName: 'City Clinic',
        }),
        body: t('en', 'email.clinicResultReadyPushBody', { testName: 'CBC' }),
        foregroundHint: t('en', 'email.clinicResultReadyPushForegroundHint', {
          testName: 'CBC',
        }),
      }),
    );
  });
});
