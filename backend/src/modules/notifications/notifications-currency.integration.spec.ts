import { BookingStatus } from '../booking/entities/booking.entity.js';
import { GiftCardDeliveryService } from '../gift-cards/gift-card-delivery.service.js';
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

function createNotificationsHarness() {
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
  const smsService = {
    send: jest.fn().mockResolvedValue({ ok: true }),
    isConfigured: true,
  };
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
    businessRepo as any,
    customerRepo as any,
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

  return {
    service,
    bookingRepo,
    emailService,
    smsService,
    whatsappService,
    whatsappIntegrationService,
    logRepo,
  };
}

describe('Sprint 28 — notifications currency integration', () => {
  const customer = {
    id: 'cust-1',
    name: 'Alex Customer',
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

  function baseBusiness(overrides: Record<string, unknown> = {}) {
    return {
      id: 'biz-1',
      name: 'Glow Salon',
      slug: 'glow',
      settings: {
        currency: 'USD',
        notifications: {
          sendConfirmationEmail: true,
          emailEnabled: true,
          smsEnabled: true,
          whatsappEnabled: true,
          sendConfirmationWhatsapp: true,
          reminder24hEmail: true,
          reminder24hSms: true,
          reminder24hWhatsapp: true,
          allowCustomerReminderChoice: false,
        },
        ...overrides,
      },
    };
  }

  function baseBooking(
    business: ReturnType<typeof baseBusiness>,
    service: { price?: number | null; currency?: string | null; name?: string },
    metadata: Record<string, unknown> = {},
    paymentStatus = 'pending',
  ) {
    return {
      id: 'b-1',
      businessId: 'biz-1',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-06-05T10:00:00Z'),
      endTime: new Date('2026-06-05T10:30:00Z'),
      paymentStatus,
      customer,
      employee: { name: 'Jane Provider' },
      service: { name: 'Facial', ...service },
      business,
      metadata,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('booking confirmation channels', () => {
    it.each([
      {
        id: 'amd-tenant-default',
        settings: { currency: 'AMD' },
        service: { price: 12000, currency: null },
        paymentStatus: 'pending',
        emailPattern: /Price:.*(֏|AMD)/,
        smsPattern: /(֏|AMD)/,
      },
      {
        id: 'legacy-usd-on-eur-tenant',
        settings: { currency: 'EUR' },
        service: { price: 45, currency: 'USD' },
        paymentStatus: 'pending',
        emailPattern: /Price:.*\$/,
        smsPattern: /\$/,
      },
      {
        id: 'paid-gel-amount',
        settings: { currency: 'GEL' },
        service: { price: 100, currency: null },
        metadata: { amountPaid: 80 },
        paymentStatus: 'paid',
        emailPattern: /Amount paid:/,
        smsPattern: /Amount paid:|(₾|GEL)/,
      },
      {
        id: 'pricing-amount-due',
        settings: { currency: 'USD' },
        service: { price: 100, currency: 'USD' },
        metadata: { pricing: { amountDue: 35 } },
        paymentStatus: 'pending',
        emailPattern: /Price:.*35/,
        smsPattern: /35/,
      },
    ])(
      'includes formatted price in confirmation for $id',
      async ({
        settings,
        service,
        metadata = {},
        paymentStatus,
        emailPattern,
        smsPattern,
      }) => {
        const harness = createNotificationsHarness();
        const business = baseBusiness(settings);
        const booking = baseBooking(business, service, metadata, paymentStatus);
        harness.bookingRepo.findOne.mockResolvedValue(booking);

        await harness.service.sendBookingConfirmation('b-1');

        expect(harness.emailService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringMatching(emailPattern),
            html: expect.stringMatching(emailPattern),
          }),
        );
        const smsText = harness.smsService.send.mock.calls[0][1] as string;
        expect(smsText).toMatch(smsPattern);
        expect(harness.whatsappService.sendBookingMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            timeLabel: expect.stringMatching(smsPattern),
          }),
          expect.anything(),
        );
      },
    );

    it('omits price lines when booking has no resolvable amount', async () => {
      const harness = createNotificationsHarness();
      const business = baseBusiness({ currency: 'USD' });
      const booking = baseBooking(business, { price: null, currency: null });
      harness.bookingRepo.findOne.mockResolvedValue(booking);

      await harness.service.sendBookingConfirmation('b-1');

      const emailPayload = harness.emailService.send.mock.calls[0][0];
      expect(emailPayload.text).not.toMatch(/Price:/);
      expect(emailPayload.text).not.toMatch(/Amount paid:/);
      expect(emailPayload.html).not.toMatch(/Price:/);

      const smsText = harness.smsService.send.mock.calls[0][1] as string;
      expect(smsText).not.toMatch(/ · (?:\$|€|֏|AMD|GEL|RUB)/);
    });

    it('localizes confirmation price copy for Armenian business locale', async () => {
      const harness = createNotificationsHarness();
      const business = baseBusiness({
        currency: 'AMD',
        locale: 'hy',
      });
      const booking = baseBooking(business, { price: 5000, currency: null });
      harness.bookingRepo.findOne.mockResolvedValue(booking);

      await harness.service.sendBookingConfirmation('b-1');

      expect(harness.emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Գին'),
        }),
      );
    });

    it('localizes confirmation price copy for Russian business locale', async () => {
      const harness = createNotificationsHarness();
      const business = baseBusiness({
        currency: 'RUB',
        locale: 'ru',
      });
      const booking = baseBooking(business, { price: 2500, currency: null });
      harness.bookingRepo.findOne.mockResolvedValue(booking);

      await harness.service.sendBookingConfirmation('b-1');

      expect(harness.emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Цена'),
        }),
      );
    });
  });

  describe('booking reminder channels', () => {
    it('includes formatted price in 24h reminder email and SMS', async () => {
      const harness = createNotificationsHarness();
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const business = baseBusiness({ currency: 'EUR' });
      const booking = {
        ...baseBooking(business, { price: 60, currency: 'EUR' }),
        startTime,
        endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
      };

      harness.bookingRepo.createQueryBuilder
        .mockReturnValueOnce(queryBuilderMock([booking]))
        .mockReturnValueOnce(queryBuilderMock([]))
        .mockReturnValueOnce(queryBuilderMock([]));

      await harness.service.processDueReminders();

      expect(harness.emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching(/Price:.*(€|EUR)/),
          html: expect.stringMatching(/Price:.*(€|EUR)/),
        }),
      );
      const smsText = harness.smsService.send.mock.calls[0][1] as string;
      expect(smsText).toMatch(/(€|EUR)/);
    });

    it('uses amount paid label in reminder when booking is partially paid', async () => {
      const harness = createNotificationsHarness();
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const business = baseBusiness({ currency: 'USD' });
      const booking = {
        ...baseBooking(
          business,
          { price: 90, currency: 'USD' },
          {},
          'partially_paid',
        ),
        startTime,
        endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
      };

      harness.bookingRepo.createQueryBuilder
        .mockReturnValueOnce(queryBuilderMock([booking]))
        .mockReturnValueOnce(queryBuilderMock([]))
        .mockReturnValueOnce(queryBuilderMock([]));

      await harness.service.processDueReminders();

      expect(harness.emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Amount paid:'),
        }),
      );
    });
  });

  describe('grouped confirmation', () => {
    it('appends per-appointment prices in grouped confirmation email', async () => {
      const harness = createNotificationsHarness();
      const business = baseBusiness({ currency: 'USD' });
      const bookings = [
        {
          ...baseBooking(business, {
            price: 40,
            currency: 'USD',
            name: 'Facial',
          }),
          id: 'b-1',
          multiServiceGroupId: 'group-1',
        },
        {
          ...baseBooking(business, {
            price: 25,
            currency: 'USD',
            name: 'Manicure',
          }),
          id: 'b-2',
          multiServiceGroupId: 'group-1',
          startTime: new Date('2026-06-05T11:00:00Z'),
          endTime: new Date('2026-06-05T11:30:00Z'),
        },
      ];

      harness.bookingRepo.findOne.mockResolvedValue(bookings[0]);
      harness.bookingRepo.find.mockResolvedValue(bookings);

      await harness.service.sendMultiAppointmentConfirmation(['b-1', 'b-2']);

      const payload = harness.emailService.send.mock.calls[0][0];
      expect(payload.text).toContain('Facial');
      expect(payload.text).toContain('Manicure');
      expect(payload.text).toMatch(/\$40|\$25|40|25/);
    });
  });

  describe('email template placeholders', () => {
    it('renders default confirmation template with price line variables', () => {
      const rendered = renderBusinessEmailTemplate(
        { currency: 'USD' },
        'booking_confirmation',
        {
          customerName: 'Alex',
          businessName: 'Glow Salon',
          serviceName: 'Facial',
          providerName: 'Jane',
          dateLabel: 'Jun 5',
          timeLabel: '10:00',
          priceLineText: '\nPrice: $45',
          priceLineHtml: '<br/>Price: $45',
          manageLinkText: '',
          manageLinkHtml: '',
          footerNote: 'See you soon',
        },
      );

      expect(rendered?.text).toContain('Price: $45');
      expect(rendered?.html).toContain('Price: $45');
    });

    it('renders default reminder template with price line variables', () => {
      const rendered = renderBusinessEmailTemplate(
        { currency: 'EUR' },
        'booking_reminder',
        {
          customerName: 'Alex',
          businessName: 'Glow Salon',
          serviceName: 'Facial',
          providerName: 'Jane',
          dateLabel: 'Jun 5',
          timeLabel: '10:00',
          priceLineText: '\nPrice: €60',
          priceLineHtml: '<br/>Price: €60',
          reminderLabel: '24 hours',
        },
      );

      expect(rendered?.text).toContain('Price: €60');
      expect(rendered?.html).toContain('Price: €60');
    });
  });

  describe('gift card delivery currency', () => {
    const giftCardRepo = { findOne: jest.fn(), save: jest.fn() };
    const emailService = {
      send: jest.fn().mockResolvedValue({ ok: true }),
      isConfigured: true,
    };
    const giftCardWhatsapp = {
      sendGiftCardMessage: jest.fn().mockResolvedValue({ ok: true }),
    };
    const whatsappIntegrationService = {
      resolveRuntimeConfig: jest.fn().mockReturnValue(null),
    };
    const configService = { get: jest.fn(() => 'https://app.test') };
    const giftCardDelivery = new GiftCardDeliveryService(
      giftCardRepo as any,
      emailService as any,
      giftCardWhatsapp as any,
      whatsappIntegrationService as any,
      configService as any,
    );

    beforeEach(() => {
      jest.clearAllMocks();
      giftCardRepo.save.mockImplementation(async (value) => value);
    });

    it('delivers recipient email with formatted balance using tenant currency', async () => {
      giftCardRepo.findOne.mockResolvedValue({
        id: 'gc-1',
        deliveryMethod: 'digital',
        code: 'GCM-EUR',
        cardType: 'monetary',
        balance: 120,
        currency: 'EUR',
        recipientEmail: 'friend@test.com',
        recipientName: 'Sam',
        purchaserName: 'Jane',
        business: {
          name: 'Glow Salon',
          slug: 'glow',
          settings: { currency: 'EUR' },
        },
        serviceCredits: [],
      });

      await giftCardDelivery.deliverDigitalGiftCard('gc-1');

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringMatching(/Balance:.*(€|EUR)/),
        }),
      );
    });

    it('delivers purchaser receipt with formatted purchase amount', async () => {
      giftCardRepo.findOne.mockResolvedValue({
        id: 'gc-2',
        deliveryMethod: 'digital',
        code: 'GCM-BUY',
        cardType: 'monetary',
        balance: 100,
        purchaseAmount: 100,
        currency: 'USD',
        recipientEmail: 'friend@test.com',
        purchaserEmail: 'buyer@test.com',
        business: {
          name: 'Glow Salon',
          slug: 'glow',
          settings: { currency: 'USD' },
        },
        serviceCredits: [],
      });

      await giftCardDelivery.deliverDigitalGiftCard('gc-2');

      const calls = emailService.send.mock.calls.map((c) => c[0]);
      const receipt = calls.find((p) => p.text?.includes('Amount paid:'));
      expect(receipt).toBeDefined();
      expect(receipt!.text).toMatch(/Amount paid:.*\$/);
    });
  });
});
