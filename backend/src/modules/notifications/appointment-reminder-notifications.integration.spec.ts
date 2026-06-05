import { BookingStatus } from '../booking/entities/booking.entity.js';
import { NotificationsService } from './notifications.service.js';

function queryBuilderMock(bookings: unknown[]) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(bookings),
  };
}

describe('Customer-chosen appointment reminders integration', () => {
  const bookingRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const businessRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const logRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const emailService = {
    send: jest.fn().mockResolvedValue({ ok: true }),
    isConfigured: true,
  };
  const smsService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const whatsappService = {
    sendBookingMessage: jest.fn().mockResolvedValue({ ok: true }),
    shouldSkipImmediateAfterConfirmation: jest.fn(),
  };
  const whatsappIntegrationService = {
    resolveRuntimeConfig: jest.fn().mockReturnValue({}),
  };
  const configService = { get: jest.fn(() => 'https://app.test') };

  const service = new NotificationsService(
    bookingRepo as any,
    businessRepo as any,
    customerRepo as any,
    logRepo as any,
    emailService as any,
    smsService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    configService as any,
  );

  const choiceEnabledBusiness = {
    id: 'biz-1',
    name: 'Glow Salon',
    slug: 'glow',
    settings: {
      notifications: {
        emailEnabled: true,
        smsEnabled: true,
        whatsappEnabled: true,
        reminder24hEmail: true,
        reminder24hSms: true,
        reminder24hWhatsapp: true,
        reminder1hEmail: true,
        reminder1hSms: true,
        reminder1hWhatsapp: true,
        allowCustomerReminderChoice: true,
        customerReminderOptionsHours: [24, 6, 1],
        defaultCustomerReminderHours: 24,
      },
    },
  };

  const legacyBusiness = {
    ...choiceEnabledBusiness,
    settings: {
      notifications: {
        ...choiceEnabledBusiness.settings.notifications,
        allowCustomerReminderChoice: false,
      },
    },
  };

  const customer = {
    id: 'cust-1',
    name: 'Alex',
    email: 'alex@test.com',
    phone: '+15551234567',
    metadata: {
      notifications: {
        emailReminders: true,
        smsReminders: true,
        whatsappReminders: true,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    logRepo.save.mockResolvedValue(undefined);
    logRepo.findOne.mockResolvedValue(null);
    emailService.send.mockResolvedValue({ ok: true });
    smsService.send.mockResolvedValue({ ok: true });
    whatsappService.sendBookingMessage.mockResolvedValue({ ok: true });
  });

  function mockReminderQueries(
    legacy24: unknown[],
    legacy1: unknown[],
    customerChoice: unknown[],
  ) {
    bookingRepo.createQueryBuilder
      .mockReturnValueOnce(queryBuilderMock(legacy24))
      .mockReturnValueOnce(queryBuilderMock(legacy1))
      .mockReturnValueOnce(queryBuilderMock(customerChoice));
  }

  it('sends email at the customer-chosen lead time', async () => {
    const startTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-1',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: choiceEnabledBusiness,
          metadata: { reminderHoursBefore: 6 },
        },
      ],
    );

    const sent = await service.processDueReminders();

    expect(sent).toBe(3);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alex@test.com',
        text: expect.stringMatching(/6 hours/i),
      }),
    );
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reminder_6h', channel: 'email' }),
    );
  });

  it('sends sms and whatsapp reminders for 1-hour customer choice', async () => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-1h',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: choiceEnabledBusiness,
          metadata: { reminderHoursBefore: 1 },
        },
      ],
    );

    const sent = await service.processDueReminders();

    expect(sent).toBe(3);
    expect(smsService.send).toHaveBeenCalled();
    expect(whatsappService.sendBookingMessage).toHaveBeenCalled();
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reminder_1h', channel: 'sms' }),
    );
  });

  it('skips customer-chosen reminders when lead time is null or outside the window', async () => {
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-none',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: choiceEnabledBusiness,
          metadata: { reminderHoursBefore: null },
        },
        {
          id: 'book-later',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 12.5 * 60 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: choiceEnabledBusiness,
          metadata: { reminderHoursBefore: 6 },
        },
      ],
    );

    await service.processDueReminders();

    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('skips legacy 24h/1h windows when customer choice is enabled', async () => {
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockReminderQueries(
      [
        {
          id: 'book-legacy',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: choiceEnabledBusiness,
          metadata: {},
        },
      ],
      [],
      [],
    );

    await service.processDueReminders();

    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('uses legacy 24h reminders when customer choice is disabled', async () => {
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockReminderQueries(
      [
        {
          id: 'book-legacy-24',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: legacyBusiness,
          metadata: {},
        },
      ],
      [],
      [],
    );

    const sent = await service.processDueReminders();

    expect(sent).toBe(3);
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reminder_24h', channel: 'email' }),
    );
  });

  it('skips bookings without business or customer in customer-chosen flow', async () => {
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-no-business',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 60 * 60 * 1000),
          endTime: new Date(Date.now() + 90 * 60 * 1000),
          customer,
          business: null,
          metadata: { reminderHoursBefore: 1 },
        },
        {
          id: 'book-no-customer',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 60 * 60 * 1000),
          endTime: new Date(Date.now() + 90 * 60 * 1000),
          customer: null,
          business: choiceEnabledBusiness,
          metadata: { reminderHoursBefore: 1 },
        },
      ],
    );

    await service.processDueReminders();

    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('uses legacy 1h reminders when customer choice is disabled', async () => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    mockReminderQueries(
      [],
      [
        {
          id: 'book-legacy-1h',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: legacyBusiness,
          metadata: {},
        },
      ],
      [],
    );

    const sent = await service.processDueReminders();

    expect(sent).toBe(3);
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'reminder_1h', channel: 'email' }),
    );
  });

  it('skips channels when customer notification preferences are off', async () => {
    const startTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const optedOutCustomer = {
      ...customer,
      metadata: {
        notifications: {
          emailReminders: false,
          smsReminders: false,
          whatsappReminders: false,
        },
      },
    };
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-opted-out',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer: optedOutCustomer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: choiceEnabledBusiness,
          metadata: { reminderHoursBefore: 6 },
        },
      ],
    );

    const sent = await service.processDueReminders();

    expect(sent).toBe(0);
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('uses localized reminder email subject when business locale is hy', async () => {
    const startTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const hyBusiness = {
      ...choiceEnabledBusiness,
      settings: {
        ...choiceEnabledBusiness.settings,
        locale: 'hy',
      },
    };
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-hy',
          status: BookingStatus.CONFIRMED,
          startTime,
          endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: hyBusiness,
          metadata: { reminderHoursBefore: 6 },
        },
      ],
    );

    await service.processDueReminders();

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Հիշեցում'),
        text: expect.stringMatching(/6 ժամ/i),
      }),
    );
  });

  it('skips customer-chosen flow when business has choice disabled', async () => {
    mockReminderQueries(
      [],
      [],
      [
        {
          id: 'book-disabled-business',
          status: BookingStatus.CONFIRMED,
          startTime: new Date(Date.now() + 60 * 60 * 1000),
          endTime: new Date(Date.now() + 90 * 60 * 1000),
          customer,
          employee: { name: 'Jane' },
          service: { name: 'Facial' },
          business: legacyBusiness,
          metadata: { reminderHoursBefore: 1 },
        },
      ],
    );

    await service.processDueReminders();

    expect(emailService.send).not.toHaveBeenCalled();
  });
});
