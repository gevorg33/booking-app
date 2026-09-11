import { BookingStatus } from '../booking/entities/booking.entity.js';
import { createBookingManagerMock } from '../../common/utils/booking-manager.mock.js';
import { GiftCardDeliveryService } from '../gift-cards/gift-card-delivery.service.js';
import {
  buildWhatsAppGiftCardSummary,
  describeGiftCardValue,
} from '../gift-cards/gift-card-delivery-content.util.js';
import type { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { NotificationsService } from './notifications.service.js';
import { renderBusinessEmailTemplate } from './notification-email-template.util.js';

function queryBuilderMock(bookings: unknown[]) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(bookings),
  };
}

function createHarness() {
  const bookingRepo: Record<string, any> = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn().mockImplementation(async (value) => value),
    createQueryBuilder: jest.fn(),
  };
  // e2e-bug.471 — ensureBookingManageToken mints the manage token inside
  // bookingRepo.manager.transaction. Delegated to this spec's own findOne/save,
  // falling back to the "exists, no token yet" row these doubles use elsewhere.
  bookingRepo.manager = createBookingManagerMock({
    find: async (id) =>
      (await bookingRepo.findOne({ where: { id } })) ?? { id, metadata: {} },
    save: (booking) => bookingRepo.save(booking),
  });
  const logRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const smsService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const whatsappService = {
    sendBookingMessage: jest.fn().mockResolvedValue({ ok: true }),
    shouldSkipImmediateAfterConfirmation: jest.fn().mockReturnValue(false),
  };
  const whatsappIntegrationService = {
    resolveRuntimeConfig: jest.fn().mockReturnValue({ source: 'platform' }),
  };
  const configService = { get: jest.fn(() => 'https://app.test') };

  const service = new NotificationsService(
    bookingRepo as any,
    { findOne: jest.fn() } as any,
    { findOne: jest.fn() } as any,
    logRepo as any,
    { findOne: jest.fn() } as any,
    emailService as any,
    smsService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    configService as any,
    {
      sendResultReady: jest.fn(async () => ({ delivered: [] })),
      sendTransactionalPush: jest.fn().mockResolvedValue({ ok: false }),
    } as any,
  );

  return { service, bookingRepo, emailService, smsService, whatsappService };
}

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

const FORMAT_MATRIX = [
  {
    id: 'us-12h',
    settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
    datePattern: /06\/04\/2026/,
    timePattern: /10:00\s*AM/i,
  },
  {
    id: 'iso-24h',
    settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
    datePattern: /2026-06-04/,
    timePattern: /10:00–11:00/,
  },
  {
    id: 'european-default',
    settings: {},
    datePattern: /04\/06\/2026/,
    timePattern: /10:00–11:00/,
  },
] as const;

function notificationSettings() {
  return {
    sendConfirmationEmail: true,
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    sendConfirmationWhatsapp: true,
    reminder24hEmail: true,
    reminder24hSms: true,
    reminder24hWhatsapp: true,
  };
}

function bookingFor(
  settings: Record<string, unknown>,
  startTime: Date,
  status: BookingStatus = BookingStatus.CONFIRMED,
) {
  const business = {
    id: 'biz-1',
    name: 'Glow Salon',
    slug: 'glow',
    email: 'owner@glow.test',
    settings: {
      notifications: {
        ...notificationSettings(),
        notifyBusinessOnCustomerBookingChange: true,
      },
      ...settings,
    },
  };
  return {
    id: 'b-1',
    businessId: 'biz-1',
    status,
    startTime,
    endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
    customer,
    employee: { name: 'Sam' },
    service: { name: 'Haircut', price: 40, currency: 'USD' },
    business,
    paymentStatus: 'pending',
    metadata: {},
  };
}

