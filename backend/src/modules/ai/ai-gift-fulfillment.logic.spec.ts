import {
  handleExplainGiftCardOrderDetailsLogic,
  handleListGiftCardOrdersLogic,
  handleFilterAwaitingCreationLogic,
  handleAssignCardCreatorLogic,
  handleAssignDeliveryStaffLogic,
  handleMarkShippedLogic,
  handleMarkDeliveredLogic,
  handleCancelGiftCardOrderLogic,
  handleExtendCancelWindowLogic,
  handlePrintPackingSlipLogic,
  handleGiftCardCreationQueueLogic,
  handleStartCardPreparationLogic,
  handleMarkCardReadyLogic,
  handleDeliveryQueueLogic,
  handleMarkOutForDeliveryLogic,
  handleAcceptDeliveryLogic,
  handleCaptureDeliveryProofLogic,
  handleNotifyDelayLogic,
  handleTrackGiftCardShipmentLogic,
  handleEnterShippingAddressLogic,
  handleShippingMethodQuoteLogic,
  handleOrderStatusNotificationsLogic,
  handleFulfillmentCompoundLogic,
  handleUpdateGiftCardSettingsLogic,
  handleListGiftCardChangeRequestsLogic,
  handleResolveGiftCardChangeRequestLogic,
  handleGiftFulfillBatchLogic,
  type GiftFulfillmentLogicDeps,
} from './ai-gift-fulfillment.logic.js';

const physicalCard = {
  id: 'gc-1',
  businessId: 'biz-1',
  deliveryMethod: 'physical',
  fulfillmentStatus: 'awaiting_card_creation',
  recipientName: 'Jane',
  recipientEmail: 'jane@example.com',
  purchaserEmail: 'buyer@example.com',
  personalMessage: 'Happy birthday',
  shippingAddress: {
    recipientName: 'Jane',
    line1: '123 Main St',
    city: 'Boston',
    postalCode: '02101',
    country: 'US',
    instructions: null,
  },
  shippingMethod: 'standard',
  stripeSessionId: 'sess_1',
  serviceCredits: [],
};

const employees = [
  { id: 'e1', name: 'Anna', businessId: 'biz-1', isActive: true, userId: 'u1' },
];

function buildDeps(
  overrides: Partial<GiftFulfillmentLogicDeps> = {},
): GiftFulfillmentLogicDeps {
  return {
    fulfillmentService: {
      listDashboardOrders: jest.fn(async () => ({
        orders: [physicalCard],
        total: 1,
        page: 1,
        pageSize: 20,
      })),
      listCardCreationQueue: jest.fn(async () => [physicalCard]),
      listDeliveryQueue: jest.fn(async () => [
        { ...physicalCard, fulfillmentStatus: 'ready_for_delivery' },
      ]),
      getDashboardOrder: jest.fn(async () => ({ ...physicalCard })),
      markCardReady: jest.fn(async () => ({
        ...physicalCard,
        fulfillmentStatus: 'ready_for_delivery',
        cardReadyAt: new Date('2026-06-06'),
      })),
      markOutForDelivery: jest.fn(async () => ({
        ...physicalCard,
        fulfillmentStatus: 'out_for_delivery',
      })),
      markShipped: jest.fn(async () => ({
        ...physicalCard,
        fulfillmentStatus: 'shipped',
        trackingCarrier: 'UPS',
        trackingNumber: 'ABC123',
      })),
      markDelivered: jest.fn(async () => ({
        ...physicalCard,
        fulfillmentStatus: 'delivered',
        deliveredAt: new Date('2026-06-07'),
      })),
    } as any,
    giftCardOrderService: {
      listCustomerOrders: jest.fn(async () => [
        {
          id: 'gc-1',
          deliveryMethod: 'physical',
          fulfillmentStatus: 'shipped',
          trackingCarrier: 'UPS',
          trackingNumber: 'TRK-1',
        },
      ]),
      getCustomerOrder: jest.fn(async () => ({
        id: 'gc-1',
        deliveryMethod: 'physical',
        fulfillmentStatus: 'shipped',
        trackingCarrier: 'UPS',
        trackingNumber: 'TRK-1',
      })),
      listChangeRequests: jest.fn(async () => [
        { id: 'req-1', status: 'pending', giftCardId: 'gc-1' },
      ]),
      resolveChangeRequest: jest.fn(
        async (
          _businessId: string,
          requestId: string,
          resolution: string,
          specialistNotes?: string,
        ) => ({ id: requestId, status: resolution, specialistNotes }),
      ),
    } as any,
    giftCardPurchaseService: {
      getPublicCatalog: jest.fn(async () => ({
        purchaseEnabled: true,
        settings: {
          physicalDeliveryEnabled: true,
          presetAmounts: [50, 100],
          shippingMethods: [
            {
              id: 'standard',
              label: 'Standard',
              fee: 5,
              estimatedDays: '5-7 days',
            },
            {
              id: 'express',
              label: 'Express',
              fee: 12,
              estimatedDays: '2-3 days',
            },
          ],
        },
      })),
      quotePurchase: jest.fn(async () => ({
        label: 'Gift card $50',
        subtotal: 50,
        shippingFee: 5,
        total: 55,
        currency: 'USD',
        cardType: 'monetary',
      })),
    } as any,
    giftCardRefundService: {
      refundPurchase: jest.fn(async () => 'refunded'),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: {
          giftCards: { cancelModifyWindowHours: 24, cancelModifyEnabled: true },
        },
      })),
      save: jest.fn(async (b) => b),
    } as any,
    giftCardRepo: {
      save: jest.fn(async (c) => c),
    } as any,
    employeeRepo: {
      find: jest.fn(async () => employees),
      findOne: jest.fn(async ({ where }: any) =>
        where.id === 'e1' || where.userId ? employees[0] : null,
      ),
    } as any,
    ...overrides,
  };
}

