import { BookingStatus } from '../booking/entities/booking.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';

describe('Customer self-service business notifications integration', () => {
  const bookingRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const notificationLogRepo = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const emailService = { send: jest.fn() };
  const smsService = { send: jest.fn() };
  const whatsAppService = { sendTemplate: jest.fn() };
  const whatsappIntegrationService = {
    isConfigured: jest.fn().mockReturnValue(false),
  };
  const configService = { get: jest.fn(() => 'http://localhost:3000') };

  const notifications = new NotificationsService(
    bookingRepo as any,
    businessRepo as any,
    customerRepo as any,
    notificationLogRepo as any,
    { findOne: jest.fn() } as any,
    emailService as any,
    smsService as any,
    whatsAppService as any,
    whatsappIntegrationService as any,
    configService as any,
    { sendResultReady: jest.fn(async () => ({ delivered: [] })) } as any,
  );

  const baseBooking = {
    id: 'book-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-05-01T10:00:00Z'),
    endTime: new Date('2026-05-01T11:00:00Z'),
    customer: { name: 'Jane Doe', email: 'jane@example.com', metadata: {} },
    employee: { name: 'Alex' },
    service: { name: 'Haircut' },
    business: {
      id: 'biz-1',
      slug: 'salon',
      name: 'Demo Salon',
      email: 'owner@salon.test',
      settings: {
        notifications: {
          emailEnabled: true,
          notifyBusinessOnCustomerBookingChange: true,
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notificationLogRepo.create.mockImplementation((v) => v);
    notificationLogRepo.save.mockResolvedValue(undefined);
    notificationLogRepo.findOne.mockResolvedValue(null);
    emailService.send.mockResolvedValue({ ok: true });
    bookingRepo.findOne.mockResolvedValue(baseBooking);
  });

  it('emails business on customer cancellation', async () => {
    await notifications.sendBusinessCustomerBookingChange(
      'book-1',
      'cancelled',
    );

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@salon.test',
        subject: expect.stringContaining('cancellation'),
        text: expect.stringContaining('Jane Doe cancelled Haircut'),
      }),
    );
  });

  it('emails business on customer reschedule with old and new times', async () => {
    await notifications.sendBusinessCustomerBookingChange(
      'book-1',
      'rescheduled',
      {
        previousStartTime: '2026-05-01T10:00:00.000Z',
        newStartTime: '2026-05-03T14:00:00.000Z',
      },
    );

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('reschedule'),
        text: expect.stringMatching(/rescheduled.*from.*to/i),
      }),
    );
  });

  it('uses current booking time when reschedule details are omitted', async () => {
    await notifications.sendBusinessCustomerBookingChange(
      'book-1',
      'rescheduled',
    );

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('rescheduled Haircut from'),
      }),
    );
  });

  it('skips when business notification toggle is off', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      business: {
        ...baseBooking.business,
        settings: {
          notifications: {
            emailEnabled: true,
            notifyBusinessOnCustomerBookingChange: false,
          },
        },
      },
    });

    await notifications.sendBusinessCustomerBookingChange(
      'book-1',
      'cancelled',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('skips when email is disabled or business has no email', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      business: {
        ...baseBooking.business,
        email: null,
        settings: {
          notifications: {
            emailEnabled: true,
            notifyBusinessOnCustomerBookingChange: true,
          },
        },
      },
    });
    await notifications.sendBusinessCustomerBookingChange(
      'book-1',
      'cancelled',
    );
    expect(emailService.send).not.toHaveBeenCalled();

    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      business: {
        ...baseBooking.business,
        email: 'owner@salon.test',
        settings: {
          notifications: {
            emailEnabled: false,
            notifyBusinessOnCustomerBookingChange: true,
          },
        },
      },
    });
    await notifications.sendBusinessCustomerBookingChange(
      'book-1',
      'cancelled',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('no-ops when booking context is missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await notifications.sendBusinessCustomerBookingChange(
      'missing',
      'cancelled',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });
});
