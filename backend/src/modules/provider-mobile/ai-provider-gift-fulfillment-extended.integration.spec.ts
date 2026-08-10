import { describe, expect, it, jest } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI gift fulfillment extended (ai-cmd-provider-5.20)', () => {
  const businessId = 'biz-520';
  const userId = 'user-520';
  const employeeId = 'emp-520';

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  it('dispatches explain_gift_card_order_details (ai-cmd-provider-5.20.5)', async () => {
    const llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'explain_gift_card_order_details',
        params: { giftCardId: 'gc-1' },
        reasoning: 'test',
      })),
    };
    const providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
    const giftFulfillment = {
      handleExplainGiftCardOrderDetails: jest.fn(async () => ({
        success: true,
        action: 'explain_gift_card_order_details',
        summary:
          'Order gc-1 — service gift card, USD 100.00 (USD 100.00 remaining).',
        details: { giftCardId: 'gc-1' },
      })),
    };
    const service = createProviderAiCommandHarness({
      llm,
      providerMobile,
      giftFulfillment,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      "What's on this gift order?",
      [],
    );

    expect(result.action).toBe('explain_gift_card_order_details');
    expect(result.success).toBe(true);
    expect(
      giftFulfillment.handleExplainGiftCardOrderDetails,
    ).toHaveBeenCalled();
  });
});
