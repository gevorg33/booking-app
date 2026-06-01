import { GiftCardDeliveryService } from './gift-card-delivery.service.js';

describe('GiftCardDeliveryService integration', () => {
  const giftCardRepo = { findOne: jest.fn(), save: jest.fn() };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };

  const service = new GiftCardDeliveryService(giftCardRepo as any, emailService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.save.mockImplementation(async (v) => v);
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
      business: { name: 'Glow Salon' },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-1');

    expect(emailService.send).toHaveBeenCalledTimes(2);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'friend@test.com' }),
    );
  });

  it('skips delivery when recipient email is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-2',
      deliveryMethod: 'digital',
      cardType: 'service',
      recipientEmail: null,
      purchaserEmail: null,
      serviceCredits: [{ serviceName: 'Facial', quantityRemaining: 1 }],
      business: { name: 'Glow' },
    });

    await service.deliverDigitalGiftCard('gc-2');
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('no-ops for non-digital cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({ id: 'gc-3', deliveryMethod: 'physical' });
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
      business: null,
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-5');
    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('us') }),
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
      business: { name: 'Glow Salon' },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-6');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Happy birthday!'),
      }),
    );
  });

  it('includes monetary balance lines when service credits are empty', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-7',
      deliveryMethod: 'digital',
      code: 'GCM-EMPTY',
      cardType: 'service',
      recipientEmail: 'friend@test.com',
      purchaserEmail: 'buyer@test.com',
      business: { name: 'Glow' },
      serviceCredits: [],
    });

    await service.deliverDigitalGiftCard('gc-7');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('GCM-EMPTY'),
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
      business: { name: 'Glow' },
      serviceCredits: [{ serviceName: 'Facial', quantityRemaining: 1 }],
    });

    await service.deliverDigitalGiftCard('gc-4');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Facial'),
      }),
    );
  });
});
