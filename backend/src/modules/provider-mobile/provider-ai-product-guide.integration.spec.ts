import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';
import { PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS } from '../ai/ai-provider-product-guide.fixtures.js';

describe('Provider product guide intents (ai-guide-1.4.1)', () => {
  const businessId = 'biz-guide-14';
  const userId = 'user-guide-14';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock };
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
  };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: 'emp-1', name: 'Alex Provider' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => 'emp-1'),
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

  it.each(PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS)(
    'rescue-dispatches $id via unified guide handler',
    async ({ prompt, intent }) => {
      llm.completeJson.mockResolvedValueOnce({
        action: 'unknown',
        params: {},
        reasoning: 'harness unknown',
      });

      const result = await service.executeCommand(
        businessId,
        userId,
        prompt,
        [],
        { route: '/tabs/today', mobileRoute: '/tabs/today' },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe(intent);
      expect(result.guide?.steps.length).toBeGreaterThan(0);
      expect(result.guide?.topicId).toMatch(/^provider-/);
    },
  );

  it('short-circuits invite FAQ before classifier via rescue', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'What is this invite link?',
      [],
      { mobileRoute: '/accept-invite' },
    );

    expect(llm.completeJson).not.toHaveBeenCalled();
    expect(result.action).toBe('explain_staff_invite');
    expect(result.guide?.topicId).toBe('provider-staff-invite');
  });
});

describe('Provider voice next client (ai-guide-1.4.4 / 5.24.5)', () => {
  const businessId = 'biz-guide-144';
  const userId = 'user-guide-144';

  let service: ReturnType<typeof createProviderAiCommandHarness>;

  beforeEach(() => {
    service = createProviderAiCommandHarness({
      llm: {
        isAvailableForBusiness: jest.fn(async () => true),
        completeJson: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => ({
          viewMode: 'provider' as const,
          membershipRole: MemberRole.STAFF,
          employee: { id: 'emp-1', name: 'Alex Provider' },
        })),
        getScopedEmployeeId: jest.fn(() => 'emp-1'),
      },
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

  it('short-circuits read-next prompt before classifier', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'Read me my next appointment',
      [],
      { route: '/tabs/today', mobileRoute: 'today' },
    );

    expect(result.action).toBe('voice_summarize_next_client');
    expect(result.details?.autoSpeak).toBe(true);
    expect(String(result.details?.voiceSummary)).toBeTruthy();
  });
});

describe('Provider guide screen context (ai-guide-1.4.2)', () => {
  const businessId = 'biz-guide-142';
  const userId = 'user-guide-142';

  let service: ReturnType<typeof createProviderAiCommandHarness>;

  beforeEach(() => {
    service = createProviderAiCommandHarness({
      llm: {
        isAvailableForBusiness: jest.fn(async () => true),
        completeJson: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      },
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => ({
          viewMode: 'provider' as const,
          membershipRole: MemberRole.STAFF,
          employee: { id: 'emp-1', name: 'Alex Provider' },
        })),
        getScopedEmployeeId: jest.fn(() => 'emp-1'),
      },
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

  it.each([
    {
      id: 'today-clients',
      context: {
        route: '/tabs/today',
        tab: 'today',
        mobileRoute: 'today',
        assistantMode: 'guide' as const,
      },
      prompt: 'What can I do on this page?',
      topicId: 'provider-appointments',
    },
    {
      id: 'calendar-view',
      context: {
        screenContext: {
          route: '/tabs/calendar',
          tab: 'calendar',
          mobileRoute: 'schedule',
        },
        assistantMode: 'guide' as const,
      },
      prompt: 'What am I looking at here on this screen?',
      topicId: 'provider-calendar',
    },
    {
      id: 'profile-settings',
      context: {
        route: '/tabs/profile',
        tab: 'profile',
        mobileRoute: 'profile',
        assistantMode: 'guide' as const,
      },
      prompt: 'Help me with this page',
      topicId: 'provider-profile-settings',
    },
  ])(
    'routes $id screen context to $topicId playbook',
    async ({ context, prompt, topicId }) => {
      const result = await service.executeCommand(
        businessId,
        userId,
        prompt,
        [],
        context,
      );

      expect(result.success).toBe(true);
      expect(result.guide?.topicId).toBe(topicId);
      expect(String(result.details?.voiceSummary)).toBeTruthy();
    },
  );
});
