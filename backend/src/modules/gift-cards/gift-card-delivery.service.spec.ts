import { GiftCardDeliveryService } from './gift-card-delivery.service.js';

describe('GiftCardDeliveryService integration', () => {
  const giftCardRepo = { findOne: jest.fn(), save: jest.fn() };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const whatsappService = {
    sendGiftCardMessage: jest.fn().mockResolvedValue({ ok: true }),
  };
  const whatsappIntegrationService = {
    resolveRuntimeConfig: jest.fn().mockReturnValue({
      templateGiftCard: 'gift_card_delivery',
      templateLanguage: 'en',
      giftCardBodyParamCount: 4,
    }),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };

  const service = new GiftCardDeliveryService(
    giftCardRepo as any,
    emailService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    configService as any,
  );

  const business = { name: 'Glow Salon', slug: 'glow-salon', settings: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.save.mockImplementation(async (v) => v);
    whatsappIntegrationService.resolveRuntimeConfig.mockReturnValue({
      templateGiftCard: 'gift_card_delivery',
      templateLanguage: 'en',
      giftCardBodyParamCount: 4,
    });
    whatsappService.sendGiftCardMessage.mockResolvedValue({ ok: true });
  });

  it('emails recipient and purchaser for digital delivery', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-1',
      deliveryMethod: 'digital',
      code: 'GCM-TEST123',
      cardType: 'monetary',
      balance: 75,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      purchaserEmail: 'buyer@test.com',
      personalMessage: 'Enjoy!',
      business,
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-1');

    expect(emailService.send).toHaveBeenCalledTimes(2);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'friend@test.com',
        subject: 'Your gift card from Buyer for Glow Salon',
        text: expect.stringContaining('https://app.test/book/glow-salon'),
        html: expect.stringContaining('https://app.test/book/glow-salon'),
      }),
    );
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@test.com',
        text: expect.stringContaining('/book/glow-salon/account'),
      }),
    );
  });

  it('sends WhatsApp when recipient phone is provided', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-wa',
      deliveryMethod: 'digital',
      code: 'GCM-WA123',
      cardType: 'monetary',
      balance: 50,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      recipientPhone: '+37499123456',
      recipientName: 'Alex',
      business,
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-wa');

    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        toPhone: '+37499123456',
        giftCardCode: 'GCM-WA123',
        senderName: 'Someone',
      }),
      expect.any(Object),
    );
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ fulfillmentStatus: 'delivered' }),
    );
  });

  it('delivers via WhatsApp only when email is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-wa-only',
      deliveryMethod: 'digital',
      code: 'GCM-PHONE',
      cardType: 'service',
      recipientEmail: null,
      recipientPhone: '+37499123456',
      recipientName: 'Sam',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [{ serviceName: 'Facial', quantityRemaining: 1 }],
    });

    await service.deliverDigitalGiftCard('gc-wa-only');

    expect(emailService.send).not.toHaveBeenCalled();
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalled();
    expect(giftCardRepo.save).toHaveBeenCalled();
  });

  it('skips delivery when recipient email and phone are missing', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-2',
      deliveryMethod: 'digital',
      cardType: 'service',
      recipientEmail: null,
      recipientPhone: null,
      purchaserEmail: null,
      serviceCredits: [{ serviceName: 'Facial', quantityRemaining: 1 }],
      business: { name: 'Glow', slug: 'glow', settings: {} },
    });

    await service.deliverDigitalGiftCard('gc-2');
    expect(emailService.send).not.toHaveBeenCalled();
    expect(whatsappService.sendGiftCardMessage).not.toHaveBeenCalled();
  });

  it('no-ops for non-digital cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-3',
      deliveryMethod: 'physical',
    });
    await service.deliverDigitalGiftCard('gc-3');
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('no-ops when gift card record is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await service.deliverDigitalGiftCard('missing');
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('sends only one email when purchaser and recipient match', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-5',
      deliveryMethod: 'digital',
      code: 'GCM-SELF',
      cardType: 'monetary',
      balance: 40,
      currency: 'USD',
      recipientEmail: 'self@test.com',
      purchaserEmail: 'self@test.com',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-5');
    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('Glow') }),
    );
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ fulfillmentStatus: 'delivered' }),
    );
  });

  it('includes personal message in monetary summary', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-6',
      deliveryMethod: 'digital',
      code: 'GCM-MSG',
      cardType: 'monetary',
      balance: 100,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      purchaserEmail: 'buyer@test.com',
      personalMessage: 'Happy birthday!',
      business,
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-6');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Happy birthday!'),
      }),
    );
  });

  it('includes service credits and expiry in recipient email', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-4',
      deliveryMethod: 'digital',
      code: 'GCS-FACIAL',
      cardType: 'service',
      recipientEmail: 'friend@test.com',
      purchaserEmail: 'buyer@test.com',
      expiresAt: new Date('2027-12-31T00:00:00.000Z'),
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [{ serviceName: 'Facial', quantityRemaining: 1 }],
    });

    await service.deliverDigitalGiftCard('gc-4');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Facial'),
      }),
    );
  });

  it('skips WhatsApp when integration is not configured', async () => {
    whatsappIntegrationService.resolveRuntimeConfig.mockReturnValueOnce(null);
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-no-wa',
      deliveryMethod: 'digital',
      code: 'GCM-NOWA',
      cardType: 'monetary',
      balance: 20,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      recipientPhone: '+37499123456',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-no-wa');
    expect(whatsappService.sendGiftCardMessage).not.toHaveBeenCalled();
    expect(giftCardRepo.save).toHaveBeenCalled();
  });

  it('does not mark delivered when WhatsApp fails and email is missing', async () => {
    whatsappService.sendGiftCardMessage.mockResolvedValue({
      ok: false,
      error: 'blocked',
    });
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-fail',
      deliveryMethod: 'digital',
      code: 'GCM-FAIL',
      cardType: 'monetary',
      balance: 20,
      currency: 'USD',
      recipientEmail: null,
      recipientPhone: '+37499123456',
      personalMessage: 'Enjoy',
      expiresAt: new Date('2027-12-31T00:00:00.000Z'),
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-fail');
    expect(giftCardRepo.save).not.toHaveBeenCalled();
  });

  it('still marks delivered when WhatsApp fails but email succeeds', async () => {
    whatsappService.sendGiftCardMessage.mockResolvedValue({
      ok: false,
      error: 'blocked',
    });
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-partial',
      deliveryMethod: 'digital',
      code: 'GCM-PARTIAL',
      cardType: 'monetary',
      balance: 30,
      currency: 'USD',
      recipientEmail: 'friend@test.com',
      recipientPhone: '+37499123456',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-partial');
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ fulfillmentStatus: 'delivered' }),
    );
  });

  it('uses WhatsApp fallback summary for service cards without credits', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-empty-credits',
      deliveryMethod: 'digital',
      code: 'GCS-EMPTY',
      cardType: 'service',
      recipientEmail: null,
      recipientPhone: '+37499123456',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-empty-credits');
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.stringContaining('https://app.test/book/glow'),
      }),
      expect.any(Object),
    );
  });

  it('includes account claim instructions for package and subscription cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-package',
      deliveryMethod: 'digital',
      code: 'GCP-PKG',
      cardType: 'package',
      recipientEmail: 'friend@test.com',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-package');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('/book/glow/account'),
        html: expect.stringContaining('Redeem in your account'),
      }),
    );

    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-sub',
      deliveryMethod: 'digital',
      code: 'GCU-SUB',
      cardType: 'subscription',
      recipientPhone: '+37499123456',
      recipientName: 'Sam',
      business: { name: 'Glow', slug: 'glow', settings: {} },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-sub');
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.stringContaining('https://app.test/book/glow/account'),
      }),
      expect.any(Object),
    );
  });
});
