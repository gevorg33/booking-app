import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GiftCardOrderService } from './gift-card-order.service.js';

describe('GiftCardOrderService', () => {
  const giftCardRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const changeRequestRepo = {
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const businessRepo = { findOne: jest.fn() };
  const zendeskService = { createGiftCardChangeTicket: jest.fn() };
  const emailService = { send: jest.fn() };
  const whatsappService = { sendGiftCardMessage: jest.fn() };
  const whatsappIntegrationService = { resolveRuntimeConfig: jest.fn() };
  const stripeService = {
    isConfigured: true,
    client: {
      checkout: { sessions: { retrieve: jest.fn() } },
      refunds: { create: jest.fn() },
    },
    connectRequestOptions: jest.fn((id: string) => ({ stripeAccount: id })),
    usesDestinationCharges: jest.fn().mockReturnValue(false),
    connectCheckoutSessionCreate: jest.fn((accountId: string, params: unknown) => [
      params,
      { stripeAccount: accountId },
    ]),
  };
  const stripeIntegrationService = { resolveConnectAccountId: jest.fn() };

  const service = new GiftCardOrderService(
    giftCardRepo as any,
    changeRequestRepo as any,
    businessRepo as any,
    zendeskService as any,
    emailService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    stripeService as any,
    stripeIntegrationService as any,
  );

  const business = {
    id: 'biz-1',
    name: 'Spa',
    settings: {
      giftCards: { cancelModifyEnabled: true, cancelModifyWindowHours: 48, physicalCancelBeforeReady: true },
    },
  };

  const baseCard = {
    id: 'gc-1',
    businessId: 'biz-1',
    purchaserCustomerId: 'cust-1',
    code: 'GCM-TEST1234',
    codeRevealed: true,
    cardType: 'monetary',
    balance: 50,
    currency: 'USD',
    deliveryMethod: 'digital',
    fulfillmentStatus: 'delivered',
    purchaserEmail: 'buyer@test.com',
    recipientPhone: '+37499123456',
    purchaseAmount: 50,
    isActive: true,
    createdAt: new Date(),
    serviceCredits: [],
    business,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    giftCardRepo.create = jest.fn((v) => v);
    changeRequestRepo.create.mockImplementation((v) => v);
    changeRequestRepo.save.mockImplementation(async (v) => ({ id: 'req-1', ...v }));
    businessRepo.findOne.mockResolvedValue(business);
    giftCardRepo.findOne.mockResolvedValue(baseCard);
    giftCardRepo.save.mockImplementation(async (v) => v);
    zendeskService.createGiftCardChangeTicket.mockResolvedValue({ ticketId: 999, url: 'https://zd/t/999' });
    emailService.send.mockResolvedValue({ ok: true });
    whatsappIntegrationService.resolveRuntimeConfig.mockReturnValue(null);

    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
    };
    changeRequestRepo.createQueryBuilder.mockReturnValue(qb);
  });

  it('submits cancel request with Zendesk ticket and email notification', async () => {
    const result = await service.submitCancelRequest('biz-1', 'cust-1', 'gc-1', 'Changed my mind');
    expect(zendeskService.createGiftCardChangeTicket).toHaveBeenCalled();
    expect(emailService.send).toHaveBeenCalled();
    expect(result.request.requestType).toBe('cancel');
  });

  it('rejects cancel when policy blocks', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 0, isActive: false });
    await expect(service.submitCancelRequest('biz-1', 'cust-1', 'gc-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('submits modify request with payload', async () => {
    const result = await service.submitModifyRequest('biz-1', 'cust-1', 'gc-1', {
      modifyPayload: { recipientName: 'Alex', personalMessage: 'Hi!' },
      customerNotes: 'Please update recipient',
    });
    expect(result.request.requestType).toBe('modify');
    expect(changeRequestRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ modifyPayload: expect.objectContaining({ recipientName: 'Alex' }) }),
    );
  });

  it('approves cancel request and refunds when possible', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-1',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'cancel',
      status: 'in_review',
    });
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, stripeSessionId: 'sess_refund' });
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue('acct_1');
    stripeService.client.checkout.sessions.retrieve.mockResolvedValue({
      payment_intent: 'pi_1',
    });
    stripeService.client.refunds.create.mockResolvedValue({ id: 're_1' });

    const result = await service.resolveChangeRequest('biz-1', 'req-1', 'approve', 'Approved');
    expect(result.request.status).toBe('completed');
    expect(result.card.fulfillmentStatus).toBe('cancelled');
    expect(stripeService.client.refunds.create).toHaveBeenCalled();
  });

  it('applies approved modify payload', () => {
    const card = { ...baseCard } as any;
    service.applyApprovedModifications(card, {
      recipientName: 'Sam',
      amount: 75,
      expiresAt: '2028-01-01',
    });
    expect(card.recipientName).toBe('Sam');
    expect(card.balance).toBe(75);
    expect(card.expiresAt).toEqual(new Date('2028-01-01T23:59:59.999Z'));
  });

  it('rejects cancel when policy blocks', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 0, isActive: false });
    await expect(service.submitCancelRequest('biz-1', 'cust-1', 'gc-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('notifies via WhatsApp when email is missing', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      purchaserEmail: null,
      recipientPhone: '+37499123456',
    });
    whatsappIntegrationService.resolveRuntimeConfig.mockReturnValue({ templateGiftCard: 'gift' });
    await service.submitCancelRequest('biz-1', 'cust-1', 'gc-1');
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalled();
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('deduplicates open change requests per card when listing orders', async () => {
    giftCardRepo.find.mockResolvedValue([baseCard, { ...baseCard, id: 'gc-2' }]);
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { giftCardId: 'gc-1', id: 'req-a', requestType: 'modify', status: 'pending', createdAt: new Date() },
        { giftCardId: 'gc-1', id: 'req-b', requestType: 'cancel', status: 'in_review', createdAt: new Date(0) },
      ]),
    };
    changeRequestRepo.createQueryBuilder.mockReturnValue(qb);
    const orders = await service.listCustomerOrders('biz-1', 'cust-1');
    expect(orders[0].changeRequest?.id).toBe('req-a');
  });

  it('skips Zendesk linkage when ticket id is missing', async () => {
    zendeskService.createGiftCardChangeTicket.mockResolvedValue({ url: 'https://zd/empty' });
    await service.submitCancelRequest('biz-1', 'cust-1', 'gc-1');
    expect(changeRequestRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
    );
  });

  it('does not overwrite existing card zendesk ticket id', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, zendeskTicketId: 'existing-ticket' });
    await service.submitCancelRequest('biz-1', 'cust-1', 'gc-1');
    expect(giftCardRepo.save).not.toHaveBeenCalled();
  });

  it('ignores invalid monetary amount updates', () => {
    const card = { ...baseCard, cardType: 'monetary', balance: 50 } as any;
    service.applyApprovedModifications(card, { amount: -5 });
    expect(card.balance).toBe(50);
  });

  it('returns empty map when listing orders for customer with no cards', async () => {
    giftCardRepo.find.mockResolvedValue([]);
    await expect(service.listCustomerOrders('biz-1', 'cust-1')).resolves.toEqual([]);
  });

  it('rejects modify when policy blocks', async () => {
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, balance: 0, isActive: false });
    await expect(
      service.submitModifyRequest('biz-1', 'cust-1', 'gc-1', {
        modifyPayload: { recipientName: 'X' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('filters change requests by status and applies shipping updates', () => {
    const card = { ...baseCard } as any;
    service.applyApprovedModifications(card, {
      shippingAddress: {
        recipientName: 'Sam',
        line1: '1 Main',
        city: 'Yerevan',
        postalCode: '0010',
        country: 'AM',
      },
      shippingMethodId: 'express',
      expiresAt: null,
    });
    expect(card.shippingAddress?.line1).toBe('1 Main');
    expect(card.shippingMethod).toBe('express');
    expect(card.expiresAt).toBeNull();
  });

  it('rejects resolve when gift card is missing', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-5',
      giftCardId: 'gc-missing',
      businessId: 'biz-1',
      requestType: 'modify',
      status: 'pending',
    });
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(service.resolveChangeRequest('biz-1', 'req-5', 'approve')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists customer orders and change requests', async () => {
    giftCardRepo.find.mockResolvedValue([baseCard]);
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    changeRequestRepo.createQueryBuilder.mockReturnValue(qb);
    await expect(service.listCustomerOrders('biz-1', 'cust-1')).resolves.toHaveLength(1);
    changeRequestRepo.find.mockResolvedValue([{ id: 'req-1', status: 'pending' }]);
    await expect(service.listChangeRequests('biz-1', 'pending')).resolves.toHaveLength(1);
  });

  it('continues when Zendesk or refund fails', async () => {
    zendeskService.createGiftCardChangeTicket.mockRejectedValue(new Error('zendesk down'));
    await expect(
      service.submitCancelRequest('biz-1', 'cust-1', 'gc-1', 'notes'),
    ).resolves.toMatchObject({ request: expect.objectContaining({ requestType: 'cancel' }) });

    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-4',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'cancel',
      status: 'pending',
    });
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, stripeSessionId: 'sess_bad' });
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue('acct_1');
    stripeService.client.checkout.sessions.retrieve.mockRejectedValue(new Error('stripe down'));
    await expect(service.resolveChangeRequest('biz-1', 'req-4', 'approve')).resolves.toMatchObject({
      request: { status: 'completed' },
    });
  });

  it('sends WhatsApp notification when configured', async () => {
    whatsappIntegrationService.resolveRuntimeConfig.mockReturnValue({ templateGiftCard: 'gift' });
    whatsappService.sendGiftCardMessage.mockResolvedValue({ ok: true });
    await service.submitCancelRequest('biz-1', 'cust-1', 'gc-1');
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalled();
  });

  it('rejects resolving already completed request', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-done',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'cancel',
      status: 'completed',
    });
    await expect(service.resolveChangeRequest('biz-1', 'req-done', 'approve')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects missing change request', async () => {
    changeRequestRepo.findOne.mockResolvedValue(null);
    await expect(service.resolveChangeRequest('biz-1', 'missing', 'approve')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns customer order view with credits and open request', async () => {
    giftCardRepo.findOne.mockResolvedValue({
      ...baseCard,
      serviceCredits: [{ serviceId: 'svc-1', serviceName: 'Facial', quantityRemaining: 1, quantityTotal: 1 }],
    });
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'req-open',
        requestType: 'modify',
        status: 'in_review',
        createdAt: new Date(),
      }),
    };
    changeRequestRepo.createQueryBuilder.mockReturnValue(qb);
    const order = await service.getCustomerOrder('biz-1', 'cust-1', 'gc-1');
    expect(order.serviceCredits).toHaveLength(1);
    expect(order.changeRequest?.status).toBe('in_review');
  });

  it('loads business when card relation is missing on resolve', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-6',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'modify',
      status: 'pending',
      modifyPayload: { recipientEmail: 'new@test.com' },
    });
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, business: undefined });
    const resolved = await service.resolveChangeRequest('biz-1', 'req-6', 'approve');
    expect(resolved.card.recipientEmail).toBe('new@test.com');
  });

  it('skips refund when checkout session has no payment intent', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-7',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'cancel',
      status: 'pending',
    });
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, stripeSessionId: 'sess_no_pi' });
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue('acct_1');
    stripeService.client.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: null });
    await service.resolveChangeRequest('biz-1', 'req-7', 'approve');
    expect(stripeService.client.refunds.create).not.toHaveBeenCalled();
  });

  it('masks unrevealed codes in customer order views', async () => {
    giftCardRepo.find.mockResolvedValue([{ ...baseCard, codeRevealed: false }]);
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    changeRequestRepo.createQueryBuilder.mockReturnValue(qb);
    const orders = await service.listCustomerOrders('biz-1', 'cust-1');
    expect(orders[0].code).toBe('****');
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.listCustomerOrders('biz-1', 'cust-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refunds using object payment_intent ids', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-8',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'cancel',
      status: 'pending',
    });
    giftCardRepo.findOne.mockResolvedValue({ ...baseCard, stripeSessionId: 'sess_obj_pi' });
    stripeIntegrationService.resolveConnectAccountId.mockReturnValue('acct_1');
    stripeService.client.checkout.sessions.retrieve.mockResolvedValue({
      payment_intent: { id: 'pi_obj' },
    });
    await service.resolveChangeRequest('biz-1', 'req-8', 'approve');
    expect(stripeService.client.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_obj' },
      expect.any(Object),
    );
  });

  it('rejects missing customer order', async () => {
    giftCardRepo.findOne.mockResolvedValue(null);
    await expect(service.getCustomerOrder('biz-1', 'cust-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('marks request as needs_info or denied', async () => {
    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-2',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'modify',
      status: 'in_review',
    });
    const needsInfo = await service.resolveChangeRequest('biz-1', 'req-2', 'needs_info', 'Need address');
    expect(needsInfo.request.status).toBe('needs_info');

    changeRequestRepo.findOne.mockResolvedValue({
      id: 'req-3',
      giftCardId: 'gc-1',
      businessId: 'biz-1',
      requestType: 'cancel',
      status: 'pending',
    });
    const denied = await service.resolveChangeRequest('biz-1', 'req-3', 'deny', 'Too late');
    expect(denied.request.status).toBe('denied');
  });

  it('rejects modify without payload', async () => {
    await expect(
      service.submitModifyRequest('biz-1', 'cust-1', 'gc-1', { modifyPayload: {} }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