describe('Sprint 34 — fmt-1.5 notification date format integration', () => {
  const startTime = new Date('2026-06-04T10:00:00.000Z');

  describe.each(FORMAT_MATRIX)(
    'booking confirmation — $id',
    ({ settings, datePattern, timePattern }) => {
      it('email, SMS, and WhatsApp use business date/time formats', async () => {
        const harness = createHarness();
        harness.bookingRepo.findOne.mockResolvedValue(
          bookingFor(settings, startTime),
        );

        await harness.service.sendBookingConfirmation('b-1');

        const emailPayload = harness.emailService.send.mock.calls[0][0];
        expect(emailPayload.text).toMatch(datePattern);
        expect(emailPayload.text).toMatch(timePattern);

        const smsText = harness.smsService.send.mock.calls[0][1] as string;
        expect(smsText).toMatch(datePattern);
        expect(smsText).toMatch(timePattern);

        expect(harness.whatsappService.sendBookingMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            dateLabel: expect.stringMatching(datePattern),
            timeLabel: expect.stringMatching(timePattern),
          }),
          expect.anything(),
        );
      });
    },
  );

  describe.each(FORMAT_MATRIX)(
    'booking cancellation — $id',
    ({ settings, datePattern, timePattern }) => {
      it('email, SMS, and WhatsApp use business date/time formats', async () => {
        const harness = createHarness();
        harness.bookingRepo.findOne.mockResolvedValue(
          bookingFor(settings, startTime, BookingStatus.CANCELLED),
        );

        await harness.service.sendBookingCancellation(
          'b-1',
          'Schedule conflict',
        );

        const emailPayload = harness.emailService.send.mock.calls[0][0];
        expect(emailPayload.text).toMatch(datePattern);
        expect(emailPayload.text).toMatch(timePattern);

        const smsText = harness.smsService.send.mock.calls[0][1] as string;
        expect(smsText).toMatch(datePattern);
        expect(smsText).toMatch(timePattern);

        expect(harness.whatsappService.sendBookingMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            dateLabel: expect.stringMatching(datePattern),
            timeLabel: expect.stringMatching(timePattern),
            cancelReason: 'Schedule conflict',
          }),
          expect.anything(),
        );
      });
    },
  );

  it.each([
    {
      id: '24h-reminder-email',
      settings: {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
      },
      datePattern: /\d{2}\/\d{2}\/\d{4}/,
      timePattern: /AM|PM/i,
    },
    {
      id: 'iso-reminder-sms',
      settings: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        currency: 'USD',
      },
      datePattern: /2026-\d{2}-\d{2}/,
      timePattern: /\d{2}:\d{2}–\d{2}:\d{2}/,
    },
  ])(
    '$id uses business formats in reminder channels',
    async ({ settings, datePattern, timePattern }) => {
      const harness = createHarness();
      const reminderStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const booking = bookingFor(settings, reminderStart);
      harness.bookingRepo.createQueryBuilder
        .mockReturnValueOnce(queryBuilderMock([booking]))
        .mockReturnValueOnce(queryBuilderMock([]))
        .mockReturnValueOnce(queryBuilderMock([]));

      await harness.service.processDueReminders();

      const emailPayload = harness.emailService.send.mock.calls[0][0];
      expect(emailPayload.text).toMatch(datePattern);
      expect(emailPayload.text).toMatch(timePattern);

      const smsText = harness.smsService.send.mock.calls[0][1] as string;
      expect(smsText).toMatch(datePattern);
      expect(smsText).toMatch(timePattern);
    },
  );

  it('grouped confirmation email lists each appointment with business formats', async () => {
    const harness = createHarness();
    const business = {
      id: 'biz-1',
      name: 'Glow Salon',
      slug: 'glow',
      settings: {
        notifications: notificationSettings(),
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        publicBooking: {
          customerSelfService: { allowCancel: true, allowReschedule: true },
        },
      },
    };
    const bookings = [
      {
        id: 'b-1',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-04T10:00:00.000Z'),
        endTime: new Date('2026-06-04T11:00:00.000Z'),
        customer,
        employee: { name: 'Sam' },
        service: { name: 'Haircut', price: 40, currency: 'USD' },
        business,
        metadata: {},
      },
      {
        id: 'b-2',
        businessId: 'biz-1',
        multiServiceGroupId: 'group-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-05T14:00:00.000Z'),
        endTime: new Date('2026-06-05T15:00:00.000Z'),
        customer,
        employee: { name: 'Sam' },
        service: { name: 'Color', price: 80, currency: 'USD' },
        business,
        metadata: {},
      },
    ];
    harness.bookingRepo.findOne.mockResolvedValue(bookings[0]);
    harness.bookingRepo.find.mockResolvedValue(bookings);

    await harness.service.sendMultiAppointmentConfirmation(['b-1', 'b-2']);

    const emailPayload = harness.emailService.send.mock.calls[0][0];
    expect(emailPayload.text).toMatch(/06\/04\/2026/);
    expect(emailPayload.text).toMatch(/10:00\s*AM/i);
    expect(emailPayload.text).toMatch(/06\/05\/2026/);
    expect(emailPayload.text).toMatch(/2:00\s*PM|14:00/i);
  });

  it.each([
    {
      change: 'cancelled' as const,
      settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
      subjectFragment: 'cancellation',
      bodyPattern: /cancelled Haircut scheduled for 2026-06-04 at 10:00–11:00/,
    },
    {
      change: 'rescheduled' as const,
      settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
      subjectFragment: 'reschedule',
      bodyPattern:
        /rescheduled Haircut from 06\/04\/2026.*to 06\/06\/2026.*2:00\s*PM/i,
    },
  ])(
    'business owner email on customer $change uses business formats',
    async ({ change, settings, subjectFragment, bodyPattern }) => {
      const harness = createHarness();
      harness.bookingRepo.findOne.mockResolvedValue(
        bookingFor(settings, startTime),
      );

      await harness.service.sendBusinessCustomerBookingChange(
        'b-1',
        change,
        change === 'rescheduled'
          ? {
              previousStartTime: '2026-06-04T10:00:00.000Z',
              newStartTime: '2026-06-06T14:00:00.000Z',
            }
          : undefined,
      );

      const emailPayload = harness.emailService.send.mock.calls[0][0];
      expect(emailPayload.to).toBe('owner@glow.test');
      expect(emailPayload.subject).toMatch(new RegExp(subjectFragment, 'i'));
      expect(emailPayload.text).toMatch(bodyPattern);
    },
  );

  describe('gift card delivery formats', () => {
    const expiry = new Date('2027-06-01T00:00:00.000Z');

    it.each([
      {
        id: 'us-expiry',
        settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '24h' },
        expiryLabel: '06/01/2027',
      },
      {
        id: 'iso-expiry',
        settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
        expiryLabel: '2027-06-01',
      },
      {
        id: 'default-expiry',
        settings: {},
        expiryLabel: '01/06/2027',
      },
    ])(
      '$id — recipient email and WhatsApp use business expiry format',
      async ({ settings, expiryLabel }) => {
        const giftCardRepo = {
          findOne: jest.fn(),
          save: jest.fn().mockImplementation(async (value) => value),
        };
        const emailService = {
          send: jest.fn().mockResolvedValue({ ok: true }),
        };
        const whatsappService = {
          sendGiftCardMessage: jest.fn().mockResolvedValue({ ok: true }),
        };
        const whatsappIntegrationService = {
          resolveRuntimeConfig: jest
            .fn()
            .mockReturnValue({ source: 'platform' }),
        };
        const delivery = new GiftCardDeliveryService(
          giftCardRepo as any,
          emailService as any,
          whatsappService as any,
          whatsappIntegrationService as any,
          { get: jest.fn(() => 'https://app.test') } as any,
        );

        giftCardRepo.findOne.mockResolvedValue({
          id: 'gc-1',
          code: 'GIFT-1',
          cardType: 'monetary',
          deliveryMethod: 'digital',
          balance: 50,
          currency: 'USD',
          recipientEmail: 'friend@test.com',
          recipientPhone: '+15551230000',
          business: {
            name: 'Glow Salon',
            slug: 'glow',
            settings,
          },
          serviceCredits: [],
          expiresAt: expiry,
        });

        await delivery.deliverDigitalGiftCard('gc-1');

        const lines = describeGiftCardValue({
          cardType: 'monetary',
          code: 'GIFT-1',
          balance: 50,
          currency: 'USD',
          expiresAt: expiry,
          business: {
            name: 'Glow Salon',
            settings,
          },
          serviceCredits: [],
        } as GiftCard);
        expect(lines.join('\n')).toContain(`Expires: ${expiryLabel}`);

        const summary = buildWhatsAppGiftCardSummary(
          {
            cardType: 'monetary',
            code: 'GIFT-1',
            balance: 50,
            currency: 'USD',
            expiresAt: expiry,
            business: {
              name: 'Glow Salon',
              slug: 'glow',
              settings,
            },
            serviceCredits: [],
          } as GiftCard,
          null,
        );
        expect(summary).toContain(expiryLabel);

        expect(whatsappService.sendGiftCardMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            summary: expect.stringMatching(new RegExp(expiryLabel)),
          }),
          expect.anything(),
        );
      },
    );
  });

  it('reminder template render receives business-formatted date labels', () => {
    const rendered = renderBusinessEmailTemplate(
      { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
      'booking_reminder',
      {
        customerName: 'Alex',
        businessName: 'Glow Salon',
        serviceName: 'Haircut',
        providerName: 'Sam',
        dateLabel: '06/04/2026',
        timeLabel: '10:00 AM–11:00 AM',
        reminderLabel: '24 hours',
      },
    );
    expect(rendered?.text).toContain('06/04/2026');
    expect(rendered?.text).toMatch(/10:00\s*AM/i);
  });

  it('cancellation template render receives business-formatted date labels', () => {
    const rendered = renderBusinessEmailTemplate(
      { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
      'booking_cancellation',
      {
        customerName: 'Alex',
        businessName: 'Glow Salon',
        serviceName: 'Haircut',
        dateLabel: '2026-06-04',
        timeLabel: '10:00–11:00',
        cancelReason: 'Schedule conflict',
      },
    );
    expect(rendered?.text).toContain('2026-06-04');
    expect(rendered?.text).toMatch(/10:00–11:00/);
  });
});
