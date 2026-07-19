import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI gift card fulfillment dispatch (ai-cmd-provider-6.10)', () => {
  const businessId = 'biz-610';
  const userId = 'user-610';
  const employeeId = 'emp-610';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let giftFulfillment: {
    rescueFulfillmentIntent: jest.Mock<any>;
    isFulfillmentCompound: jest.Mock<any>;
    decomposeFulfillmentCompound: jest.Mock<any>;
    handleFulfillmentCompound: jest.Mock<any>;
    handleGiftCardCreationQueue: jest.Mock<any>;
    handleStartCardPreparation: jest.Mock<any>;
    handleMarkCardReady: jest.Mock<any>;
    handleDeliveryQueue: jest.Mock<any>;
    handleAcceptDelivery: jest.Mock<any>;
    handleMarkOutForDelivery: jest.Mock<any>;
    handleMarkDelivered: jest.Mock<any>;
    handleCaptureDeliveryProof: jest.Mock<any>;
    handleNotifyDelay: jest.Mock<any>;
  };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  function okResult(action: string) {
    return jest.fn(async () => ({
      success: true,
      action,
      summary: `${action} ok`,
      details: {},
    }));
  }

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    giftFulfillment = {
      rescueFulfillmentIntent: jest.fn(() => null),
      isFulfillmentCompound: jest.fn(() => false),
      decomposeFulfillmentCompound: jest.fn(() => []),
      handleFulfillmentCompound: jest.fn(async () => ({
        success: true,
        action: 'compound_intent',
        summary: 'queue then ready',
        details: {},
      })),
      handleGiftCardCreationQueue: okResult('gift_card_creation_queue'),
      handleStartCardPreparation: okResult('start_card_preparation'),
      handleMarkCardReady: okResult('mark_card_ready'),
      handleDeliveryQueue: okResult('delivery_queue'),
      handleAcceptDelivery: okResult('accept_delivery'),
      handleMarkOutForDelivery: okResult('mark_out_for_delivery'),
      handleMarkDelivered: okResult('mark_delivered'),
      handleCaptureDeliveryProof: okResult('capture_delivery_proof'),
      handleNotifyDelay: okResult('notify_delay'),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      giftFulfillment,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown> = {}) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it.each([
    ['gift_card_creation_queue', 'handleGiftCardCreationQueue'],
    ['start_card_preparation', 'handleStartCardPreparation'],
    ['mark_card_ready', 'handleMarkCardReady'],
    ['delivery_queue', 'handleDeliveryQueue'],
    ['accept_delivery', 'handleAcceptDelivery'],
    ['mark_out_for_delivery', 'handleMarkOutForDelivery'],
    ['mark_delivered', 'handleMarkDelivered'],
    ['capture_delivery_proof', 'handleCaptureDeliveryProof'],
    ['notify_delay', 'handleNotifyDelay'],
  ] as const)('dispatches %s to giftFulfillment.%s', async (action, method) => {
    mockIntent(action, { giftCardId: 'gc-1' });

    const result = await service.executeCommand(
      businessId,
      userId,
      `Do ${action}`,
      [],
    );

    expect(result.action).toBe(action);
    expect(giftFulfillment[method]).toHaveBeenCalled();
    expect(giftFulfillment[method].mock.calls[0][0]).toBe(businessId);
  });

  it('short-circuits to the fulfillment compound when isFulfillmentCompound is true', async () => {
    giftFulfillment.isFulfillmentCompound.mockReturnValue(true);
    giftFulfillment.handleFulfillmentCompound.mockResolvedValue({
      success: true,
      action: 'compound_intent',
      summary: 'Listed queue then marked ready.',
      details: { compound: true },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Show the gift card creation queue and mark the card ready',
      [],
    );

    expect(result.action).toBe('compound_intent');
    expect(giftFulfillment.handleFulfillmentCompound).toHaveBeenCalledWith(
      businessId,
      'Show the gift card creation queue and mark the card ready',
      expect.any(Object),
      userId,
    );
  });
});
