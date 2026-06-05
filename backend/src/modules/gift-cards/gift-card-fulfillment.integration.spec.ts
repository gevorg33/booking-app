import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Gift card purchase + fulfillment integration', () => {
  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const giftCardRepo = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const creditRepo = { save: jest.fn(), create: jest.fn() };
  const employeeRepo = { findOne: jest.fn(), find: jest.fn() };
  const purchaseEvents = { emit: jest.fn() };
  const fulfillmentEvents = { emit: jest.fn() };

  const packagesService = {
    getPublicPackage: jest.fn().mockResolvedValue(undefined),
    listPublicPackages: jest.fn().mockResolvedValue([]),
  };
  const subscriptionsService = { listPlans: jest.fn().mockResolvedValue([]) };
  const claimService = { claimCard: jest.fn() };
  const customerService = {
    findOrCreateByContact: jest.fn(
      async (_businessId: string, dto: { name: string; email: string }) => ({
        customer: { id: 'cust-linked', name: dto.name, email: dto.email },
        created: true,
      }),
    ),
  };

  const purchaseService = new GiftCardPurchaseService(
    businessRepo as any,
    serviceRepo as any,
    giftCardRepo as any,
    creditRepo as any,
    packagesService as any,
    subscriptionsService as any,
    claimService as any,
    customerService as any,
    purchaseEvents as unknown as EventEmitter2,
  );

  const fulfillmentService = new GiftCardFulfillmentService(
    giftCardRepo as any,
    employeeRepo as any,
    fulfillmentEvents as unknown as EventEmitter2,
  );

  let savedCard: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        giftCards: {
          purchaseEnabled: true,
          digitalDeliveryEnabled: true,
          physicalDeliveryEnabled: true,
          bundles: [
            {
              id: 'bundle-1',
              name: 'Spa trio',
              price: 150,
              lines: [
                { serviceId: 'svc-1', serviceName: 'Facial', quantity: 1 },
                { serviceId: 'svc-2', serviceName: 'Massage', quantity: 1 },
              ],
            },
          ],
          shippingMethods: [
            { id: 'standard', label: 'Standard', fee: 8, estimatedDays: '5d' },
          ],
          cardCreatorStaffIds: ['emp-creator'],
          deliveryStaffIds: ['emp-driver'],
        },
      },
    });
    giftCardRepo.create.mockImplementation((v) => v);
    giftCardRepo.save.mockImplementation(async (v) => {
      savedCard = { id: 'order-1', ...v };
      return savedCard;
    });
    giftCardRepo.findOne.mockImplementation(async () => savedCard);
    creditRepo.create.mockImplementation((v) => v);
    creditRepo.save.mockResolvedValue(undefined);
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-creator',
      userId: 'user-creator',
    });
    employeeRepo.find.mockResolvedValue([
      { id: 'emp-driver', userId: 'user-driver' },
    ]);
  });

  it('runs physical bundle order through card maker then delivery driver', async () => {
    await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'bundle',
      bundleId: 'bundle-1',
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
      recipientName: 'Sam',
      shippingAddress: {
        recipientName: 'Sam',
        line1: '10 Park',
        city: 'Yerevan',
        postalCode: '0010',
        country: 'AM',
      },
    });

    expect(savedCard.fulfillmentStatus).toBe('awaiting_card_creation');
    expect(creditRepo.save).toHaveBeenCalledTimes(2);

    const ready = await fulfillmentService.markCardReady(
      'biz-1',
      'order-1',
      'user-creator',
    );
    expect(ready.fulfillmentStatus).toBe('ready_for_delivery');

    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-driver',
      userId: 'user-driver',
    });
    const out = await fulfillmentService.markOutForDelivery(
      'biz-1',
      'order-1',
      'user-driver',
    );
    expect(out.fulfillmentStatus).toBe('out_for_delivery');

    const delivered = await fulfillmentService.markDelivered(
      'biz-1',
      'order-1',
    );
    expect(delivered.fulfillmentStatus).toBe('delivered');
    expect(delivered.codeRevealed).toBe(true);
  });
});
