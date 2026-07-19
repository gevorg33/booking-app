import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';
import { EXPLAIN_PROVIDER_CONTEXT_PROMPTS } from '../ai/ai-explain-provider-context.fixtures.js';

describe('explain_provider_context (ai-cmd-provider-6.1.2)', () => {
  const businessId = 'biz-context-1';
  const userId = 'user-context-1';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock };
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
    getContext: jest.Mock<any>;
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'explain_provider_context',
        params: {},
        reasoning: 'harness classified',
      })),
    };
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => ({
        viewMode: 'team' as const,
        membershipRole: MemberRole.OWNER,
        employee: { id: 'emp-1', name: 'Alex Owner' },
      })),
      getScopedEmployeeId: jest.fn(() => 'emp-1'),
      getContext: jest.fn(async () => ({
        membershipRole: MemberRole.OWNER,
        viewMode: 'team',
        employee: { id: 'emp-1', name: 'Alex Owner', email: null, phone: null },
        canUseProviderApp: true,
        labFeaturesEnabled: false,
        retailPosEnabled: true,
        whatsappContactEnabled: true,
      })),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile,
      providerBooking: {
        isProviderBookingCompound: jest.fn(() => false),
        handleProviderBookingCompound: jest.fn(),
      },
      pushNotifications: {
        isPushNotificationsCompound: jest.fn(() => false),
        handlePushNotificationsCompound: jest.fn(),
      },
    });
  });

  it.each(EXPLAIN_PROVIDER_CONTEXT_PROMPTS)(
    'classifies and dispatches $id to a live context read',
    async ({ prompt }) => {
      const result = await service.executeCommand(businessId, userId, prompt);

      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_provider_context');
      expect(result.summary).toContain('team view');
      expect(result.summary).toContain('retail POS');
      expect(result.summary).toContain('WhatsApp contact');
      expect(providerMobile.getContext).toHaveBeenCalledWith(
        businessId,
        userId,
      );
      expect(result.details?.context).toBeDefined();
    },
  );

  it('reports no extra features when none are enabled', async () => {
    providerMobile.getContext.mockResolvedValueOnce({
      membershipRole: MemberRole.STAFF,
      viewMode: 'provider',
      employee: null,
      canUseProviderApp: true,
      labFeaturesEnabled: false,
      retailPosEnabled: false,
      whatsappContactEnabled: false,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'What can I see right now?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('no extra features enabled');
  });
});
