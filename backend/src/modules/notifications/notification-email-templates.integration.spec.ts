import { BookingStatus } from '../booking/entities/booking.entity.js';
import { GiftCardDeliveryService } from '../gift-cards/gift-card-delivery.service.js';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';
import { NotificationsService } from './notifications.service.js';
import {
  listResolvedEmailTemplates,
  renderBusinessEmailTemplate,
} from './notification-email-template.util.js';

describe('Notification email templates integration', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const templateService = new NotificationEmailTemplateService(businessRepo as any);

  const bookingRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const logRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }), isConfigured: true };
  const smsService = { send: jest.fn() };
  const whatsappService = { sendBookingMessage: jest.fn(), shouldSkipImmediateAfterConfirmation: jest.fn() };
  const whatsappIntegrationService = { resolveRuntimeConfig: jest.fn().mockReturnValue(null) };
  const configService = { get: jest.fn(() => 'https://app.test') };
  const notifications = new NotificationsService(
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

  const giftCardRepo = { findOne: jest.fn(), save: jest.fn() };
  const giftCardWhatsapp = { sendGiftCardMessage: jest.fn().mockResolvedValue({ ok: true }) };
  const giftCardDelivery = new GiftCardDeliveryService(
    giftCardRepo as any,
    emailService as any,
    giftCardWhatsapp as any,
    whatsappIntegrationService as any,
    configService as any,
  );

  const customer = {
    id: 'cust-1',
    name: 'Alex Customer',
    email: 'alex@test.com',
    metadata: { notifications: { emailReminders: true } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.save.mockImplementation(async (value) => value);
    bookingRepo.save.mockImplementation(async (value) => value);
    giftCardRepo.save.mockImplementation(async (value) => value);
  });

  it('persists tenant overrides and renders them for booking confirmations', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {},
    });

    await templateService.updateTemplate('biz-1', 'booking_confirmation', {
      subject: 'Welcome {{customerName}} to {{businessName}}',
      bodyText: 'Your {{serviceName}} is booked.',
      bodyHtml: '<p>{{serviceName}} confirmed</p>',
    });

    const saved = businessRepo.save.mock.calls[0][0];
    const rendered = renderBusinessEmailTemplate(saved.settings, 'booking_confirmation', {
      customerName: 'Alex',
      businessName: 'Glow Salon',
      serviceName: 'Facial',
      providerName: 'Jane',
      dateLabel: 'Today',
      timeLabel: '10:00',
      manageLinkText: '',
      manageLinkHtml: '',
      footerNote: '',
    });

    expect(rendered?.subject).toBe('Welcome Alex to Glow Salon');
    expect(rendered?.text).toContain('Facial is booked');
    expect(rendered?.html).toContain('Facial confirmed');
  });

  it('skips booking confirmation email when tenant disables the template', async () => {
    const business = {
      id: 'biz-1',
      name: 'Glow Salon',
      slug: 'glow',
      settings: {
        notifications: { sendConfirmationEmail: true, emailEnabled: true },
        emailTemplates: {
          templates: { booking_confirmation: { enabled: false } },
        },
      },
    };
    const booking = {
      id: 'b-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-05T10:00:00Z'),
      endTime: new Date('2026-06-05T10:30:00Z'),
      customer,
      employee: { name: 'Jane' },
      service: { name: 'Facial' },
      business,
      metadata: {},
    };

    bookingRepo.findOne.mockResolvedValue(booking);

    await notifications.sendBookingConfirmation('b-1');

    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('uses tenant grouped confirmation template when sending multi-appointment email', async () => {
    const business = {
      id: 'biz-1',
      name: 'Glow Salon',
      slug: 'glow',
      settings: {
        notifications: { sendConfirmationEmail: true, emailEnabled: true },
        emailTemplates: {
          templates: {
            booking_confirmation_grouped: {
              subject: 'All set {{customerName}} — {{appointmentCount}} visits',
              bodyText: 'Grouped list:\n{{appointmentsListText}}',
              bodyHtml: '<div>{{appointmentsListHtml}}</div>',
            },
          },
        },
      },
    };
    const bookings = [
      {
        id: 'b-1',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T14:00:00Z'),
        endTime: new Date('2026-06-03T14:30:00Z'),
        customer,
        employee: { name: 'Jane' },
        service: { name: 'Facial' },
        business,
        metadata: {},
      },
      {
        id: 'b-2',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-03T15:00:00Z'),
        endTime: new Date('2026-06-03T15:30:00Z'),
        customer,
        employee: { name: 'Jane' },
        service: { name: 'Massage' },
        business,
        metadata: {},
      },
    ];

    bookingRepo.findOne.mockResolvedValue(bookings[0]);
    bookingRepo.find.mockResolvedValue(bookings);

    await notifications.sendMultiAppointmentConfirmation(['b-1', 'b-2']);

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'All set Alex Customer — 2 visits',
        text: expect.stringContaining('Facial'),
        html: expect.stringContaining('Massage'),
      }),
    );
  });

  it('skips gift card recipient email when tenant disables the template', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-1',
      deliveryMethod: 'digital',
      code: 'GCM-DISABLED',
      cardType: 'monetary',
      balance: 50,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      purchaserEmail: 'buyer@test.com',
      business: {
        name: 'Glow Salon',
        slug: 'glow',
        settings: {
          emailTemplates: {
            templates: {
              gift_card_recipient: { enabled: false },
              gift_card_purchaser_receipt: { enabled: false },
            },
          },
        },
      },
      serviceCredits: [],
    });

    await giftCardDelivery.deliverDigitalGiftCard('gc-1');

    expect(emailService.send).not.toHaveBeenCalled();
    expect(giftCardRepo.save).not.toHaveBeenCalled();
  });

  it('uses tenant gift card template when delivering digitally', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-2',
      deliveryMethod: 'digital',
      code: 'GCM-CUSTOM',
      cardType: 'monetary',
      balance: 75,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      recipientName: 'Sam',
      purchaserName: 'Jane Buyer',
      business: {
        name: 'Glow Salon',
        slug: 'glow',
        settings: {
          emailTemplates: {
            templates: {
              gift_card_recipient: {
                subject: 'Gift from {{senderName}}',
                bodyText: 'Code {{giftCardCode}} for {{recipientName}}',
                bodyHtml: '<p>{{giftCardCode}}</p>',
              },
            },
          },
        },
      },
      serviceCredits: [],
    });

    await giftCardDelivery.deliverDigitalGiftCard('gc-2');

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Gift from Jane Buyer',
        text: expect.stringContaining('Code GCM-CUSTOM for Sam'),
        html: expect.stringContaining('GCM-CUSTOM'),
      }),
    );
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ fulfillmentStatus: 'delivered' }),
    );
  });

  it('lists Armenian default templates when business locale is hy', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: { locale: 'hy' },
    });

    const { templates } = await templateService.listTemplates('biz-1');
    const confirmation = templates.find((t) => t.key === 'booking_confirmation');

    expect(confirmation?.subject).toContain('Հաստատված');
    expect(confirmation?.bodyText).toContain('Բարև {{customerName}}');
    expect(confirmation?.isCustomized).toBe(false);
  });

  it('prefers tenant override over locale-specific defaults', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        locale: 'ru',
        emailTemplates: {
          templates: {
            booking_confirmation: {
              subject: 'Custom RU subject {{customerName}}',
            },
          },
        },
      },
    });

    const { templates } = await templateService.listTemplates('biz-1');
    const confirmation = templates.find((t) => t.key === 'booking_confirmation');

    expect(confirmation?.subject).toBe('Custom RU subject {{customerName}}');
    expect(confirmation?.isCustomized).toBe(true);
  });

  it('renders Russian default reminder copy from business locale', () => {
    const rendered = renderBusinessEmailTemplate(
      { locale: 'ru' },
      'booking_reminder',
      {
        customerName: 'Alex',
        businessName: 'Glow Salon',
        serviceName: 'Facial',
        providerName: 'Jane',
        dateLabel: '05.06.2026',
        timeLabel: '14:00–14:30',
        reminderLabel: '24 ч',
      },
    );

    expect(rendered?.subject).toContain('Напоминание');
    expect(rendered?.text).toContain('Glow Salon');
    expect(rendered?.text).toContain('24 ч');
  });

  it('sends localized confirmation email when business locale is ru', async () => {
    const business = {
      id: 'biz-1',
      name: 'Glow Salon',
      slug: 'glow',
      settings: {
        locale: 'ru',
        notifications: { sendConfirmationEmail: true, emailEnabled: true },
      },
    };
    const booking = {
      id: 'b-ru',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-05T10:00:00Z'),
      endTime: new Date('2026-06-05T10:30:00Z'),
      customer,
      employee: { name: 'Jane' },
      service: { name: 'Facial' },
      business,
      metadata: {},
    };

    bookingRepo.findOne.mockResolvedValue(booking);

    await notifications.sendBookingConfirmation('b-ru');

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Подтверждено'),
        text: expect.stringContaining('До встречи'),
      }),
    );
  });

  it('resets template to localized default after reset when locale is hy', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        locale: 'hy',
        emailTemplates: {
          templates: {
            booking_confirmation: { subject: 'Custom HY only' },
          },
        },
      },
    });

    const reset = await templateService.resetTemplate('biz-1', 'booking_confirmation');
    expect(reset.subject).toContain('Հաստատված');
    expect(reset.isCustomized).toBe(false);
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          emailTemplates: expect.objectContaining({ templates: {} }),
        }),
      }),
    );
  });

  it('listResolvedEmailTemplates uses hy defaults without API round-trip', () => {
    const templates = listResolvedEmailTemplates({ locale: 'hy' });
    const reminder = templates.find((t) => t.key === 'booking_reminder');
    expect(reminder?.subject).toContain('Հիշեցում');
  });
});
