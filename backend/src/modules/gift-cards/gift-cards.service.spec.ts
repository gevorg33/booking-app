import { NotFoundException } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service.js';

describe('GiftCardsService', () => {
  const giftCardRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const creditRepo = { find: jest.fn(), save: jest.fn(), create: jest.fn() };
  const redemptionRepo = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const expirationAuditRepo = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const planEntitlements = {
    assertFeature: jest.fn().mockResolvedValue(undefined),
  };

  const service = new GiftCardsService(
    giftCardRepo as any,
    creditRepo as any,
    redemptionRepo as any,
    expirationAuditRepo as any,
    planEntitlements as any,
  );

  const baseCard = {
    id: 'gc-1',
    businessId: 'biz-1',
    code: 'GCM-ABCD1234',
    cardType: 'monetary',
    initialBalance: 50,
    balance: 50,
    currency: 'USD',
    expiresAt: null,
    isActive: true,
    codeRevealed: true,
    serviceCredits: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.create.mockImplementation((v) => v);
    giftCardRepo.save.mockImplementation(async (v) => ({ ...baseCard, ...v }));
    creditRepo.create.mockImplementation((v) => v);
    creditRepo.save.mockImplementation(async (v) => v);
    redemptionRepo.create.mockImplementation((v) => v);
    redemptionRepo.save.mockImplementation(async (v) => v);
    expirationAuditRepo.create.mockImplementation((v) => v);
    expirationAuditRepo.save.mockImplementation(async (v) => v);
    expirationAuditRepo.find.mockResolvedValue([]);
  });

  it('creates typed monetary gift card codes', async () => {
    const created = await service.create('biz-1', {
      amount: 50,
      cardType: 'service',
    });
    expect(created.code).toMatch(/^GCS-/);
  });

  it('redeems partial monetary balance and keeps card active', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 50 });
    giftCardRepo.save.mockImplementation(async (v) => v);

    const result = await service.redeem(
      'biz-1',
      'GCM-ABCD1234',
      30,
      'booking-1',
    );
    expect(result.balance).toBe(20);
    expect(result.isActive).toBe(true);
    expect(redemptionRepo.save).toHaveBeenCalled();
  });

  it('deactivates monetary card when balance reaches zero', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 10 });
    giftCardRepo.save.mockImplementation(async (v) => v);
    const result = await service.redeem('biz-1', 'GCM-ABCD1234', 10);
    expect(result.balance).toBe(0);
    expect(result.isActive).toBe(false);
  });

  it('redeems one service credit from bundle card', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'bundle',
      code: 'GCB-BUNDLE1',
      balance: 0,
      serviceCredits: [
        {
          id: 'c1',
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          quantityRemaining: 1,
          quantityTotal: 1,
        },
      ],
    });
    giftCardRepo.save.mockImplementation(async (v) => v);

    const result = await service.redeemServiceCredit(
      'biz-1',
      'GCB-BUNDLE1',
      'svc-1',
      'booking-1',
    );
    expect(result.isActive).toBe(false);
    expect(creditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantityRemaining: 0 }),
    );
  });

  it('rejects hidden codes and expired cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      codeRevealed: false,
    });
    await expect(service.validate('biz-1', 'GCM-ABCD1234')).rejects.toThrow(
      'not yet active',
    );

    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    await expect(service.validate('biz-1', 'GCM-ABCD1234')).rejects.toThrow(
      'expired',
    );
  });

  it('returns balance view with masked code when hidden', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      codeRevealed: false,
    });
    await expect(
      service.getBalanceView('biz-1', 'GCM-ABCD1234'),
    ).resolves.toMatchObject({
      code: '****',
    });
  });

  it('rejects missing cards', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(
      service.validate('biz-1', 'GCM-MISSING'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.redeem('biz-1', 'GCM-MISSING', 10),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists gift cards and redemption history', async () => {
    giftCardRepo.find.mockResolvedValue([baseCard]);
    redemptionRepo.find.mockResolvedValue([{ id: 'r1', amount: 10 }]);
    await expect(service.list('biz-1')).resolves.toHaveLength(1);
    await expect(service.listRedemptions('gc-1')).resolves.toHaveLength(1);
  });

  it('rejects monetary redeem on service card', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'service',
      serviceCredits: [{ serviceId: 'svc-1', quantityRemaining: 1 }],
    });
    await expect(service.redeem('biz-1', 'GCS-123', 10)).rejects.toThrow(
      'service credit',
    );
  });

  it('validates service credits for matching and exhausted cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'service',
      code: 'GCS-SVC',
      serviceCredits: [{ serviceId: 'svc-1', quantityRemaining: 0 }],
    });
    await expect(service.validate('biz-1', 'GCS-SVC', 'svc-1')).rejects.toThrow(
      'no remaining credit',
    );
    await expect(service.validate('biz-1', 'GCS-SVC')).rejects.toThrow(
      'no remaining service credits',
    );
  });

  it('rejects redeem above balance and missing service credit', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 5 });
    await expect(service.redeem('biz-1', 'GCM-ABCD1234', 10)).rejects.toThrow(
      'Insufficient',
    );

    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'service',
      serviceCredits: [{ serviceId: 'svc-1', quantityRemaining: 1 }],
    });
    await expect(
      service.redeemServiceCredit('biz-1', 'GCS-123', 'svc-2'),
    ).rejects.toThrow('no remaining credit');
  });

  it('rejects monetary cards with zero balance', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 0 });
    await expect(service.validate('biz-1', 'GCM-ABCD1234')).rejects.toThrow(
      'no balance',
    );
  });

  it('routes package and subscription cards to account claim instead of checkout', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'package',
      code: 'GCP-PKG',
      codeRevealed: true,
      claimedAt: null,
      serviceCredits: [],
    });
    await expect(service.validate('biz-1', 'GCP-PKG')).rejects.toThrow(
      'Claim this gift card from your account',
    );

    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'subscription',
      code: 'GCU-SUB',
      codeRevealed: true,
      isActive: true,
      claimedAt: new Date(),
      serviceCredits: [],
    });
    await expect(service.validate('biz-1', 'GCU-SUB')).rejects.toThrow(
      'already been claimed',
    );
  });

  it('throws when service credit row is missing after validation', async () => {
    jest.spyOn(service, 'validate').mockResolvedValue({
      ...baseCard,
      cardType: 'service',
      serviceCredits: [],
    } as any);
    await expect(
      service.redeemServiceCredit('biz-1', 'GCS-123', 'svc-1'),
    ).rejects.toThrow('No service credit available');
    jest.restoreAllMocks();
  });

  it('throws when balance view target is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getBalanceView('biz-1', 'GCM-MISSING'),
    ).rejects.toThrow('not found');
  });

  it('returns balance view with service credits and rejects monetary service redeem', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'bundle',
      code: 'GCB-BUNDLE',
      serviceCredits: [
        {
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          quantityRemaining: 2,
          quantityTotal: 2,
        },
      ],
    });
    await expect(
      service.getBalanceView('biz-1', 'GCB-BUNDLE'),
    ).resolves.toMatchObject({
      serviceCredits: [
        expect.objectContaining({
          serviceName: 'Haircut',
          quantityRemaining: 2,
        }),
      ],
    });

    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 50 });
    await expect(
      service.redeemServiceCredit('biz-1', 'GCM-ABCD1234', 'svc-1'),
    ).rejects.toThrow('Monetary gift cards');
  });

  it('creates admin gift card with expiration and purchaser', async () => {
    const created = await service.create('biz-1', {
      amount: 25,
      expiresAt: '2027-01-01T00:00:00.000Z',
      purchaserCustomerId: 'cust-1',
    });
    expect(created.expiresAt).toEqual(new Date('2027-01-01T00:00:00.000Z'));
  });

  it('keeps bundle card active when credits remain after partial redeem', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      cardType: 'bundle',
      code: 'GCB-MULTI',
      serviceCredits: [
        {
          id: 'c1',
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          quantityRemaining: 2,
          quantityTotal: 2,
        },
      ],
    });
    giftCardRepo.save.mockImplementation(async (v) => v);
    const result = await service.redeemServiceCredit(
      'biz-1',
      'GCB-MULTI',
      'svc-1',
    );
    expect(result.isActive).toBe(true);
  });

  it('updates expiration, writes audit, and skips no-op changes', async () => {
    const previous = new Date('2027-06-01T23:59:59.999Z');
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      expiresAt: previous,
    });
    giftCardRepo.save.mockImplementation(async (v) => v);

    const updated = await service.updateExpiration(
      'biz-1',
      'gc-1',
      { expiresAt: '2028-12-31', note: 'Customer request' },
      'admin-1',
    );
    expect(updated.expiresAt).toEqual(new Date('2028-12-31T23:59:59.999Z'));
    expect(expirationAuditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'set',
        adminUserId: 'admin-1',
        note: 'Customer request',
        previousExpiresAt: previous,
      }),
    );

    jest.clearAllMocks();
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      expiresAt: updated.expiresAt,
    });
    const unchanged = await service.updateExpiration(
      'biz-1',
      'gc-1',
      { expiresAt: '2028-12-31' },
      'admin-1',
    );
    expect(expirationAuditRepo.save).not.toHaveBeenCalled();
    expect(unchanged.expiresAt).toEqual(updated.expiresAt);
  });

  it('extends and clears expiration with audit trail', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, expiresAt: null });
    giftCardRepo.save.mockImplementation(async (v) => v);

    await service.updateExpiration(
      'biz-1',
      'gc-1',
      { extendMonths: 3 },
      'admin-2',
    );
    expect(expirationAuditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'extend', adminUserId: 'admin-2' }),
    );

    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      expiresAt: new Date('2028-01-01T00:00:00.000Z'),
    });
    await service.updateExpiration(
      'biz-1',
      'gc-1',
      { expiresAt: null },
      'admin-2',
    );
    expect(expirationAuditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'clear', newExpiresAt: null }),
    );
  });

  it('lists expiration audit entries', async () => {
    expirationAuditRepo.find.mockResolvedValue([
      { id: 'audit-1', action: 'set' },
    ]);
    await expect(service.listExpirationAudit('gc-1')).resolves.toHaveLength(1);
  });

  it('rejects expiration update for missing card', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateExpiration(
        'biz-1',
        'missing',
        { expiresAt: '2028-01-01' },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
