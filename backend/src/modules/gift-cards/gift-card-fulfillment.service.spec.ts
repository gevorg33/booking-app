import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';

describe('GiftCardFulfillmentService — card makers & drivers', () => {
  const giftCardRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const employeeRepo = { findOne: jest.fn(), find: jest.fn() };
  const eventEmitter = { emit: jest.fn() };

  const service = new GiftCardFulfillmentService(
    giftCardRepo as any,
    employeeRepo as any,
    eventEmitter as unknown as EventEmitter2,
  );

  const physicalOrder = {
    id: 'order-1',
    businessId: 'biz-1',
    deliveryMethod: 'physical',
    fulfillmentStatus: 'awaiting_card_creation',
    recipientName: 'Alex',
    shippingAddress: { city: 'Berlin' },
    serviceCredits: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.save.mockImplementation(async (v) => v);
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-creator', userId: 'user-creator' });
    employeeRepo.find.mockResolvedValue([
      { id: 'emp-creator', userId: 'user-creator' },
      { id: 'emp-driver', userId: 'user-driver' },
    ]);
  });

  it('lists card creation queue for card makers', async () => {
    giftCardRepo.find.mockResolvedValue([physicalOrder]);
    const queue = await service.listCardCreationQueue('biz-1');
    expect(queue).toHaveLength(1);
    expect(giftCardRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ fulfillmentStatus: 'awaiting_card_creation' }),
      }),
    );
  });

  it('marks card ready and notifies delivery staff pipeline', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...physicalOrder });
    const ready = await service.markCardReady('biz-1', 'order-1', 'user-creator');
    expect(ready.fulfillmentStatus).toBe('ready_for_delivery');
    expect(ready.codeRevealed).toBe(true);
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('assigns delivery driver and moves order out for delivery', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...physicalOrder,
      fulfillmentStatus: 'ready_for_delivery',
    });
    employeeRepo.findOne.mockResolvedValue({ id: 'emp-driver', userId: 'user-driver' });

    const out = await service.markOutForDelivery('biz-1', 'order-1', 'user-driver');
    expect(out.fulfillmentStatus).toBe('out_for_delivery');
    expect(out.deliveryStaffId).toBe('emp-driver');
  });

  it('marks order delivered', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...physicalOrder,
      fulfillmentStatus: 'out_for_delivery',
    });
    const delivered = await service.markDelivered('biz-1', 'order-1');
    expect(delivered.fulfillmentStatus).toBe('delivered');
    expect(delivered.deliveredAt).toBeTruthy();
  });

  it('lists delivery queue for drivers', async () => {
    giftCardRepo.find.mockResolvedValue([
      { ...physicalOrder, fulfillmentStatus: 'ready_for_delivery' },
    ]);
    const queue = await service.listDeliveryQueue('biz-1');
    expect(queue).toHaveLength(1);
  });

  it('resolves staff user ids for push notifications', async () => {
    await expect(service.resolveStaffUserIds(['emp-creator', 'emp-driver'])).resolves.toEqual([
      'user-creator',
      'user-driver',
    ]);
  });

  it('rejects card ready when order is not awaiting creation', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...physicalOrder,
      fulfillmentStatus: 'delivered',
    });
    await expect(service.markCardReady('biz-1', 'order-1', 'user-creator')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('marks shipped with tracking and filters dashboard orders', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...physicalOrder,
      fulfillmentStatus: 'out_for_delivery',
    });
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[physicalOrder], 1]),
    };
    giftCardRepo.createQueryBuilder.mockReturnValue(qb);

    const shipped = await service.markShipped('biz-1', 'order-1', 'DHL', 'TRACK123');
    expect(shipped.fulfillmentStatus).toBe('shipped');
    expect(shipped.trackingNumber).toBe('TRACK123');

    const listed = await service.listDashboardOrders('biz-1', {
      status: 'awaiting_card_creation',
    });
    expect(listed.orders).toHaveLength(1);
    expect(listed.total).toBe(1);
    expect(qb.orderBy).toHaveBeenCalledWith('card.createdAt', 'DESC');
  });

  it('rejects delivery pickup when not ready', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...physicalOrder, fulfillmentStatus: 'awaiting_card_creation' });
    await expect(service.markOutForDelivery('biz-1', 'order-1', 'user-driver')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists all fulfillment orders when status filter is omitted', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[physicalOrder], 1]),
    };
    giftCardRepo.createQueryBuilder.mockReturnValue(qb);
    const listed = await service.listDashboardOrders('biz-1');
    expect(listed.orders).toHaveLength(1);
    expect(listed.page).toBe(1);
  });

  it('searches dashboard orders by recipient email', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    giftCardRepo.createQueryBuilder.mockReturnValue(qb);
    await service.listDashboardOrders('biz-1', { search: 'mary@example.com' });
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('loads a single dashboard order with relations', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...physicalOrder, code: 'GCS-TEST' });
    const order = await service.getDashboardOrder('biz-1', 'order-1');
    expect(order.code).toBe('GCS-TEST');
  });

  it('lists delivery queue including ready and out-for-delivery orders', async () => {
    giftCardRepo.find.mockResolvedValue([
      { ...physicalOrder, fulfillmentStatus: 'ready_for_delivery' },
      { ...physicalOrder, id: 'order-2', fulfillmentStatus: 'out_for_delivery' },
    ]);
    await expect(service.listDeliveryQueue('biz-1')).resolves.toHaveLength(2);
  });

  it('throws when physical order is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(service.markDelivered('biz-1', 'missing')).rejects.toThrow('not found');
  });

  it('returns empty staff user ids when no employees are configured', async () => {
    await expect(service.resolveStaffUserIds([])).resolves.toEqual([]);
  });

  it('allows card ready when staff employee record is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...physicalOrder });
    employeeRepo.findOne.mockResolvedValue(null);
    const ready = await service.markCardReady('biz-1', 'order-1', 'unknown-user');
    expect(ready.cardCreatorStaffId).toBeNull();
  });

  it('rejects fulfillment updates on digital gift cards', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...physicalOrder,
      deliveryMethod: 'digital',
    });
    await expect(service.markCardReady('biz-1', 'order-1', 'user-creator')).rejects.toThrow(
      'Not a physical',
    );
  });
});
