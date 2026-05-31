import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service.js';

describe('GiftCardsService', () => {
  const giftCardRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const service = new GiftCardsService(giftCardRepo as any);

  const baseCard = {
    id: 'gc-1',
    businessId: 'biz-1',
    code: 'GC-ABCD1234',
    initialBalance: 50,
    balance: 50,
    currency: 'USD',
    expiresAt: null,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.create.mockImplementation((v) => v);
    giftCardRepo.save.mockImplementation(async (v) => ({ ...baseCard, ...v }));
  });

  it('lists active gift cards for a business', async () => {
    giftCardRepo.find.mockResolvedValue([baseCard]);
    await expect(service.list('biz-1')).resolves.toEqual([baseCard]);
    expect(giftCardRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1', isActive: true } }),
    );
  });

  it('creates a gift card without expiration', async () => {
    const created = await service.create('biz-1', { amount: 50, currency: 'eur' });
    expect(created.code).toMatch(/^GC-/);
    expect(created.initialBalance).toBe(50);
    expect(created.balance).toBe(50);
    expect(created.currency).toBe('eur');
    expect(created.expiresAt).toBeUndefined();
  });

  it('creates a gift card with expiration date', async () => {
    const expiresAt = '2026-06-30T23:59:59.999Z';
    const created = await service.create('biz-1', {
      amount: 75,
      currency: 'USD',
      expiresAt,
      purchaserCustomerId: 'cust-1',
    });

    expect(created.expiresAt).toEqual(new Date(expiresAt));
    expect(created.purchaserCustomerId).toBe('cust-1');
  });

  it('validates an active gift card with balance', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard });
    const card = await service.validate('biz-1', ' gc-abcd1234 ');
    expect(card.code).toBe('GC-ABCD1234');
  });

  it('rejects expired gift cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    await expect(service.validate('biz-1', 'GC-ABCD1234')).rejects.toThrow('Gift card expired');
  });

  it('accepts gift cards before expiration', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await expect(service.validate('biz-1', 'GC-ABCD1234')).resolves.toBeTruthy();
  });

  it('rejects missing and zero-balance gift cards', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(service.validate('biz-1', 'GC-MISSING')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 0 });
    await expect(service.validate('biz-1', 'GC-ABCD1234')).rejects.toThrow('no balance');
  });

  it('redeems gift card balance and deactivates card', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 50 });
    giftCardRepo.save.mockImplementation(async (v) => v);

    const result = await service.redeem('biz-1', 'GC-ABCD1234', 30);
    expect(result.balance).toBe(20);
    expect(result.isActive).toBe(false);
  });

  it('rejects redeem when amount exceeds balance', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 10 });
    await expect(service.redeem('biz-1', 'GC-ABCD1234', 20)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
