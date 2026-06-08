import { NotificationsService } from './notifications.service.js';
import { t } from '../../common/i18n/messages.js';

describe('NotificationsService.sendClinicLabBookingRequest', () => {
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
    sendResultReady: jest.fn(),
    sendTransactionalPush: jest.fn().mockResolvedValue({ ok: false }),
    sendLabBookingRequest: jest.fn(async () => ({
      ok: false,
      skipped: true,
      reason: 'consumer_push_tokens_not_available',
    })),
  };
  const configService = { get: jest.fn(() => 'https://app.test') };

  const service = new NotificationsService(
    bookingRepo as never,
    businessRepo as never,
    customerRepo as never,
    logRepo as never,
    resultRepo as never,
    emailService as never,
    smsService as never,
    whatsappService as never,
    whatsappIntegrationService as never,
    configService as never,
    consumerPushDispatch as never,
  );

  const baseInput = {
    orderId: 'order-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    testNames: 'CBC, Lipid panel',
    collectionServiceName: 'Lab blood draw',
    collectionServiceId: 'svc-1',
    clinicOrderToken: 'token-abc',
    bookUrl:
      'https://app.test/book/city-clinic/any/availability?clinicOrderToken=abc',
    accountUrl:
      'https://app.test/book/city-clinic/account?section=lab-requests',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    logRepo.findOne.mockResolvedValue(null);
    businessRepo.findOne.mockResolvedValue({
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
    });
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'patient@example.com',
      phone: '+15551234567',
      metadata: {
        notifications: {
          emailReminders: true,
          smsReminders: true,
          whatsappReminders: true,
        },
      },
    });
  });

  it('sends localized email, SMS, and WhatsApp for lab booking requests', async () => {
    await service.sendClinicLabBookingRequest(baseInput);

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'patient@example.com',
        subject: expect.stringContaining('City Clinic'),
        text: expect.stringContaining(baseInput.bookUrl),
      }),
    );
    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining('Lab blood draw'),
    );
    expect(whatsappService.sendBookingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'lab_booking_request',
        toPhone: '+15551234567',
        serviceName: 'Lab blood draw',
        reminderLabel: t('en', 'email.clinicLabBookingRequestWhatsapp', {
          collectionServiceName: 'Lab blood draw',
          testNames: 'CBC, Lipid panel',
        }),
      }),
      expect.any(Object),
    );
    expect(logRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'lab_booking_request',
        channel: 'whatsapp',
        bookingId: 'order-1',
      }),
    );
  });

  it('uses Armenian notification copy when business locale is hy', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
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
    });

    await service.sendClinicLabBookingRequest(baseInput);

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: t('hy', 'email.clinicLabBookingRequestSubject', {
          businessName: 'Yerevan Clinic',
        }),
      }),
    );
    expect(whatsappService.sendBookingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderLabel: t('hy', 'email.clinicLabBookingRequestWhatsapp', {
          collectionServiceName: 'Lab blood draw',
          testNames: 'CBC, Lipid panel',
        }),
      }),
      expect.any(Object),
    );
  });

  it('uses Russian notification copy when business locale is ru', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
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
    });

    await service.sendClinicLabBookingRequest(baseInput);

    expect(smsService.send).toHaveBeenCalledWith(
      '+15551234567',
      t('ru', 'email.clinicLabBookingRequestSms', {
        businessName: 'Moscow Clinic',
        collectionServiceName: 'Lab blood draw',
        testNames: 'CBC, Lipid panel',
        bookUrl: baseInput.bookUrl,
      }),
    );
  });

  it('skips WhatsApp when integration is not configured', async () => {
    whatsappIntegrationService.resolveRuntimeConfig.mockReturnValueOnce(null);

    await service.sendClinicLabBookingRequest(baseInput);

    expect(whatsappService.sendBookingMessage).not.toHaveBeenCalled();
  });

  it('queues consumer push payload with lab-requests deep link', async () => {
    await service.sendClinicLabBookingRequest(baseInput);

    expect(consumerPushDispatch.sendLabBookingRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        pushType: 'lab_booking_request',
        url: 'optischedule://book/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=token-abc',
        orderId: 'order-1',
        collectionServiceId: 'svc-1',
        clinicOrderToken: 'token-abc',
        title: t('en', 'email.clinicLabBookingRequestPushTitle', {
          businessName: 'City Clinic',
        }),
        body: t('en', 'email.clinicLabBookingRequestPushBody', {
          collectionServiceName: 'Lab blood draw',
          testNames: 'CBC, Lipid panel',
        }),
      }),
    );
  });

  it('skips consumer push when business disables lab booking request push', async () => {
    businessRepo.findOne.mockResolvedValue({
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
          sendLabBookingRequestPush: false,
        },
      },
    });

    await service.sendClinicLabBookingRequest(baseInput);

    expect(consumerPushDispatch.sendLabBookingRequest).not.toHaveBeenCalled();
  });
});
