import { BadRequestException } from '@nestjs/common';
import { GiftCardClaimService } from './gift-card-claim.service.js';

describe('GiftCardClaimService', () => {
  const giftCardRepo = { findOne: jest.fn(), save: jest.fn() };
  const packagesService = {
    assertPackageBookable: jest.fn(),
    createPackagePurchase: jest.fn(),
  };
  const subscriptionsService = { assignSubscription: jest.fn() };

  const service = new GiftCardClaimService(
    giftCardRepo as any,
    packagesService as any,
    subscriptionsService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.save.mockImplementation(async (card) => card);
  });

  it('claims a package gift card for the customer', async () => {
    const card = {
      id: 'gc-1',
      businessId: 'biz-1',
      code: 'GCP-ABC',
      cardType: 'package',
      packageId: 'pkg-1',
      purchaseAmount: 120,
      currency: 'USD',
      isActive: true,
      codeRevealed: true,
      claimedAt: null,
    };
    giftCardRepo.findOne.mockResolvedValue(card);
    packagesService.assertPackageBookable.mockResolvedValue({ id: 'pkg-1' });
    packagesService.createPackagePurchase.mockResolvedValue({
      id: 'purchase-1',
    });

    const result = await service.claimByCode('biz-1', 'GCP-ABC', 'cust-1');

    expect(result.packagePurchaseId).toBe('purchase-1');
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        claimedByCustomerId: 'cust-1',
        isActive: false,
      }),
    );
  });

  it('claims a subscription gift card for the customer', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-2',
      businessId: 'biz-1',
      code: 'GCU-XYZ',
      cardType: 'subscription',
      subscriptionPlanId: 'plan-1',
      purchaseAmount: 80,
      currency: 'USD',
      isActive: true,
      codeRevealed: true,
      claimedAt: null,
    });
    subscriptionsService.assignSubscription.mockResolvedValue({ id: 'sub-1' });

    const result = await service.claimByCode('biz-1', 'GCU-XYZ', 'cust-1');

    expect(result.subscriptionId).toBe('sub-1');
    expect(subscriptionsService.assignSubscription).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      'plan-1',
      expect.objectContaining({ pricePaid: 80, currency: 'USD' }),
    );
  });

  it('rejects already claimed gift cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-3',
      cardType: 'package',
      packageId: 'pkg-1',
      isActive: false,
      codeRevealed: true,
      claimedAt: new Date(),
    });

    await expect(
      service.claimByCode('biz-1', 'GCP-DONE', 'cust-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inactive gift cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-4',
      cardType: 'package',
      packageId: 'pkg-1',
      isActive: false,
      codeRevealed: true,
      claimedAt: null,
    });

    await expect(
      service.claimByCode('biz-1', 'GCP-INACTIVE', 'cust-1'),
    ).rejects.toThrow('no longer active');
  });

  it('rejects claim when card is not found by code', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(
      service.claimByCode('biz-1', 'GCP-NOPE', 'cust-1'),
    ).rejects.toThrow('not found');
  });

  it('rejects monetary gift cards on account claim', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-monetary',
      cardType: 'monetary',
      isActive: true,
      codeRevealed: true,
      balance: 50,
    });

    await expect(
      service.claimByCode('biz-1', 'GCM-CASH', 'cust-1'),
    ).rejects.toThrow('Monetary gift cards are redeemed at booking checkout');
  });

  it('links a service gift card to the customer account without deactivating it', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-svc',
      businessId: 'biz-1',
      code: 'GCS-FACIAL',
      cardType: 'service',
      isActive: true,
      codeRevealed: true,
      claimedAt: null,
      claimedByCustomerId: null,
      serviceCredits: [
        { serviceId: 'svc-1', quantityRemaining: 1, quantityTotal: 1 },
      ],
    });

    const result = await service.claimByCode('biz-1', 'GCS-FACIAL', 'cust-1');

    expect(result.cardType).toBe('service');
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        claimedByCustomerId: 'cust-1',
        isActive: true,
      }),
    );
  });

  it('links a bundle gift card to the customer account', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-bundle',
      businessId: 'biz-1',
      code: 'GCB-DUO',
      cardType: 'bundle',
      isActive: true,
      codeRevealed: true,
      claimedAt: null,
      serviceCredits: [
        { serviceId: 'svc-1', quantityRemaining: 1, quantityTotal: 1 },
        { serviceId: 'svc-2', quantityRemaining: 1, quantityTotal: 1 },
      ],
    });

    const result = await service.claimByCode('biz-1', 'GCB-DUO', 'cust-1');

    expect(result.cardType).toBe('bundle');
    expect(giftCardRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        claimedByCustomerId: 'cust-1',
        isActive: true,
      }),
    );
  });

  it('returns idempotently when the same customer re-claims a linked service card', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-svc',
      businessId: 'biz-1',
      code: 'GCS-FACIAL',
      cardType: 'service',
      isActive: true,
      codeRevealed: true,
      claimedAt: new Date('2026-06-01'),
      claimedByCustomerId: 'cust-1',
      serviceCredits: [
        { serviceId: 'svc-1', quantityRemaining: 1, quantityTotal: 1 },
      ],
    });

    const result = await service.claimByCode('biz-1', 'GCS-FACIAL', 'cust-1');

    expect(result.cardType).toBe('service');
    expect(giftCardRepo.save).not.toHaveBeenCalled();
  });

  it('rejects service gift cards already linked to another customer', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      id: 'gc-svc',
      businessId: 'biz-1',
      code: 'GCS-FACIAL',
      cardType: 'service',
      isActive: true,
      codeRevealed: true,
      claimedByCustomerId: 'cust-other',
      serviceCredits: [
        { serviceId: 'svc-1', quantityRemaining: 1, quantityTotal: 1 },
      ],
    });

    await expect(
      service.claimByCode('biz-1', 'GCS-FACIAL', 'cust-1'),
    ).rejects.toThrow('already been claimed by another account');
  });
});
