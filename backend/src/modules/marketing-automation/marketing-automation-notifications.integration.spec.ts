import { BookingStatus } from '../booking/entities/booking.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { mergeMarketingAutomationSettings } from './marketing-automation.types.js';

describe('Marketing automation + notifications integration', () => {
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
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return undefined;
    }),
  };

  const notifications = new NotificationsService(
    bookingRepo as any,
    businessRepo as any,
    customerRepo as any,
    notificationLogRepo as any,
    emailService as any,
    smsService as any,
    whatsAppService as any,
    whatsappIntegrationService as any,
    configService as any,
  );

  const booking = {
    id: 'booking-1',
    status: BookingStatus.COMPLETED,
    metadata: { reviewToken: 'token-123' },
    startTime: new Date('2026-05-01T10:00:00Z'),
    endTime: new Date('2026-05-01T11:00:00Z'),
    customer: { email: 'client@test.com', phone: '+15551234567', metadata: {} },
    employee: { name: 'Alex' },
    service: { name: 'Cut' },
    business: {
      id: 'biz-1',
      slug: 'demo',
      name: 'Demo Salon',
      settings: {
        marketingAutomation: { postVisitReviewEnabled: true },
        notifications: { emailEnabled: true, smsEnabled: true },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notificationLogRepo.create.mockImplementation((v) => v);
    notificationLogRepo.save.mockResolvedValue(undefined);
    notificationLogRepo.findOne.mockResolvedValue(null);
    emailService.send.mockResolvedValue({ ok: true });
    smsService.send.mockResolvedValue({ ok: true });
    bookingRepo.findOne.mockResolvedValue(booking);
  });

  it('skips review request when postVisitReviewEnabled is false', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...booking,
      business: {
        ...booking.business,
        settings: {
          marketingAutomation: { postVisitReviewEnabled: false },
          notifications: { emailEnabled: true, smsEnabled: true },
        },
      },
    });

    await notifications.sendReviewRequest('booking-1');

    expect(emailService.send).not.toHaveBeenCalled();
    expect(smsService.send).not.toHaveBeenCalled();
  });

  it('sends review request when postVisitReviewEnabled is true', async () => {
    await notifications.sendReviewRequest('booking-1');

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'client@test.com' }),
    );
  });

  it('defaults postVisitReviewEnabled to true when unset', () => {
    expect(
      mergeMarketingAutomationSettings(undefined).postVisitReviewEnabled,
    ).toBe(true);
  });
});