describe('ai-gift-fulfillment.logic', () => {
  it('lists and filters dashboard orders', async () => {
    const deps = buildDeps();
    expect(
      (await handleListGiftCardOrdersLogic(deps, 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (await handleFilterAwaitingCreationLogic(deps, 'biz-1', {})).success,
    ).toBe(true);
    const empty = buildDeps({
      fulfillmentService: {
        listDashboardOrders: jest.fn(async () => ({
          orders: [],
          total: 0,
          page: 1,
          pageSize: 20,
        })),
      } as any,
    });
    expect(
      (await handleListGiftCardOrdersLogic(empty, 'biz-1', {})).summary,
    ).toContain('No gift card');
  });

  it('assigns staff and handles missing params', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleAssignCardCreatorLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
          employeeName: 'Anna',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAssignDeliveryStaffLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
          employeeId: 'e1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAssignCardCreatorLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
          employeeName: 'Ann',
        })
      ).success,
    ).toBe(true);
    expect(
      (await handleAssignCardCreatorLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleAssignCardCreatorLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
    expect(
      (await handleAssignDeliveryStaffLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleAssignDeliveryStaffLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
    expect((await handleMarkDeliveredLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (await handleCaptureDeliveryProofLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('marks shipped and delivered with tracking fallbacks', async () => {
    const deps = buildDeps();
    expect(
      (await handleMarkShippedLogic(deps, 'biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect(
      (
        await handleMarkShippedLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'Mark shipped UPS tracking ABC123',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleMarkDeliveredLogic(deps, 'biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect((await handleMarkShippedLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );

    const failShip = buildDeps({
      fulfillmentService: {
        markShipped: jest.fn(async () => {
          throw new Error('not ready');
        }),
      } as any,
    });
    expect(
      (await handleMarkShippedLogic(failShip, 'biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(false);
    const failDeliver = buildDeps({
      fulfillmentService: {
        markDelivered: jest.fn(async () => {
          throw new Error('not found');
        }),
      } as any,
    });
    expect(
      (
        await handleMarkDeliveredLogic(failDeliver, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
  });

  it('cancels orders and extends cancel window', async () => {
    const deps = buildDeps();
    const cancelNoReason = await handleCancelGiftCardOrderLogic(
      deps,
      'biz-1',
      { giftCardId: 'gc-1' },
    );
    expect(cancelNoReason.success).toBe(false);
    expect(cancelNoReason.details).toMatchObject({
      clarify: true,
      missing: ['reason'],
    });
    expect(
      (
        await handleCancelGiftCardOrderLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
          reason: 'Customer requested cancellation',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleExtendCancelWindowLogic(deps, 'biz-1', {
          cancelModifyWindowHours: 48,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleExtendCancelWindowLogic(
          deps,
          'biz-1',
          {},
          'extend cancel window 72 hours',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleExtendCancelWindowLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (await handleCancelGiftCardOrderLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const noBiz = buildDeps({
      businessRepo: { findOne: jest.fn(async () => null) } as any,
    });
    expect(
      (
        await handleCancelGiftCardOrderLogic(noBiz, 'biz-1', {
          giftCardId: 'gc-1',
          reason: 'Customer requested cancellation',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleExtendCancelWindowLogic(noBiz, 'biz-1', {
          cancelModifyWindowHours: 24,
        })
      ).success,
    ).toBe(false);

    const noRefund = buildDeps();
    (
      noRefund.fulfillmentService.getDashboardOrder as jest.Mock
    ).mockResolvedValue({
      ...physicalCard,
      stripeSessionId: null,
    });
    expect(
      (
        await handleCancelGiftCardOrderLogic(noRefund, 'biz-1', {
          giftCardId: 'gc-1',
          reason: 'No refund needed — unused',
        })
      ).success,
    ).toBe(true);
  });

  it('prints packing slip and handles provider queue operations', async () => {
    const deps = buildDeps();
    expect(
      (await handlePrintPackingSlipLogic(deps, 'biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect((await handlePrintPackingSlipLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (await handleGiftCardCreationQueueLogic(deps, 'biz-1')).success,
    ).toBe(true);
    expect((await handleDeliveryQueueLogic(deps, 'biz-1')).success).toBe(true);

    const emptyQueue = buildDeps({
      fulfillmentService: {
        listCardCreationQueue: jest.fn(async () => []),
        listDeliveryQueue: jest.fn(async () => []),
      } as any,
    });
    expect(
      (await handleGiftCardCreationQueueLogic(emptyQueue, 'biz-1')).summary,
    ).toContain('empty');
    expect(
      (await handleDeliveryQueueLogic(emptyQueue, 'biz-1')).summary,
    ).toContain('empty');
  });

  it('explains a gift card order detail (ai-cmd-provider-5.20.5)', async () => {
    const deps = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          cardType: 'service',
          purchaseAmount: 100,
          balance: 100,
          currency: 'USD',
        })),
      } as any,
    });

    const result = await handleExplainGiftCardOrderDetailsLogic(deps, 'biz-1', {
      giftCardId: 'gc-1',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_gift_card_order_details');
    expect(result.summary).toContain('service gift card');
    expect(result.summary).toContain('Jane');
    expect(result.details?.cardType).toBe('service');

    const clarify = await handleExplainGiftCardOrderDetailsLogic(
      deps,
      'biz-1',
      {},
    );
    expect(clarify.success).toBe(false);
    expect(clarify.details?.clarify).toBe(true);
  });

  it('handles card preparation and ready states', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleStartCardPreparationLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleMarkCardReadyLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleMarkCardReadyLogic(
          deps,
          'biz-1',
          { useFirstInQueue: true },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleStartCardPreparationLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect((await handleMarkCardReadyLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );

    const digital = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          deliveryMethod: 'digital',
        })),
      } as any,
    });
    expect(
      (
        await handleStartCardPreparationLogic(digital, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);

    const wrongStatus = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          fulfillmentStatus: 'shipped',
        })),
      } as any,
    });
    expect(
      (
        await handleStartCardPreparationLogic(wrongStatus, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);

    const failReady = buildDeps({
      fulfillmentService: {
        markCardReady: jest.fn(async () => {
          throw new Error('bad state');
        }),
        listCardCreationQueue: jest.fn(async () => []),
      } as any,
    });
    expect(
      (
        await handleMarkCardReadyLogic(failReady, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleMarkCardReadyLogic(
          deps,
          'biz-1',
          { useFirstInQueue: true },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleMarkOutForDeliveryLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const failPrep = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => {
          throw new Error('missing');
        }),
      } as any,
    });
    expect(
      (
        await handleStartCardPreparationLogic(failPrep, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
  });

  it('handles delivery acceptance and proof capture', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleMarkOutForDeliveryLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleAcceptDeliveryLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleCaptureDeliveryProofLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
          proofUrl: 'https://proof.example/p.jpg',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleCaptureDeliveryProofLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'note "signed"',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleMarkOutForDeliveryLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (
        await handleCaptureDeliveryProofLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);

    const noAddress = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          shippingAddress: null,
          recipientName: 'Jane',
        })),
      } as any,
    });
    expect(
      (
        await handleCaptureDeliveryProofLogic(noAddress, 'biz-1', {
          giftCardId: 'gc-1',
          proofNote: 'signed',
        })
      ).success,
    ).toBe(true);

    const failOut = buildDeps({
      fulfillmentService: {
        markOutForDelivery: jest.fn(async () => {
          throw new Error('not ready');
        }),
      } as any,
    });
    expect(
      (
        await handleMarkOutForDeliveryLogic(failOut, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
  });

  it('notifies delay with optional order context', async () => {
    const deps = buildDeps();
    expect(
      (await handleNotifyDelayLogic(deps, 'biz-1', { delayReason: 'Weather' }))
        .success,
    ).toBe(true);
    expect(
      (
        await handleNotifyDelayLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'delay because traffic',
        )
      ).success,
    ).toBe(true);
    const missingOrder = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => {
          throw new Error('missing');
        }),
      } as any,
    });
    expect(
      (
        await handleNotifyDelayLogic(missingOrder, 'biz-1', {
          giftCardId: 'gc-2',
        })
      ).success,
    ).toBe(true);
  });

  it('handles customer shipment tracking and address entry', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleTrackGiftCardShipmentLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleTrackGiftCardShipmentLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (await handleTrackGiftCardShipmentLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const noPhysical = buildDeps({
      giftCardOrderService: {
        listCustomerOrders: jest.fn(async () => [
          { id: 'gc-2', deliveryMethod: 'digital' },
        ]),
      } as any,
    });
    expect(
      (
        await handleTrackGiftCardShipmentLogic(noPhysical, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(false);

    expect(
      (
        await handleEnterShippingAddressLogic(deps, 'biz-1', {
          shippingAddress: {
            line1: '1 Main',
            city: 'Boston',
            country: 'US',
            postalCode: '02101',
            recipientName: 'Sam',
          },
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleEnterShippingAddressLogic(
          deps,
          'biz-1',
          { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
          'Enter shipping address 123 Main St Boston',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleEnterShippingAddressLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const orderFail = buildDeps({
      giftCardOrderService: {
        getCustomerOrder: jest.fn(async () => {
          throw new Error('not found');
        }),
      } as any,
    });
    expect(
      (
        await handleEnterShippingAddressLogic(orderFail, 'biz-1', {
          sessionCustomerId: 'c1',
          giftCardId: 'gc-9',
          shippingAddress: {
            line1: '1 Main',
            city: 'Boston',
            country: 'US',
            postalCode: '02101',
            recipientName: 'Sam',
          },
        })
      ).success,
    ).toBe(true);
  });

  it('quotes shipping methods and order notifications', async () => {
    const deps = buildDeps();
    expect(
      (await handleShippingMethodQuoteLogic(deps, 'biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await handleShippingMethodQuoteLogic(deps, 'biz-1', {
          shippingMethodId: 'standard',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleOrderStatusNotificationsLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);
    expect(
      (await handleOrderStatusNotificationsLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const disabled = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: false,
          settings: null,
        })),
      } as any,
    });
    expect(
      (await handleShippingMethodQuoteLogic(disabled, 'biz-1', {})).success,
    ).toBe(false);

    const quoteFail = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: true,
          settings: {
            physicalDeliveryEnabled: true,
            presetAmounts: [50],
            shippingMethods: [{ id: 'x', fee: 1 }],
          },
        })),
        quotePurchase: jest.fn(async () => {
          throw new Error('bad method');
        }),
      } as any,
    });
    expect(
      (
        await handleShippingMethodQuoteLogic(quoteFail, 'biz-1', {
          shippingMethodId: 'x',
        })
      ).success,
    ).toBe(false);

    const partialQuote = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: true,
          settings: {
            physicalDeliveryEnabled: true,
            presetAmounts: [50],
            shippingMethods: [
              { id: 'ok', label: 'OK', fee: 5, estimatedDays: '5d' },
              { id: 'bad', label: 'Bad', fee: 9, estimatedDays: '9d' },
            ],
          },
        })),
        quotePurchase: jest.fn(async (_biz, input: any) => {
          if (input.shippingMethodId === 'bad') throw new Error('fail');
          return { label: 'ok', subtotal: 50, shippingFee: 5, total: 55 };
        }),
      } as any,
    });
    expect(
      (await handleShippingMethodQuoteLogic(partialQuote, 'biz-1', {})).success,
    ).toBe(true);

    const noOrders = buildDeps({
      giftCardOrderService: {
        listCustomerOrders: jest.fn(async () => []),
      } as any,
    });
    expect(
      (
        await handleOrderStatusNotificationsLogic(noOrders, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);
  });

  it('runs fulfillment compound flows with context merge', async () => {
    const deps = buildDeps();
    const provider = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'Show gift card creation queue and mark first card ready',
      {},
      'u1',
    );
    expect(provider.success).toBe(true);
    expect((provider.details as any).fulfillmentCompound).toBe(true);

    const dashboard = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'List awaiting creation orders and assign card creator to Anna',
      {},
    );
    expect(dashboard.success).toBe(true);

    const customer = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'Enter shipping address 123 Main St Boston and get shipping method quote and enable order status notifications',
      { sessionCustomerId: 'c1' },
    );
    expect(customer.success).toBe(true);

    const tooShort = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'List gift card orders',
      {},
    );
    expect(tooShort.success).toBe(false);

    const stopped = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'assign_card_creator', params: {}, segment: 'assign' },
          {
            action: 'mark_shipped',
            params: { giftCardId: 'gc-1' },
            segment: 'ship',
          },
        ],
      },
    );
    expect(stopped.success).toBe(false);

    const unsupported = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_gift_card_orders', params: {}, segment: 'list' },
          { action: 'not_a_real_intent' as any, params: {}, segment: 'bad' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);

    const mergeShip = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'gift_card_creation_queue',
            params: { useFirstInQueue: true },
            segment: 'queue',
          },
          { action: 'mark_card_ready', params: {}, segment: 'ready' },
        ],
        sessionCustomerId: 'c1',
      },
    );
    expect(mergeShip.success).toBe(true);

    const addressCompound = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'enter_shipping_address',
            params: {
              shippingAddress: {
                line1: '1 Main',
                city: 'Boston',
                country: 'US',
                postalCode: '02101',
              },
            },
            segment: 'addr',
          },
          {
            action: 'shipping_method_quote',
            params: { shippingMethodId: 'standard' },
            segment: 'quote',
          },
        ],
      },
    );
    expect(addressCompound.success).toBe(true);

    const trackCompound = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'track_gift_card_shipment',
            params: { sessionCustomerId: 'c1' },
            segment: 'track',
          },
          {
            action: 'order_status_notifications',
            params: { sessionCustomerId: 'c1' },
            segment: 'notify',
          },
        ],
      },
    );
    expect(trackCompound.success).toBe(true);
  });

  it('covers remaining compound switch branches', async () => {
    const deps = buildDeps();
    const steps = [
      'filter_awaiting_creation',
      'assign_delivery_staff',
      'mark_shipped',
      'mark_delivered',
      'cancel_gift_card_order',
      'extend_cancel_window',
      'print_packing_slip',
      'start_card_preparation',
      'delivery_queue',
      'accept_delivery',
      'mark_out_for_delivery',
      'capture_delivery_proof',
      'notify_delay',
    ] as const;

    for (const action of steps) {
      const extra =
        action === 'assign_delivery_staff' ||
        action === 'mark_shipped' ||
        action === 'capture_delivery_proof'
          ? {
              giftCardId: 'gc-1',
              employeeName: 'Anna',
              proofUrl: 'https://x',
              carrier: 'UPS',
              trackingNumber: 'T1',
            }
          : action === 'extend_cancel_window'
            ? { cancelModifyWindowHours: 48 }
            : action === 'cancel_gift_card_order'
              ? { giftCardId: 'gc-1', reason: 'Test cancellation' }
              : action === 'print_packing_slip' ||
                action === 'start_card_preparation' ||
                action === 'mark_delivered' ||
                action === 'mark_out_for_delivery' ||
                action === 'accept_delivery' ||
                action === 'notify_delay'
              ? { giftCardId: 'gc-1' }
              : {};
      const result = await handleFulfillmentCompoundLogic(
        deps,
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'list_gift_card_orders', params: {}, segment: 'list' },
            { action, params: extra, segment: action },
          ],
        },
      );
      expect(result.success).toBe(true);
    }
  });

  it('covers remaining branch paths for full logic coverage', async () => {
    const deps = buildDeps();
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(
      (
        await handleAssignCardCreatorLogic(
          deps,
          'biz-1',
          {},
          `assign card creator to Anna for order ${uuid}`,
        )
      ).success,
    ).toBe(true);

    const missingEmployee = buildDeps({
      employeeRepo: {
        find: jest.fn(async () => employees),
        findOne: jest.fn(async () => null),
      } as any,
    });
    expect(
      (
        await handleAssignCardCreatorLogic(missingEmployee, 'biz-1', {
          giftCardId: 'gc-1',
          employeeId: 'missing',
        })
      ).success,
    ).toBe(false);

    const noAddressSlip = buildDeps({
      fulfillmentService: {
        ...buildDeps().fulfillmentService,
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          shippingAddress: null,
          recipientName: null,
        })),
      } as any,
    });
    expect(
      (
        await handlePrintPackingSlipLogic(noAddressSlip, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).details,
    ).toMatchObject({
      slip: { address: null, recipientName: 'Recipient' },
    });

    const noDeliveredAt = buildDeps({
      fulfillmentService: {
        markDelivered: jest.fn(async () => ({
          ...physicalCard,
          fulfillmentStatus: 'delivered',
          deliveredAt: null,
        })),
      } as any,
    });
    expect(
      (
        await handleMarkDeliveredLogic(noDeliveredAt, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);

    const emptyMethods = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: true,
          settings: {
            physicalDeliveryEnabled: true,
            presetAmounts: [50],
            shippingMethods: [],
          },
        })),
      } as any,
    });
    expect(
      (await handleShippingMethodQuoteLogic(emptyMethods, 'biz-1', {})).summary,
    ).toContain('No shipping');

    const quoteWithMethodId = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: true,
          settings: {
            physicalDeliveryEnabled: true,
            presetAmounts: [50],
            shippingMethods: [
              {
                id: 'standard',
                label: 'Standard',
                fee: 5,
                estimatedDays: '5d',
              },
            ],
          },
        })),
        quotePurchase: jest.fn(async () => ({
          label: 'Gift card $50',
          subtotal: 50,
          shippingFee: 5,
          total: 55,
          shippingMethodId: 'standard',
        })),
      } as any,
    });
    const mergeQuote = await handleFulfillmentCompoundLogic(
      quoteWithMethodId,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'shipping_method_quote',
            params: { shippingMethodId: 'standard' },
            segment: 'quote',
          },
          { action: 'list_gift_card_orders', params: {}, segment: 'list' },
        ],
      },
    );
    expect(mergeQuote.success).toBe(true);

    const filterMerge = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'filter_awaiting_creation',
            params: { useFirstInQueue: true },
            segment: 'filter',
          },
          {
            action: 'assign_card_creator',
            params: { employeeName: 'Anna' },
            segment: 'assign',
          },
        ],
      },
    );
    expect(filterMerge.success).toBe(true);

    const captureFail = await handleCaptureDeliveryProofLogic(
      deps,
      'biz-1',
      {},
      'capture proof',
    );
    expect(captureFail.success).toBe(false);

    const trackById = await handleTrackGiftCardShipmentLogic(deps, 'biz-1', {
      sessionCustomerId: 'c1',
      giftCardId: 'gc-1',
    });
    expect(trackById.success).toBe(true);

    const disabledNotify = buildDeps({
      businessRepo: {
        findOne: jest.fn(async () => ({
          id: 'biz-1',
          settings: {
            giftCards: {
              cancelModifyWindowHours: 24,
              cancelModifyEnabled: false,
            },
          },
        })),
      } as any,
    });
    expect(
      (
        await handleOrderStatusNotificationsLogic(disabledNotify, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).summary,
    ).toContain('limited');
  });

  it('covers optional branch fallbacks', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleAssignCardCreatorLogic(
          deps,
          'biz-1',
          { giftCardId: 'gc-1' },
          'assign card creator to Anna',
        )
      ).success,
    ).toBe(true);

    const emptyFilter = buildDeps({
      fulfillmentService: {
        listDashboardOrders: jest.fn(async () => ({
          orders: [],
          total: 0,
          page: 1,
          pageSize: 20,
        })),
      } as any,
    });
    expect(
      (await handleFilterAwaitingCreationLogic(emptyFilter, 'biz-1', {}))
        .summary,
    ).toContain('No orders');

    const throwNoMsg = () => {
      throw { message: undefined };
    };
    expect(
      (
        await handleMarkShippedLogic(
          buildDeps({
            fulfillmentService: { markShipped: jest.fn(throwNoMsg) } as any,
          }),
          'biz-1',
          { giftCardId: 'gc-1' },
        )
      ).summary,
    ).toContain('Could not mark');

    const nullStatusPrep = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          fulfillmentStatus: null,
        })),
      } as any,
    });
    expect(
      (
        await handleStartCardPreparationLogic(nullStatusPrep, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleStartCardPreparationLogic(
          buildDeps({
            fulfillmentService: {
              getDashboardOrder: jest.fn(throwNoMsg),
            } as any,
          }),
          'biz-1',
          { giftCardId: 'gc-1' },
        )
      ).summary,
    ).toContain('Could not start');

    expect(
      (
        await handleMarkCardReadyLogic(
          buildDeps({
            fulfillmentService: { markCardReady: jest.fn(throwNoMsg) } as any,
          }),
          'biz-1',
          { giftCardId: 'gc-1' },
        )
      ).summary,
    ).toContain('Could not mark card');

    expect(
      (
        await handleMarkOutForDeliveryLogic(
          buildDeps({
            fulfillmentService: {
              markOutForDelivery: jest.fn(throwNoMsg),
            } as any,
          }),
          'biz-1',
          { giftCardId: 'gc-1' },
        )
      ).summary,
    ).toContain('Could not mark out');

    const proofOnly = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          shippingAddress: null,
          recipientName: 'Jane Doe',
        })),
      } as any,
    });
    expect(
      (
        await handleCaptureDeliveryProofLogic(proofOnly, 'biz-1', {
          giftCardId: 'gc-1',
          proofUrl: 'https://x',
        })
      ).success,
    ).toBe(true);

    const notifyPurchaser = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          recipientEmail: null,
          purchaserEmail: 'buyer@example.com',
        })),
      } as any,
    });
    expect(
      (
        await handleNotifyDelayLogic(notifyPurchaser, 'biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);

    const bareTrack = buildDeps({
      giftCardOrderService: {
        listCustomerOrders: jest.fn(async () => [
          {
            id: 'gc-1',
            deliveryMethod: 'physical',
            fulfillmentStatus: null,
            trackingCarrier: null,
            trackingNumber: null,
          },
        ]),
      } as any,
    });
    expect(
      (
        await handleTrackGiftCardShipmentLogic(bareTrack, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleEnterShippingAddressLogic(deps, 'biz-1', {
          recipientName: 'Custom Name',
          shippingAddress: { line1: '1 Main', city: 'Boston' },
        })
      ).details,
    ).toMatchObject({
      preview: { postalCode: '', country: 'US', recipientName: 'Custom Name' },
    });
    expect(
      (
        await handleEnterShippingAddressLogic(deps, 'biz-1', {
          giftCardId: 'gc-1',
          shippingAddress: {
            line1: '2 Main',
            city: 'Boston',
            country: 'US',
            postalCode: '02101',
          },
        })
      ).summary,
    ).toContain('Shipping address validated.');

    const disabledPhysical = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: true,
          settings: {
            physicalDeliveryEnabled: false,
            presetAmounts: undefined,
            shippingMethods: undefined,
          },
        })),
      } as any,
    });
    expect(
      (await handleShippingMethodQuoteLogic(disabledPhysical, 'biz-1', {}))
        .success,
    ).toBe(false);

    expect(
      (
        await handleShippingMethodQuoteLogic(
          buildDeps({
            giftCardPurchaseService: {
              quotePurchase: jest.fn(throwNoMsg),
              getPublicCatalog: deps.giftCardPurchaseService.getPublicCatalog,
            } as any,
          }),
          'biz-1',
          { shippingMethodId: 'standard' },
        )
      ).summary,
    ).toContain('Could not quote');

    const nullStatusNotify = buildDeps({
      giftCardOrderService: {
        listCustomerOrders: jest.fn(async () => [
          {
            id: 'gc-1',
            deliveryMethod: 'physical',
            fulfillmentStatus: null,
            trackingNumber: null,
          },
        ]),
      } as any,
    });
    expect(
      (
        await handleOrderStatusNotificationsLogic(nullStatusNotify, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);

    const presetMerge = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'gift_card_creation_queue', params: {}, segment: 'queue' },
          {
            action: 'assign_card_creator',
            params: { giftCardId: 'gc-99', employeeName: 'Anna' },
            segment: 'assign',
          },
        ],
      },
    );
    expect(presetMerge.success).toBe(true);

    const noEmployees = buildDeps({
      employeeRepo: {
        find: jest.fn(async () => []),
        findOne: jest.fn(async () => null),
      } as any,
    });
    expect(
      (
        await handleAssignCardCreatorLogic(noEmployees, 'biz-1', {
          giftCardId: 'gc-1',
          employeeName: 'Ghost',
        })
      ).success,
    ).toBe(false);

    expect(
      (
        await handleMarkDeliveredLogic(
          buildDeps({
            fulfillmentService: { markDelivered: jest.fn(throwNoMsg) } as any,
          }),
          'biz-1',
          { giftCardId: 'gc-1' },
        )
      ).summary,
    ).toContain('Could not mark order');

    const withInstructions = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          shippingAddress: {
            recipientName: 'Addr Name',
            line1: '1 Main',
            city: 'Boston',
            postalCode: '02101',
            country: 'US',
            instructions: 'Leave at door',
          },
        })),
      } as any,
    });
    expect(
      (
        await handleCaptureDeliveryProofLogic(withInstructions, 'biz-1', {
          giftCardId: 'gc-1',
          proofNote: 'signed',
        })
      ).success,
    ).toBe(true);

    const digitalOrder = buildDeps({
      giftCardOrderService: {
        getCustomerOrder: jest.fn(async () => ({
          id: 'gc-1',
          deliveryMethod: 'digital',
          fulfillmentStatus: 'pending',
        })),
      } as any,
    });
    expect(
      (
        await handleTrackGiftCardShipmentLogic(digitalOrder, 'biz-1', {
          sessionCustomerId: 'c1',
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(false);

    const bareCatalog = buildDeps({
      giftCardPurchaseService: {
        getPublicCatalog: jest.fn(async () => ({
          purchaseEnabled: true,
          settings: { physicalDeliveryEnabled: true },
        })),
        quotePurchase: jest.fn(async () => ({
          label: 'x',
          subtotal: 50,
          shippingFee: 0,
          total: 50,
        })),
      } as any,
    });
    expect(
      (await handleShippingMethodQuoteLogic(bareCatalog, 'biz-1', {})).success,
    ).toBe(true);

    const emptyQueueMerge = await handleFulfillmentCompoundLogic(
      buildDeps({
        fulfillmentService: {
          listCardCreationQueue: jest.fn(async () => []),
          listDashboardOrders: jest.fn(async () => ({
            orders: [],
            total: 0,
            page: 1,
            pageSize: 20,
          })),
        } as any,
      }),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'gift_card_creation_queue',
            params: { useFirstInQueue: true },
            segment: 'queue',
          },
          { action: 'list_gift_card_orders', params: {}, segment: 'list' },
        ],
      },
    );
    expect(emptyQueueMerge.success).toBe(true);

    expect(
      (
        await handleExtendCancelWindowLogic(deps, 'biz-1', {
          cancelModifyWindowHours: 12,
        })
      ).success,
    ).toBe(true);
    const nullSettingsBiz = buildDeps({
      businessRepo: {
        findOne: jest.fn(async () => ({ id: 'biz-1', settings: null })),
        save: jest.fn(async (b) => b),
      } as any,
    });
    expect(
      (
        await handleExtendCancelWindowLogic(nullSettingsBiz, 'biz-1', {
          cancelModifyWindowHours: 24,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleExtendCancelWindowLogic(deps, 'biz-1', {
          cancelModifyWindowHours: 0,
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleExtendCancelWindowLogic(deps, 'biz-1', {
          cancelModifyWindowHours: Number.NaN,
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleExtendCancelWindowLogic(
          deps,
          'biz-1',
          {},
          'extend cancel window 36 hours',
        )
      ).success,
    ).toBe(true);

    const bareRecipient = buildDeps({
      fulfillmentService: {
        getDashboardOrder: jest.fn(async () => ({
          ...physicalCard,
          shippingAddress: {
            line1: '1 Main',
            city: 'Boston',
            postalCode: '02101',
            country: 'US',
          },
          recipientName: null,
        })),
      } as any,
    });
    expect(
      (
        await handleCaptureDeliveryProofLogic(bareRecipient, 'biz-1', {
          giftCardId: 'gc-1',
          proofNote: 'ok',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleEnterShippingAddressLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
          giftCardId: 'gc-1',
          recipientName: 'Override Name',
          shippingAddress: {
            line1: '9 Elm',
            city: 'Boston',
            country: 'US',
            postalCode: '02101',
            recipientName: 'Sam',
          },
        })
      ).summary,
    ).toContain('validated for order');

    const noOrderList = buildDeps({
      giftCardOrderService: {
        listCustomerOrders: jest.fn(async () => []),
      } as any,
    });
    expect(
      (
        await handleTrackGiftCardShipmentLogic(noOrderList, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(false);

    const keepGiftCardId = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'filter_awaiting_creation',
            params: { giftCardId: 'preset-id' },
            segment: 'filter',
          },
          { action: 'print_packing_slip', params: {}, segment: 'slip' },
        ],
      },
    );
    expect(keepGiftCardId.success).toBe(true);

    const useFirstMerge = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'filter_awaiting_creation',
            params: { useFirstInQueue: true },
            segment: 'filter',
          },
          {
            action: 'assign_card_creator',
            params: { employeeName: 'Anna' },
            segment: 'assign',
          },
        ],
      },
    );
    expect(useFirstMerge.success).toBe(true);

    const emptyMerge = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'notify_delay',
            params: { delayReason: 'rain' },
            segment: 'delay',
          },
          { action: 'list_gift_card_orders', params: {}, segment: 'list' },
        ],
      },
    );
    expect(emptyMerge.success).toBe(true);

    const queueOnlyMerge = await handleFulfillmentCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'gift_card_creation_queue', params: {}, segment: 'queue' },
          { action: 'mark_card_ready', params: {}, segment: 'ready' },
        ],
      },
    );
    expect(queueOnlyMerge.success).toBe(true);

    expect(
      (
        await handleTrackGiftCardShipmentLogic(
          buildDeps({
            giftCardOrderService: {
              listCustomerOrders: jest.fn(async () => [
                {
                  id: 'gc-1',
                  deliveryMethod: 'physical',
                  fulfillmentStatus: 'processing',
                  trackingCarrier: null,
                  trackingNumber: null,
                },
              ]),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'c1' },
        )
      ).details,
    ).toMatchObject({ tracking: { shippedAt: false } });

    expect(
      (
        await handleTrackGiftCardShipmentLogic(
          buildDeps({
            giftCardOrderService: {
              listCustomerOrders: jest.fn(async () => [
                {
                  id: 'gc-1',
                  deliveryMethod: 'physical',
                  fulfillmentStatus: 'delivered',
                  trackingCarrier: 'FedEx',
                  trackingNumber: 'Z9',
                },
              ]),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'c1' },
        )
      ).summary,
    ).toContain('carrier FedEx');

    const listMerge = await handleFulfillmentCompoundLogic(
      buildDeps({
        fulfillmentService: {
          listDashboardOrders: jest.fn(async () => ({
            orders: [],
            total: 0,
            page: 1,
            pageSize: 20,
          })),
          listCardCreationQueue: jest.fn(async () => [physicalCard]),
          getDashboardOrder: jest.fn(async () => physicalCard),
        } as any,
      }),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_gift_card_orders', params: {}, segment: 'list' },
          { action: 'gift_card_creation_queue', params: {}, segment: 'queue' },
        ],
      },
    );
    expect(listMerge.success).toBe(true);
  });

  describe('handleUpdateGiftCardSettingsLogic (ai-cmd-dashboard-6.10)', () => {
    it('clarifies when no field is given', async () => {
      const result = await handleUpdateGiftCardSettingsLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(result.success).toBe(false);
    });

    it('updates gift card settings', async () => {
      const deps = buildDeps();
      const result = await handleUpdateGiftCardSettingsLogic(deps, 'biz-1', {
        defaultExpiryMonths: 12,
        digitalDeliveryEnabled: false,
      });
      expect(result.success).toBe(true);
      expect(deps.businessRepo.save).toHaveBeenCalled();
      expect(result.details.settings.defaultExpiryMonths).toBe(12);
      expect(result.details.settings.digitalDeliveryEnabled).toBe(false);
    });

    it('fails when business is not found', async () => {
      const deps = buildDeps({
        businessRepo: { findOne: jest.fn(async () => null), save: jest.fn() } as any,
      });
      const result = await handleUpdateGiftCardSettingsLogic(deps, 'biz-1', {
        defaultExpiryMonths: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleListGiftCardChangeRequestsLogic (ai-cmd-dashboard-6.10)', () => {
    it('lists change requests', async () => {
      const deps = buildDeps();
      const result = await handleListGiftCardChangeRequestsLogic(
        deps,
        'biz-1',
        {},
      );
      expect(result.success).toBe(true);
      expect(result.details.requests).toHaveLength(1);
    });

    it('reports none found', async () => {
      const deps = buildDeps({
        giftCardOrderService: {
          listChangeRequests: jest.fn(async () => []),
          resolveChangeRequest: jest.fn(),
        } as any,
      });
      const result = await handleListGiftCardChangeRequestsLogic(
        deps,
        'biz-1',
        {},
      );
      expect(result.success).toBe(true);
      expect(result.summary).toMatch(/No gift card change requests/);
    });
  });

  describe('handleResolveGiftCardChangeRequestLogic (ai-cmd-dashboard-6.10)', () => {
    it('clarifies when requestId/resolution missing', async () => {
      const result = await handleResolveGiftCardChangeRequestLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('resolves the change request', async () => {
      const deps = buildDeps();
      const result = await handleResolveGiftCardChangeRequestLogic(
        deps,
        'biz-1',
        { requestId: 'req-1', resolution: 'approve' },
      );
      expect(result.success).toBe(true);
      expect(deps.giftCardOrderService.resolveChangeRequest).toHaveBeenCalledWith(
        'biz-1',
        'req-1',
        'approve',
        undefined,
      );
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        giftCardOrderService: {
          listChangeRequests: jest.fn(),
          resolveChangeRequest: jest.fn(async () => {
            throw new Error('This request has already been resolved');
          }),
        } as any,
      });
      const result = await handleResolveGiftCardChangeRequestLogic(
        deps,
        'biz-1',
        { requestId: 'req-1', resolution: 'deny' },
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('already been resolved');
    });
  });

  describe('handleGiftFulfillBatchLogic (ai-cmd-dashboard-6.10)', () => {
    it('reports nothing to ship when queue is empty', async () => {
      const deps = buildDeps({
        fulfillmentService: {
          listDashboardOrders: jest.fn(async () => ({
            orders: [],
            total: 0,
            page: 1,
            pageSize: 20,
          })),
        } as any,
      });
      const result = await handleGiftFulfillBatchLogic(deps, 'biz-1', {});
      expect(result.success).toBe(true);
      expect(result.details.shipped).toEqual([]);
    });

    it('ships the first N ready orders', async () => {
      const deps = buildDeps({
        fulfillmentService: {
          listDashboardOrders: jest.fn(async () => ({
            orders: [
              { ...physicalCard, id: 'gc-1' },
              { ...physicalCard, id: 'gc-2' },
            ],
            total: 2,
            page: 1,
            pageSize: 20,
          })),
          markShipped: jest.fn(async (_biz: string, id: string) => ({
            ...physicalCard,
            id,
            fulfillmentStatus: 'shipped',
          })),
        } as any,
      });
      const result = await handleGiftFulfillBatchLogic(deps, 'biz-1', {
        count: 2,
      });
      expect(result.success).toBe(true);
      expect(result.details.shipped).toHaveLength(2);
      expect(deps.fulfillmentService.markShipped).toHaveBeenCalledTimes(2);
    });

    it('reports partial failures', async () => {
      const deps = buildDeps({
        fulfillmentService: {
          listDashboardOrders: jest.fn(async () => ({
            orders: [{ ...physicalCard, id: 'gc-1' }],
            total: 1,
            page: 1,
            pageSize: 20,
          })),
          markShipped: jest.fn(async () => {
            throw new Error('Order already shipped');
          }),
        } as any,
      });
      const result = await handleGiftFulfillBatchLogic(deps, 'biz-1', {});
      expect(result.success).toBe(true);
      expect(result.details.shipped).toEqual([]);
      expect(result.details.failed).toHaveLength(1);
    });
  });
});
